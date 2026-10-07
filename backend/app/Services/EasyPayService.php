<?php

namespace App\Services;

use App\Models\Book;
use App\Models\BookFormat;
use App\Models\Library;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\Profile;
use App\Notifications\PaymentReceiptNotification;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class EasyPayService
{
    public function initialize(Profile $profile, array $data): array
    {
        $providedIdempotencyKey = trim((string) ($data['idempotency_key'] ?? ''));
        $existing = $providedIdempotencyKey !== ''
            ? PaymentAttempt::query()->where('idempotency_key', $providedIdempotencyKey)->first()
            : null;

        if ($existing !== null) {
            abort_unless($existing->user_id === $profile->id, 404);

            $order = $existing->order_id
                ? $this->loadPendingOrPaidOrder($profile, $existing->order_id)
                : null;

            if ($order && $existing->provider_reference && in_array($existing->status, ['pending', 'processing', 'paid'], true)) {
                return [
                    'orderId' => $order->id,
                    'transactionId' => $existing->provider_reference,
                    'paymentUrl' => $this->paymentUrl($existing->provider_reference),
                    'reused' => true,
                ];
            }
        }

        $order = $existing?->order_id
            ? $this->loadPendingOrder($profile, $existing->order_id)
            : (isset($data['order_id'])
                ? $this->loadPendingOrder($profile, $data['order_id'])
                : $this->createSingleBookOrder($profile, $data));

        if (! in_array($order->currency_code, ['USD', 'CDF'], true)) {
            throw ValidationException::withMessages([
                'currency_code' => 'Le paiement en ligne accepte uniquement les commandes en USD ou CDF.',
            ]);
        }

        $channel = $data['channel'] ?? 'ALL';
        $idempotencyKey = $providedIdempotencyKey !== ''
            ? $providedIdempotencyKey
            : 'checkout:'.$profile->id.':'.$order->id;

        $existing ??= PaymentAttempt::query()
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existing && in_array($existing->status, ['pending', 'processing', 'paid'], true) && $existing->provider_reference) {
            return [
                'orderId' => $order->id,
                'transactionId' => $existing->provider_reference,
                'paymentUrl' => $this->paymentUrl($existing->provider_reference),
                'reused' => true,
            ];
        }

        $attempt = $existing ?? PaymentAttempt::query()->firstOrCreate(
            ['idempotency_key' => $idempotencyKey],
            [
                'user_id' => $profile->id,
                'order_id' => $order->id,
                'provider' => 'easypay',
                'payment_channel' => $channel,
                'amount' => $order->total_price,
                'currency_code' => $order->currency_code,
                'status' => 'created',
                'request_payload' => [],
                'response_payload' => [],
            ],
        );

        if ($attempt->user_id !== $profile->id || $attempt->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'idempotency_key' => 'Cette clé d’idempotence est déjà liée à une autre opération.',
            ]);
        }

        $customer = $data['customer'] ?? [];
        $requestPayload = [
            'order_ref' => $this->orderReference($order),
            'currency' => $order->currency_code,
            'amount' => (float) $order->total_price,
            'description' => $this->description($order),
            'success_url' => $this->frontendUrl('/payment/return?orderId='.$order->id),
            'cancel_url' => $this->frontendUrl('/payment/return?orderId='.$order->id),
            'error_url' => $this->frontendUrl('/payment/return?orderId='.$order->id),
            'language' => 'FR',
            'channels' => $this->channels($channel),
            'customer_name' => trim(($customer['firstName'] ?? '').' '.($customer['lastName'] ?? '')) ?: ($customer['email'] ?? 'Client HolistiqueBooks'),
        ];

        if (! empty($customer['email'])) {
            $requestPayload['customer_email'] = $customer['email'];
        }

        $attempt->update([
            'status' => 'processing',
            'request_payload' => $requestPayload,
        ]);

        try {
            $response = $this->http()->post($this->initializationUrl(), $requestPayload);
            $payload = $response->json();

            if (! $response->successful()) {
                throw new RuntimeException('Le service de paiement est temporairement indisponible. Réessayez dans un instant.');
            }

            $reference = data_get($payload, 'reference') ?: data_get($payload, 'transaction.reference');
            $code = data_get($payload, 'code');

            if (! $reference || ($code !== null && (string) $code !== '1')) {
                throw new RuntimeException((string) (data_get($payload, 'message') ?: 'Le paiement n’a pas pu être lancé. Réessayez dans un instant.'));
            }

            DB::transaction(function () use ($attempt, $order, $reference, $payload, $channel): void {
                $attempt->update([
                    'provider_reference' => $reference,
                    'status' => 'pending',
                    'response_payload' => is_array($payload) ? $payload : [],
                ]);

                $order->update([
                    'payment_status' => 'pending',
                    'payment_provider' => 'easypay',
                    'payment_transaction_id' => $reference,
                    'payment_channel' => $channel,
                    'payment_provider_status' => 'INITIATED',
                    'payment_metadata' => array_merge($order->payment_metadata ?? [], [
                        'payment_attempt_id' => $attempt->id,
                        'provider_reference' => $reference,
                        'easypay_order_ref' => $this->orderReference($order),
                    ]),
                ]);
            });

            return [
                'orderId' => $order->id,
                'transactionId' => $reference,
                'paymentUrl' => $this->paymentUrl($reference),
                'reused' => false,
            ];
        } catch (Throwable $error) {
            $attempt->update([
                'status' => 'failed',
                'failed_at' => now(),
                'failure_reason' => $error->getMessage(),
            ]);

            $order->update([
                'payment_status' => 'failed',
                'payment_provider' => 'easypay',
                'payment_provider_status' => 'INIT_FAILED',
            ]);

            throw $error;
        }
    }

    public function reconcileOrder(Profile $profile, Order $order): array
    {
        abort_unless($order->user_id === $profile->id || $profile->role === 'admin', 404);

        if (! $order->payment_transaction_id) {
            throw ValidationException::withMessages(['order' => 'Cette commande ne possède aucune référence de paiement.']);
        }

        return $this->reconcileReference($order->payment_transaction_id);
    }

    public function reconcileReference(string $reference): array
    {
        $order = Order::query()
            ->where('payment_transaction_id', $reference)
            ->with(['items.book', 'items.format'])
            ->firstOrFail();

        $attempt = PaymentAttempt::query()
            ->where('provider', 'easypay')
            ->where('provider_reference', $reference)
            ->latest()
            ->first();

        $result = $this->verify($reference);
        $providerStatus = strtoupper((string) data_get($result, 'payment.status', 'UNKNOWN'));

        $status = match ($providerStatus) {
            'SUCCESS' => 'paid',
            'CANCELED', 'CANCELLED', 'DECLINED', 'FAILED' => 'failed',
            default => 'pending',
        };

        $wasAlreadyPaid = false;

        DB::transaction(function () use ($order, $attempt, $result, $providerStatus, $status, &$wasAlreadyPaid): void {
            $lockedOrder = Order::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->with(['items.book', 'items.format'])
                ->firstOrFail();

            $wasAlreadyPaid = $lockedOrder->payment_status === 'paid';

            if (! $wasAlreadyPaid) {
                $lockedOrder->payment_status = $status;
            }

            $lockedOrder->payment_provider = 'easypay';
            $lockedOrder->payment_provider_status = $providerStatus;
            $lockedOrder->payment_verified_at = now();
            $lockedOrder->payment_metadata = array_merge($lockedOrder->payment_metadata ?? [], [
                'last_verification_at' => now()->toIso8601String(),
                'last_verification' => $result,
            ]);
            $lockedOrder->save();

            if ($attempt) {
                PaymentAttempt::query()
                    ->whereKey($attempt->id)
                    ->lockForUpdate()
                    ->first()?->update([
                        'status' => $status,
                        'response_payload' => $result,
                        'verified_at' => now(),
                        'failed_at' => $status === 'failed' ? now() : null,
                    ]);
            }

            if ($status === 'paid' && ! $wasAlreadyPaid) {
                $this->grantDigitalPurchases($lockedOrder);
                app(AuthorRoyaltyService::class)->accrueOrder($lockedOrder);
            }
        });

        $freshOrder = $order->fresh(['profile.user', 'items.book']);

        if ($status === 'paid' && ! $wasAlreadyPaid && $freshOrder?->payment_receipt_sent_at === null) {
            $this->sendPaymentReceipt($freshOrder);
        }

        return [
            'orderId' => $order->id,
            'paymentStatus' => $order->fresh()->payment_status,
            'providerStatus' => $providerStatus,
            'transactionId' => $reference,
        ];
    }

    public function extractReference(array $payload): ?string
    {
        foreach (['reference', 'cpm_trans_id', 'transaction_id', 'trans_id'] as $key) {
            if (filled($payload[$key] ?? null)) {
                return trim((string) $payload[$key]);
            }
        }

        return data_get($payload, 'transaction.reference') ?: data_get($payload, 'payment.reference');
    }

    private function sendPaymentReceipt(Order $order): void
    {
        $user = $order->profile?->user;

        if ($user === null || $user->email_verified_at === null) {
            return;
        }

        // Claim the receipt atomically before sending so concurrent EasyPay
        // callbacks cannot deliver duplicate receipts.
        $claimed = Order::query()
            ->whereKey($order->id)
            ->whereNull('payment_receipt_sent_at')
            ->update(['payment_receipt_sent_at' => now()]);

        if ($claimed !== 1) {
            return;
        }

        try {
            $user->notify(new PaymentReceiptNotification($order->fresh(['items.book'])));
        } catch (Throwable $error) {
            // Release the claim so a later reconciliation can retry. The mail itself
            // is queued (cron worker), so only enqueueing errors land here.
            Order::query()
                ->whereKey($order->id)
                ->update(['payment_receipt_sent_at' => null]);

            Log::warning('Impossible d’envoyer le reçu de paiement Holistique Books.', [
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'exception' => $error,
            ]);
        }
    }

    private function createSingleBookOrder(Profile $profile, array $data): Order
    {
        $book = Book::query()
            ->where('status', 'published')
            ->where('copyright_status', 'clear')
            ->findOrFail($data['book_id']);

        if (! $book->is_single_sale_enabled) {
            throw ValidationException::withMessages(['book_id' => 'La vente unitaire n’est pas activée pour ce livre.']);
        }

        $requestedFormat = $data['book_format'] ?? 'ebook';
        $format = BookFormat::query()
            ->where('book_id', $book->id)
            ->where('is_published', true)
            ->where('format', $requestedFormat)
            ->first();

        if ($format === null && in_array($requestedFormat, ['paperback', 'pocket', 'hardcover'], true)) {
            throw ValidationException::withMessages(['book_format' => 'Le format sélectionné n’est pas disponible.']);
        }

        if (in_array($requestedFormat, ['holistique_store', 'ebook'], true)) {
            $alreadyPurchased = Library::query()
                ->where('user_id', $profile->id)
                ->where('book_id', $book->id)
                ->where('access_type', 'purchase')
                ->where('status', 'active')
                ->exists();

            if ($alreadyPurchased) {
                throw ValidationException::withMessages(['book_id' => 'Ce livre a déjà été acheté sur ce compte.']);
            }
        }

        $currency = mb_strtoupper((string) (
            $data['currency_code']
            ?? $format?->currency_code
            ?? $book->currency_code
            ?? 'USD'
        ));

        $order = app(OrderService::class)->createPending($profile, [
            'items' => [[
                'book_id' => $book->id,
                'format_id' => $format?->id,
                'book_format' => $requestedFormat,
                'quantity' => 1,
            ]],
            'currency_code' => $currency,
            'market_country_code' => $data['market_country_code'] ?? null,
            'payment_provider' => 'easypay',
            'payment_channel' => $data['channel'] ?? 'ALL',
        ]);

        $order->update([
            'payment_metadata' => array_merge($order->payment_metadata ?? [], [
                'order_source' => 'single_book_checkout',
            ]),
        ]);

        return $order->fresh(['items.book', 'items.format']);
    }

    private function loadPendingOrPaidOrder(Profile $profile, string $orderId): ?Order
    {
        return Order::query()
            ->where('id', $orderId)
            ->where('user_id', $profile->id)
            ->with(['items.book', 'items.format'])
            ->first();
    }

    private function loadPendingOrder(Profile $profile, string $orderId): Order
    {
        $order = Order::query()
            ->where('id', $orderId)
            ->where('user_id', $profile->id)
            ->with(['items.book', 'items.format'])
            ->firstOrFail();

        if ($order->payment_status === 'paid') {
            throw ValidationException::withMessages(['order_id' => 'Cette commande est déjà payée.']);
        }

        if ($order->items->isEmpty()) {
            throw ValidationException::withMessages(['order_id' => 'Cette commande ne contient aucun article.']);
        }

        return $order;
    }

    private function grantDigitalPurchases(Order $order): void
    {
        foreach ($order->items as $item) {
            if (! in_array($item->book_format, ['holistique_store', 'ebook'], true)) {
                continue;
            }

            Library::query()->updateOrCreate(
                ['user_id' => $order->user_id, 'book_id' => $item->book_id],
                [
                    'access_type' => 'purchase',
                    'status' => 'active',
                    'subscription_id' => null,
                    'granted_by_order_id' => $order->id,
                    'granted_by_format_id' => $item->format_id,
                    'expires_at' => null,
                    'purchased_at' => now(),
                    'last_synced_at' => now(),
                ],
            );
        }
    }

    private function verify(string $reference): array
    {
        $lastError = null;

        try {
            $response = $this->http()->post($this->baseUrl().'/payment/'.urlencode($reference).'/checking-status', []);

            if ($response->successful() && is_array($response->json())) {
                return $response->json();
            }

            $lastError = new RuntimeException('EasyPay verification failed with HTTP '.$response->status());
        } catch (Throwable $error) {
            $lastError = $error;
        }

        throw $lastError ?? new RuntimeException('La vérification du paiement est momentanément indisponible.');
    }

    private function orderReference(Order $order): string
    {
        // EasyPay impose une référence marchand alphanumérique unique de 6 à 16 caractères.
        // On dérive une valeur stable de l'UUID interne sans exposer l'UUID complet.
        return 'HB'.strtoupper(substr(hash('sha256', (string) $order->id), 0, 14));
    }

    private function description(Order $order): string
    {
        $titles = $order->items->pluck('book.title')->filter()->map(
            fn ($title) => trim(str_replace(['#', '$', '/', '_', '&'], ' ', (string) $title))
        );

        return $titles->count() === 1
            ? 'Achat livre HolistiqueBooks - '.$titles->first()
            : 'Achat HolistiqueBooks - '.$titles->count().' livres';
    }

    private function channels(string $channel): array
    {
        return match ($channel) {
            'MOBILE_MONEY' => [['channel' => 'MOBILE MONEY']],
            'CREDIT_CARD' => [['channel' => 'CREDIT CARD']],
            default => [['channel' => 'CREDIT CARD'], ['channel' => 'MOBILE MONEY']],
        };
    }

    private function initializationUrl(): string
    {
        $correlationId = config('easypay.correlation_id');
        $token = config('easypay.token');

        if (! $correlationId || ! $token) {
            throw new RuntimeException('Configuration EasyPay incomplète côté Laravel.');
        }

        return $this->baseUrl().'/payment/initialization?cid='.urlencode($correlationId).'&token='.urlencode($token);
    }

    private function paymentUrl(string $reference): string
    {
        return $this->baseUrl().'/payment/initialization?reference='.urlencode($reference);
    }

    private function frontendUrl(string $path): string
    {
        return config('easypay.frontend_url').$path;
    }

    private function baseUrl(): string
    {
        $mode = config('easypay.mode', 'sandbox');

        if (! in_array($mode, ['sandbox', 'v1'], true)) {
            throw new RuntimeException("EASYPAY_MODE doit être 'sandbox' ou 'v1'.");
        }

        return rtrim(config('easypay.base_url'), '/').'/'.$mode;
    }

    private function http(): PendingRequest
    {
        return Http::acceptJson()
            ->asJson()
            ->connectTimeout(10)
            ->timeout(30)
            ->retry(2, 300, throw: false);
    }
}
