<?php

namespace App\Filament\Author\Resources\PayoutAccounts\Pages;

use App\Filament\Author\Resources\PayoutAccounts\AuthorPayoutAccountResource;
use App\Models\AuthorPayoutAccount;
use Filament\Resources\Pages\EditRecord;

class EditAuthorPayoutAccount extends EditRecord
{
    protected static string $resource = AuthorPayoutAccountResource::class;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        unset($data['is_verified'], $data['verified_at'], $data['user_id']);

        return $data;
    }

    protected function afterSave(): void
    {
        if ($this->record->is_default) {
            AuthorPayoutAccount::query()
                ->where('user_id', auth()->id())
                ->whereKeyNot($this->record->id)
                ->update(['is_default' => false]);
        }
    }
}
