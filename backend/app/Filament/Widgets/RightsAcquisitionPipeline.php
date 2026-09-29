<?php

namespace App\Filament\Widgets;

use App\Models\RightsAcquisitionTarget;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class RightsAcquisitionPipeline extends BaseWidget
{
    protected static ?string $heading = 'Pipeline d’acquisition internationale';
    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(fn (): Builder => RightsAcquisitionTarget::query()
                ->with('authorProfile')
                ->whereNotIn('status', ['rejected'])
                ->orderBy('priority')
                ->orderBy('next_action_at'))
            ->columns([
                TextColumn::make('title')->label('Titre')->searchable()->limit(38),
                TextColumn::make('authorProfile.display_name')->label('Auteur')->searchable(),
                TextColumn::make('status')->label('Droits')->badge(),
                TextColumn::make('priority')->label('Priorité'),
                TextColumn::make('desired_media')->label('Formats')->badge(),
                TextColumn::make('next_action_at')->label('Relance')->since()->placeholder('À planifier'),
            ])
            ->paginated([5, 10]);
    }
}
