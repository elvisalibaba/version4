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
        $account = AuthorRoyaltyAccount::query()->find($profile->id);

        return response()->json([
            'data' => [
                'account' => $account,
                'royalties' => [
                    'pending' => (float) AuthorRoyaltyTransaction::query()->where('user_id', $profile->id)->where('status', 'pending')->sum('net_royalty'),
                    'payable' => (float) AuthorRoyaltyTransaction::query()->where('user_id', $profile->id)->where('status', 'payable')->sum('net_royalty'),
                    'lifetime' => (float) AuthorRoyaltyTransaction::query()->where('user_id', $profile->id)->whereIn('status', ['pending', 'payable', 'paid'])->sum('net_royalty'),
                ],
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
