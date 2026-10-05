<?php

namespace App\Filament\Author\Resources\Books\Pages;

use App\Filament\Author\Resources\Books\BookResource;
use App\Models\AuthorProfile;
use App\Services\BookDocumentMetadataService;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Facades\Storage;

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
        $data['authorship_type'] = 'named';
        $data['author_credit'] = $author->display_name;
        $data['author_display_name'] = $author->display_name;
        $data['editorial_stage'] = $data['editorial_stage'] ?? 'intake';
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
        $this->record = app(BookDocumentMetadataService::class)->enrich($this->record);

        if (filled($this->record->file_url)) {
            $path = (string) $this->record->file_url;

            $this->record->manuscriptVersions()->create([
                'created_by' => auth()->user()?->profile?->id,
                'version_number' => 1,
                'file_path' => $path,
                'file_format' => $this->record->file_format ?: pathinfo($path, PATHINFO_EXTENSION),
                'file_size' => Storage::disk('books')->exists($path) ? Storage::disk('books')->size($path) : null,
                'status' => 'author_draft',
                'change_summary' => 'Version initiale déposée depuis le Studio Auteur.',
            ]);
        }

        $this->record->editorialEvents()->create([
            'actor_id' => auth()->user()?->profile?->id,
            'event_type' => 'created',
            'to_stage' => $this->record->editorial_stage,
            'notes' => 'Manuscrit créé depuis le Studio Auteur.',
        ]);
    }
}
