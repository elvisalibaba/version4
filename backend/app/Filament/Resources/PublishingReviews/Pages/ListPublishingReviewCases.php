<?php
namespace App\Filament\Resources\PublishingReviews\Pages;
use App\Filament\Resources\PublishingReviews\PublishingReviewCaseResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;
class ListPublishingReviewCases extends ListRecords {
    protected static string $resource = PublishingReviewCaseResource::class;
    protected function getHeaderActions(): array { return [CreateAction::make()]; }
}
