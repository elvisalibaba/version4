<?php

namespace App\Filament\Author\Resources\Payouts\Pages;

use App\Filament\Author\Resources\Payouts\AuthorPayoutResource;
use App\Models\AuthorPayoutAccount;
use App\Services\AuthorRoyaltyService;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;

class CreateAuthorPayout extends CreateRecord
{
    protected static string $resource = AuthorPayoutResource::class;

    protected function handleRecordCreation(array $data): Model
    {
        $payoutAccount = AuthorPayoutAccount::query()
            ->where('user_id', auth()->id())
            ->findOrFail($data['payout_account_id']);

        return app(AuthorRoyaltyService::class)->requestPayout(
            auth()->id(),
            $payoutAccount,
            (float) $data['amount'],
        );
    }
}
