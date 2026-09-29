<?php

namespace App\Filament\Widgets;

use App\Models\Book;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class EditorialReviewQueue extends BaseWidget
{
    protected static ?string $heading = 'File éditoriale';

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(fn (): Builder => Book::query()
                ->whereIn('review_status', ['submitted', 'changes_requested'])
                ->with('author')
                ->orderBy('submitted_at'))
            ->columns([
                TextColumn::make('title')->label('Livre')->searchable()->limit(45),
                TextColumn::make('author.display_name')->label('Auteur')->searchable(),
                TextColumn::make('review_status')->label('Validation')->badge(),
                TextColumn::make('copyright_status')->label('Droits')->badge(),
                TextColumn::make('submitted_at')->label('Soumis')->since(),
            ])
            ->paginated([5, 10]);
    }
}
