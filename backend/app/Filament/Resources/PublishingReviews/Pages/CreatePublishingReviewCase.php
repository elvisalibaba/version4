<?php
namespace App\Filament\Resources\PublishingReviews\Pages;
use App\Filament\Resources\PublishingReviews\PublishingReviewCaseResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Str;
class CreatePublishingReviewCase extends CreateRecord {
    protected static string $resource = PublishingReviewCaseResource::class;
    protected function mutateFormDataBeforeCreate(array $data): array {
        $data['opened_by'] = auth()->user()?->profile?->id;
        $data['case_number'] = $data['case_number'] ?? 'HB-REV-'.now()->format('Ymd').'-'.Str::upper(Str::random(6));
        return $data;
    }
}
