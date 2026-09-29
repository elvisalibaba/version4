<?php

namespace App\Filament\Author\Resources\Books\Pages;

use App\Filament\Author\Resources\Books\BookResource;
use App\Models\AuthorProfile;
use App\Services\BookDocumentMetadataService;
use Filament\Resources\Pages\CreateRecord;

class CreateBook extends CreateRecord
{
    protected static string $resource = BookResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $user = auth()->user();
        $profile = $user?->profile;

        abort_unless($profile && in_array($profile->role, ['author', 'admin'], true), 403);

        $author = AuthorProfile::query()->firstOrCreate(
            ['id' => $profile->id],
            [
                'display_name' => $profile->name ?? $user->name,
                'social_links' => [],
                'genres' => [],
                'press_mentions' => [],
            ],
        );

        $data['author_id'] = $author->id;
        $data['author_display_name'] = $author->display_name;
        $data['status'] = 'draft';
        $data['review_status'] = 'draft';
        $data['copyright_status'] = 'review';
        $data['co_authors'] = $data['co_authors'] ?? [];
        $data['categories'] = $data['categories'] ?? [];
        $data['tags'] = $data['tags'] ?? [];

        return $data;
    }

    protected function afterCreate(): void
    {
        app(BookDocumentMetadataService::class)->enrich($this->record);
    }
}
