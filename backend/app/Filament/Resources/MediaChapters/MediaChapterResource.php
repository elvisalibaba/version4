<?php

namespace App\Filament\Resources\MediaChapters;

use App\Filament\Resources\MediaChapters\Pages\CreateMediaChapter;
use App\Filament\Resources\MediaChapters\Pages\EditMediaChapter;
use App\Filament\Resources\MediaChapters\Pages\ListMediaChapters;
use App\Models\MediaChapter;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class MediaChapterResource extends Resource
{
    protected static ?string $model = MediaChapter::class;
    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-bars-3-bottom-left';
    protected static ?string $navigationLabel = 'Chapitres média';
    protected static ?string $modelLabel = 'chapitre média';
    protected static ?string $pluralModelLabel = 'chapitres média';
    protected static ?int $navigationSort = 5;
    public static function getNavigationGroup(): ?string { return 'Catalogue'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([Section::make('Chapitre / piste')->columns(2)->schema([
            Select::make('media_edition_id')->relationship('mediaEdition','title')->label('Édition média')->searchable()->preload()->required(),
            TextInput::make('position')->numeric()->minValue(1)->default(1)->required(),
            TextInput::make('title')->label('Titre')->required()->columnSpanFull(),
            TextInput::make('starts_at_second')->label('Début (sec)')->numeric()->minValue(0),
            TextInput::make('ends_at_second')->label('Fin (sec)')->numeric()->minValue(0),
            TextInput::make('storage_path')->label('Chemin stockage')->columnSpanFull(),
            TextInput::make('streaming_url')->label('URL streaming')->url()->columnSpanFull(),
            Toggle::make('is_preview')->label('Extrait gratuit'),
        ])]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('mediaEdition.book.title')->label('Œuvre')->limit(30),
            TextColumn::make('mediaEdition.media_type')->label('Format')->badge(),
            TextColumn::make('position')->label('#')->sortable(),
            TextColumn::make('title')->searchable(),
            IconColumn::make('is_preview')->boolean()->label('Extrait'),
        ])->defaultSort('position')->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'=>ListMediaChapters::route('/'),
            'create'=>CreateMediaChapter::route('/create'),
            'edit'=>EditMediaChapter::route('/{record}/edit'),
        ];
    }
}
