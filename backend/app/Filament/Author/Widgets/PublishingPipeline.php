<?php

namespace App\Filament\Author\Widgets;

use App\Models\Book;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class PublishingPipeline extends BaseWidget
{
    protected static ?string $heading = 'Pipeline de publication';

    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(fn (): Builder => Book::query()
                ->where('author_id', auth()->id())
                ->latest('updated_at'))
            ->columns([
                TextColumn::make('title')->label('Livre')->searchable()->limit(45),
                TextColumn::make('status')->label('Publication')->badge(),
                TextColumn::make('review_status')->label('Validation')->badge(),
                TextColumn::make('copyright_status')->label('Droits')->badge(),
                TextColumn::make('updated_at')->label('Dernière activité')->since(),
            ])
            ->paginated([5, 10]);
    }
}
