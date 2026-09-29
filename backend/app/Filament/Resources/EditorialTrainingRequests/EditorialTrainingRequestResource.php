<?php

namespace App\Filament\Resources\EditorialTrainingRequests;

use App\Filament\Resources\EditorialTrainingRequests\Pages\ListEditorialTrainingRequests;
use App\Filament\Resources\EditorialTrainingRequests\Pages\ViewEditorialTrainingRequest;
use App\Models\EditorialTrainingRequest;
use BackedEnum;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\Placeholder;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class EditorialTrainingRequestResource extends Resource
{
    protected static ?string $model = EditorialTrainingRequest::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-academic-cap';

    protected static ?string $navigationLabel = 'Demandes de formation';

    protected static ?string $modelLabel = 'demande';

    protected static ?string $pluralModelLabel = 'demandes de formation';

    protected static ?int $navigationSort = 4;

    public static function getNavigationGroup(): ?string
    {
        return 'Contenu';
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Demande')
                ->columns(2)
                ->schema([
                    Placeholder::make('name')->label('Nom')->content(fn (EditorialTrainingRequest $record) => trim($record->first_name.' '.$record->last_name)),
                    Placeholder::make('email')->label('E-mail')->content(fn (EditorialTrainingRequest $record) => $record->email),
                    Placeholder::make('phone')->label('Téléphone')->content(fn (EditorialTrainingRequest $record) => $record->phone ?: '—'),
                    Placeholder::make('location')->label('Localisation')->content(fn (EditorialTrainingRequest $record) => trim(($record->city ?: '').' '.($record->country ?: '')) ?: '—'),
                    Placeholder::make('profile_type')->label('Profil')->content(fn (EditorialTrainingRequest $record) => $record->profile_type),
                    Placeholder::make('experience_level')->label('Niveau')->content(fn (EditorialTrainingRequest $record) => $record->experience_level),
                    Placeholder::make('project_stage')->label('Stade du projet')->content(fn (EditorialTrainingRequest $record) => $record->project_stage),
                    Placeholder::make('preferred_format')->label('Format')->content(fn (EditorialTrainingRequest $record) => $record->preferred_format),
                    Placeholder::make('objectives')->label('Objectifs')->content(fn (EditorialTrainingRequest $record) => $record->objectives)->columnSpanFull(),
                    Placeholder::make('message')->label('Message')->content(fn (EditorialTrainingRequest $record) => $record->message ?: '—')->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('first_name')->label('Prénom')->searchable(),
                TextColumn::make('last_name')->label('Nom')->searchable(),
                TextColumn::make('email')->label('E-mail')->searchable()->copyable(),
                TextColumn::make('profile_type')->label('Profil')->badge(),
                TextColumn::make('experience_level')->label('Niveau')->badge(),
                TextColumn::make('preferred_format')->label('Format')->badge(),
                IconColumn::make('consent_to_contact')->label('Contact')->boolean(),
                TextColumn::make('created_at')->label('Reçue le')->dateTime('d/m/Y H:i')->sortable(),
            ])
            ->filters([
                SelectFilter::make('profile_type')->options([
                    'author' => 'Auteur',
                    'aspiring_editor' => 'Aspirant éditeur',
                    'publisher' => 'Maison d’édition',
                    'entrepreneur' => 'Entrepreneur',
                    'student' => 'Étudiant',
                    'other' => 'Autre',
                ]),
                SelectFilter::make('preferred_format')->options([
                    'online' => 'En ligne',
                    'onsite' => 'Présentiel',
                    'hybrid' => 'Hybride',
                ]),
            ])
            ->recordActions([
                ViewAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListEditorialTrainingRequests::route('/'),
            'view' => ViewEditorialTrainingRequest::route('/{record}'),
        ];
    }
}
