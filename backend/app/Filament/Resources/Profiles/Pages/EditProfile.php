<?php

namespace App\Filament\Resources\Profiles\Pages;

use App\Filament\Resources\Profiles\ProfileResource;
use Filament\Resources\Pages\EditRecord;

class EditProfile extends EditRecord
{
    protected static string $resource = ProfileResource::class;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        // Défense en profondeur : les champs sont désactivés dans le formulaire,
        // mais on ignore aussi toute valeur forgée côté client.
        if (! ProfileResource::currentUserIsSuperAdmin()) {
            unset($data['role'], $data['staff_role'], $data['staff_permissions']);
        }

        return $data;
    }
}
