<?php

namespace App\Filament\Author\Resources\PayoutAccounts\Pages;

use App\Filament\Author\Resources\PayoutAccounts\AuthorPayoutAccountResource;
use App\Models\AuthorPayoutAccount;
use Filament\Resources\Pages\CreateRecord;

class CreateAuthorPayoutAccount extends CreateRecord
{
    protected static string $resource = AuthorPayoutAccountResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['user_id'] = auth()->id();
        $data['is_verified'] = false;
        $data['verified_at'] = null;

        if (! AuthorPayoutAccount::query()->where('user_id', auth()->id())->exists()) {
            $data['is_default'] = true;
        }

        return $data;
    }

    protected function afterCreate(): void
    {
        if ($this->record->is_default) {
            AuthorPayoutAccount::query()
                ->where('user_id', auth()->id())
                ->whereKeyNot($this->record->id)
                ->update(['is_default' => false]);
        }
    }
}
