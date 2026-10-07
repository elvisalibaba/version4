<?php

namespace App\Filament\Resources\BookEditorialEvents;

use App\Filament\Concerns\RequiresStaffPermission;
use App\Filament\Resources\BookEditorialEvents\Pages\ListBookEditorialEvents;
use App\Models\BookEditorialEvent;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class BookEditorialEventResource extends Resource
{
    use RequiresStaffPermission;

    protected static string $staffManagePermission = 'editorial.review';

    protected static ?string $staffViewPermission = 'audit.view';

    protected static ?string $model = BookEditorialEvent::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-clock';

    protected static ?string $navigationLabel = 'Historique éditorial';

    protected static ?string $modelLabel = 'événement éditorial';

    protected static ?string $pluralModelLabel = 'historique éditorial';

    protected static ?int $navigationSort = 9;

    public static function getNavigationGroup(): ?string
    {
        return 'Catalogue';
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('book.title')
                    ->label('Livre')
                    ->searchable()
                    ->sortable()
                    ->limit(45),

                TextColumn::make('event_type')
                    ->label('Événement')
                    ->badge(),

                TextColumn::make('from_stage')
                    ->label('Depuis')
                    ->badge()
                    ->placeholder('—'),

                TextColumn::make('to_stage')
                    ->label('Vers')
                    ->badge()
                    ->placeholder('—'),

                TextColumn::make('actor.name')
                    ->label('Responsable')
                    ->placeholder('Système')
                    ->toggleable(),

                TextColumn::make('notes')
                    ->label('Note')
                    ->limit(60)
                    ->wrap(),

                TextColumn::make('created_at')
                    ->label('Date')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('event_type')
                    ->label('Événement')
                    ->options([
                        'created' => 'Création',
                        'imported' => 'Import',
                        'stage_changed' => 'Changement d’étape',
                        'bat_status_changed' => 'BAT',
                        'published' => 'Publication',
                    ]),

                SelectFilter::make('to_stage')
                    ->label('Étape')
                    ->options([
                        'intake' => 'Collecte',
                        'brief' => 'Brief',
                        'contract' => 'Contrat',
                        'planning' => 'Planification',
                        'writing' => 'Rédaction',
                        'correction_1' => 'Première correction',
                        'correction_2' => 'Seconde relecture',
                        'layout' => 'Mise en page',
                        'design' => 'Design',
                        'bat' => 'BAT',
                        'production' => 'Production',
                        'distribution' => 'Distribution',
                        'published' => 'Publié',
                    ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListBookEditorialEvents::route('/'),
        ];
    }
}
