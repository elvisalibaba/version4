<?php

namespace App\Services;

use App\Models\AuthorPayout;
use App\Models\AuthorPayoutAccount;
use App\Models\AuthorRoyaltyAccount;
use App\Models\AuthorRoyaltyTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Profile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthorRoyaltyService
{
    public function accrueOrder(Order $order): void
    {
        $order->loadMissing(['items.book.distributionSetting', 'items.format']);

        foreach ($order->items as $item) {
            $this->accrueOrderItem($order, $item);
        }
    }

    public function accrueOrderItem(Order $order, OrderItem $item): ?AuthorRoyaltyTransaction
    {
        if ($item->book === null || $item->book->author_id === null) {
            return null;
        }

        // Publishing-house catalogue authors may exist before they receive
        // a HolisticBooks user account. Do not fail a paid order because the
        // financial wallet cannot exist yet. Royalties start accruing once
        // the author is linked to a platform profile.
        if (! Profile::query()->whereKey($item->book->author_id)->exists()) {
            return null;
        }

        if (AuthorRoyaltyTransaction::query()->where('order_item_id', $item->id)->exists()) {
            return AuthorRoyaltyTransaction::query()->where('order_item_id', $item->id)->first();
        }

        $quantity = max(1, (int) $item->quantity);
        $grossAmount = round((float) $item->price * $quantity, 2);
        $printingCost = in_array($item->book_format, ['paperback', 'pocket', 'hardcover'], true)
            ? round((float) ($item->format?->printing_cost ?? 0) * $quantity, 2)
            : 0.0;

        $royaltyBase = max(0, $grossAmount - $printingCost);
        $configuredRate = $item->book->distributionSetting?->royalty_rate;
        $royaltyRate = $configuredRate !== null
            ? (float) $configuredRate
            : (float) config('publishing.default_royalty_rate', 0.70);

        $royaltyRate = min(1, max(0, $royaltyRate));
        $netRoyalty = round($royaltyBase * $royaltyRate, 2);
        $platformFee = round(max(0, $royaltyBase - $netRoyalty), 2);
        $payableAt = now()->addDays(max(0, (int) config('publishing.payout_delay_days', 30)));

        return DB::transaction(function () use (
            $order,
            $item,
            $grossAmount,
            $printingCost,
            $royaltyRate,
            $netRoyalty,
            $platformFee,
            $payableAt,
            $quantity,
        ): AuthorRoyaltyTransaction {
            $transaction = AuthorRoyaltyTransaction::query()->create([
                'user_id' => $item->book->author_id,
                'book_id' => $item->book_id,
                'order_id' => $order->id,
                'order_item_id' => $item->id,
                'source' => in_array($item->book_format, ['paperback', 'pocket', 'hardcover'], true) ? 'print' : 'ebook',
                'gross_amount' => $grossAmount,
                'printing_cost' => $printingCost,
                'platform_fee' => $platformFee,
                'tax_withholding' => 0,
                'royalty_rate' => $royaltyRate,
                'net_royalty' => $netRoyalty,
                'currency_code' => $item->currency_code,
                'status' => 'pending',
                'earned_at' => now(),
                'payable_at' => $payableAt,
                'metadata' => [
                    'book_format' => $item->book_format,
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->price,
                    'original_unit_price' => $item->original_price !== null ? (float) $item->original_price : (float) $item->price,
                    'promotion_campaign_id' => $item->promotion_campaign_id,
                    'discount_amount' => round(max(0, ((float) ($item->original_price ?? $item->price) - (float) $item->price) * $quantity), 2),
                    'payment_provider' => $order->payment_provider,
                    'payment_reference' => $order->payment_transaction_id,
                ],
            ]);

            // Un portefeuille par devise : la royalty est toujours créditée,
            // quelle que soit la devise de la vente.
            $account = AuthorRoyaltyAccount::query()->firstOrCreate(
                ['user_id' => $item->book->author_id, 'currency_code' => mb_strtoupper((string) $item->currency_code)],
                [
                    'minimum_payout' => (float) config('publishing.minimum_payout', 10),
                    'status' => 'active',
                ],
            );

            $account->increment('pending_balance', $netRoyalty);
            $account->increment('lifetime_earnings', $netRoyalty);

            return $transaction;
        });
    }

    public function releasePayable(): int
    {
        $released = 0;

        AuthorRoyaltyTransaction::query()
            ->where('status', 'pending')
            ->whereNotNull('payable_at')
            ->where('payable_at', '<=', now())
            ->orderBy('payable_at')
            ->chunkById(100, function ($transactions) use (&$released): void {
                foreach ($transactions as $transaction) {
                    DB::transaction(function () use ($transaction, &$released): void {
                        $locked = AuthorRoyaltyTransaction::query()->lockForUpdate()->find($transaction->id);

                        if (! $locked || $locked->status !== 'pending' || $locked->payable_at?->isFuture()) {
                            return;
                        }

                        $account = AuthorRoyaltyAccount::query()
                            ->forCurrency($locked->user_id, $locked->currency_code)
                            ->lockForUpdate()
                            ->first();

                        if (! $account) {
                            return;
                        }

                        $locked->update(['status' => 'payable']);

                        $account->pending_balance = max(0, (float) $account->pending_balance - (float) $locked->net_royalty);
                        $account->available_balance = (float) $account->available_balance + (float) $locked->net_royalty;
                        $account->save();

                        $released++;
                    });
                }
            });

        return $released;
    }

    public function requestPayout(string $userId, AuthorPayoutAccount $payoutAccount, float $amount): AuthorPayout
    {
        return DB::transaction(function () use ($userId, $payoutAccount, $amount): AuthorPayout {
            if ($payoutAccount->user_id !== $userId || ! $payoutAccount->is_verified) {
                throw ValidationException::withMessages([
                    'payout_account_id' => 'Le compte de versement doit être vérifié et appartenir à cet auteur.',
                ]);
            }

            // On débite le portefeuille de la devise du compte de versement.
            $account = AuthorRoyaltyAccount::query()
                ->forCurrency($userId, $payoutAccount->currency_code)
                ->lockForUpdate()
                ->first();

            if ($account === null) {
                throw ValidationException::withMessages([
                    'payout_account_id' => 'Aucun solde de royalties dans la devise de ce compte de versement.',
                ]);
            }

            $minimum = max((float) $account->minimum_payout, 0);

            if ($amount < $minimum) {
                throw ValidationException::withMessages([
                    'amount' => 'Le montant demandé est inférieur au seuil minimum de versement.',
                ]);
            }

            if ($amount > (float) $account->available_balance) {
                throw ValidationException::withMessages([
                    'amount' => 'Le solde disponible est insuffisant.',
                ]);
            }

            $account->available_balance = (float) $account->available_balance - $amount;
            $account->save();

            return AuthorPayout::query()->create([
                'user_id' => $userId,
                'payout_account_id' => $payoutAccount->id,
                'amount' => $amount,
                'currency_code' => $account->currency_code,
                'status' => 'requested',
                'requested_at' => now(),
            ]);
        });
    }

    public function approvePayout(AuthorPayout $payout): AuthorPayout
    {
        if ($payout->status === 'requested') {
            $payout->update(['status' => 'approved']);
        }

        return $payout->fresh();
    }

    public function startPayoutProcessing(AuthorPayout $payout): AuthorPayout
    {
        if (in_array($payout->status, ['requested', 'approved'], true)) {
            $payout->update(['status' => 'processing']);
        }

        return $payout->fresh();
    }

    public function markPayoutPaid(AuthorPayout $payout, ?string $reference = null): AuthorPayout
    {
        return DB::transaction(function () use ($payout, $reference): AuthorPayout {
            $locked = AuthorPayout::query()->lockForUpdate()->findOrFail($payout->id);

            if ($locked->status === 'paid') {
                return $locked;
            }

            if (in_array($locked->status, ['rejected', 'cancelled'], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Ce versement ne peut plus être marqué comme payé.',
                ]);
            }

            $locked->update([
                'status' => 'paid',
                'provider_reference' => $reference ?: $locked->provider_reference,
                'processed_at' => now(),
            ]);

            $account = AuthorRoyaltyAccount::query()
                ->forCurrency($locked->user_id, $locked->currency_code)
                ->lockForUpdate()
                ->first();

            if ($account) {
                $account->lifetime_paid = (float) $account->lifetime_paid + (float) $locked->amount;
                $account->save();
            }

            return $locked->fresh();
        });
    }

    public function rejectPayout(AuthorPayout $payout, ?string $notes = null): AuthorPayout
    {
        return $this->restorePayoutBalance($payout, 'rejected', $notes);
    }

    public function failPayout(AuthorPayout $payout, ?string $notes = null): AuthorPayout
    {
        return $this->restorePayoutBalance($payout, 'failed', $notes);
    }

    private function restorePayoutBalance(AuthorPayout $payout, string $status, ?string $notes): AuthorPayout
    {
        return DB::transaction(function () use ($payout, $status, $notes): AuthorPayout {
            $locked = AuthorPayout::query()->lockForUpdate()->findOrFail($payout->id);

            if (in_array($locked->status, ['paid', 'rejected', 'cancelled', 'failed'], true)) {
                return $locked;
            }

            $account = AuthorRoyaltyAccount::query()
                ->forCurrency($locked->user_id, $locked->currency_code)
                ->lockForUpdate()
                ->first();

            if ($account) {
                $account->available_balance = (float) $account->available_balance + (float) $locked->amount;
                $account->save();
            }

            $locked->update([
                'status' => $status,
                'notes' => $notes ?: $locked->notes,
                'processed_at' => now(),
            ]);

            return $locked->fresh();
        });
    }
}
