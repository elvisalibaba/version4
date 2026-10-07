<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AuthorPayoutAccount;
use App\Models\AuthorRoyaltyAccount;
use App\Models\AuthorRoyaltyTransaction;
use App\Services\AuthorRoyaltyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AuthorFinanceController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $profile = $this->authorProfile($request);
        $accounts = AuthorRoyaltyAccount::query()
            ->where('user_id', $profile->id)
            ->orderBy('currency_code')
            ->get();
        $account = AuthorRoyaltyAccount::primaryFor($profile->id);
        $currency = $account?->currency_code ?? mb_strtoupper((string) config('publishing.default_currency', 'USD'));

        // On n'additionne jamais des montants de devises différentes.
        $totals = AuthorRoyaltyTransaction::query()
            ->where('user_id', $profile->id)
            ->selectRaw("currency_code,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN net_royalty ELSE 0 END), 0) as pending,
                COALESCE(SUM(CASE WHEN status = 'payable' THEN net_royalty ELSE 0 END), 0) as payable,
                COALESCE(SUM(CASE WHEN status IN ('pending', 'payable', 'paid') THEN net_royalty ELSE 0 END), 0) as lifetime")
            ->groupBy('currency_code')
            ->get()
            ->mapWithKeys(fn ($row): array => [$row->currency_code => [
                'pending' => (float) $row->pending,
                'payable' => (float) $row->payable,
                'lifetime' => (float) $row->lifetime,
            ]]);

        return response()->json([
            'data' => [
                // Portefeuille principal (compatibilité avec les clients existants).
                'account' => $account,
                'accounts' => $accounts,
                'royalties' => $totals->get($currency, ['pending' => 0.0, 'payable' => 0.0, 'lifetime' => 0.0]),
                'royalties_by_currency' => $totals,
            ],
        ]);
    }

    public function statement(Request $request): JsonResponse
    {
        $profile = $this->authorProfile($request);
        $from = $request->date('from') ?? now()->startOfMonth();
        $to = $request->date('to') ?? now()->endOfMonth();

        abort_if($from->gt($to), 422, 'La date de début doit précéder la date de fin.');

        $base = AuthorRoyaltyTransaction::query()
            ->where('user_id', $profile->id)
            ->whereBetween('earned_at', [$from->startOfDay(), $to->endOfDay()]);

        $totals = (clone $base)->selectRaw('
            COALESCE(SUM(gross_amount), 0) as gross_amount,
            COALESCE(SUM(printing_cost), 0) as printing_cost,
            COALESCE(SUM(platform_fee), 0) as platform_fee,
            COALESCE(SUM(tax_withholding), 0) as tax_withholding,
            COALESCE(SUM(net_royalty), 0) as net_royalty
        ')->first();

        $byBook = (clone $base)
            ->selectRaw('book_id, currency_code, COUNT(*) as transactions_count,
                SUM(gross_amount) as gross_amount,
                SUM(platform_fee) as platform_fee,
                SUM(printing_cost) as printing_cost,
                SUM(tax_withholding) as tax_withholding,
                SUM(net_royalty) as net_royalty')
            ->with('book:id,title')
            ->groupBy('book_id', 'currency_code')
            ->orderByDesc('net_royalty')
            ->get();

        $bySource = (clone $base)
            ->selectRaw('source, currency_code, COUNT(*) as transactions_count,
                SUM(gross_amount) as gross_amount,
                SUM(net_royalty) as net_royalty')
            ->groupBy('source', 'currency_code')
            ->orderBy('source')
            ->get();

        return response()->json([
            'data' => [
                'period' => [
                    'from' => $from->toDateString(),
                    'to' => $to->toDateString(),
                ],
                'totals' => [
                    'gross_amount' => (float) ($totals->gross_amount ?? 0),
                    'printing_cost' => (float) ($totals->printing_cost ?? 0),
                    'platform_fee' => (float) ($totals->platform_fee ?? 0),
                    'tax_withholding' => (float) ($totals->tax_withholding ?? 0),
                    'net_royalty' => (float) ($totals->net_royalty ?? 0),
                ],
                'by_book' => $byBook,
                'by_source' => $bySource,
            ],
        ]);
    }

    public function royalties(Request $request): JsonResponse
    {
        $profile = $this->authorProfile($request);

        $royalties = AuthorRoyaltyTransaction::query()
            ->where('user_id', $profile->id)
            ->with('book:id,title')
            ->latest('earned_at')
            ->paginate(min(100, max(1, (int) $request->integer('per_page', 25))));

        return response()->json($royalties);
    }

    public function payoutAccounts(Request $request): JsonResponse
    {
        $profile = $this->authorProfile($request);

        return response()->json([
            'data' => AuthorPayoutAccount::query()
                ->where('user_id', $profile->id)
                ->latest()
                ->get(),
        ]);
    }

    public function storePayoutAccount(Request $request): JsonResponse
    {
        $profile = $this->authorProfile($request);
        $data = $request->validate([
            'method' => ['required', Rule::in(['bank_transfer', 'mobile_money'])],
            'provider' => ['nullable', 'string', 'max:120'],
            'country_code' => ['required', 'string', 'size:2'],
            'currency_code' => ['required', 'string', 'size:3'],
            'account_name' => ['required', 'string', 'max:255'],
            'account_identifier' => ['required', 'string', 'max:255'],
            'is_default' => ['nullable', 'boolean'],
        ]);

        $data['user_id'] = $profile->id;
        $data['is_verified'] = false;
        $data['verified_at'] = null;

        if (! AuthorPayoutAccount::query()->where('user_id', $profile->id)->exists()) {
            $data['is_default'] = true;
        }

        $account = AuthorPayoutAccount::query()->create($data);

        if ($account->is_default) {
            AuthorPayoutAccount::query()
                ->where('user_id', $profile->id)
                ->whereKeyNot($account->id)
                ->update(['is_default' => false]);
        }

        return response()->json(['data' => $account], 201);
    }

    public function updatePayoutAccount(Request $request, AuthorPayoutAccount $payoutAccount): JsonResponse
    {
        $profile = $this->authorProfile($request);
        abort_unless($payoutAccount->user_id === $profile->id, 404);

        $data = $request->validate([
            'method' => ['sometimes', Rule::in(['bank_transfer', 'mobile_money'])],
            'provider' => ['nullable', 'string', 'max:120'],
            'country_code' => ['sometimes', 'string', 'size:2'],
            'currency_code' => ['sometimes', 'string', 'size:3'],
            'account_name' => ['sometimes', 'string', 'max:255'],
            'account_identifier' => ['sometimes', 'string', 'max:255'],
            'is_default' => ['nullable', 'boolean'],
        ]);

        $payoutAccount->update($data);

        if ($payoutAccount->is_default) {
            AuthorPayoutAccount::query()
                ->where('user_id', $profile->id)
                ->whereKeyNot($payoutAccount->id)
                ->update(['is_default' => false]);
        }

        return response()->json(['data' => $payoutAccount->fresh()]);
    }

    public function destroyPayoutAccount(Request $request, AuthorPayoutAccount $payoutAccount): JsonResponse
    {
        $profile = $this->authorProfile($request);
        abort_unless($payoutAccount->user_id === $profile->id, 404);

        abort_if($payoutAccount->payouts()->whereIn('status', ['requested', 'approved', 'processing'])->exists(), 422, 'Ce compte est lié à un versement en cours.');

        $payoutAccount->delete();

        return response()->json(['message' => 'Compte de versement supprimé.']);
    }

    public function payouts(Request $request): JsonResponse
    {
        $profile = $this->authorProfile($request);

        return response()->json([
            'data' => $profile->authorPayouts()
                ->with('payoutAccount:id,provider,method,country_code,currency_code,account_name')
                ->latest('requested_at')
                ->get(),
        ]);
    }

    public function requestPayout(Request $request, AuthorRoyaltyService $royalties): JsonResponse
    {
        $profile = $this->authorProfile($request);
        $data = $request->validate([
            'payout_account_id' => ['required', 'uuid', 'exists:author_payout_accounts,id'],
            'amount' => ['required', 'numeric', 'gt:0'],
        ]);

        $account = AuthorPayoutAccount::query()
            ->where('user_id', $profile->id)
            ->findOrFail($data['payout_account_id']);

        $payout = $royalties->requestPayout($profile->id, $account, (float) $data['amount']);

        return response()->json(['data' => $payout], 201);
    }

    private function authorProfile(Request $request)
    {
        $profile = $request->user()->profile;
        abort_unless($profile && in_array($profile->role, ['author', 'admin'], true), 403);

        return $profile;
    }
}
