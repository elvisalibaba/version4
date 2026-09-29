<?php

namespace App\Filament\Resources\MobileAppVersions\Pages;

use App\Filament\Resources\MobileAppVersions\MobileAppVersionResource;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Storage;

class EditMobileAppVersion extends EditRecord
{
    protected static string $resource = MobileAppVersionResource::class;

    protected function mutateFormDataBeforeSave(array $data): array
    {
        if (! empty($data['storage_path']) && Storage::disk('books')->exists($data['storage_path'])) {
            $data['file_size_bytes'] = Storage::disk('books')->size($data['storage_path']);
            $data['checksum_sha256'] = hash('sha256', Storage::disk('books')->get($data['storage_path']));
        }

        if (($data['is_published'] ?? false) && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        return $data;
    }
}
