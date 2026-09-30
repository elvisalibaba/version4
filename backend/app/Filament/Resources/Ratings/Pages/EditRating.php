<?php

namespace App\Filament\Resources\Ratings\Pages;

use App\Filament\Resources\Ratings\RatingResource;
use Filament\Resources\Pages\EditRecord;

class EditRating extends EditRecord
{
    protected static string $resource = RatingResource::class;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        $hidden = (bool) ($data['is_hidden'] ?? false);

        $data['hidden_at'] = $hidden
            ? ($this->record->hidden_at ?? now())
            : null;
        $data['hidden_by'] = $hidden
            ? auth()->user()?->profile?->id
            : null;

        return $data;
    }
}
