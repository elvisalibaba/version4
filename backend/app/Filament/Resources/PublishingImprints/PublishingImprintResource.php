<?php

namespace App\Filament\Resources\PublishingImprints;

use App\Filament\Resources\PublishingImprints\Pages\ListPublishingImprints;
use App\Filament\Resources\PublishingImprints\Pages\CreatePublishingImprint;
use App\Filament\Resources\PublishingImprints\Pages\EditPublishingImprint;
use App\Models\PublishingImprint;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class PublishingImprintResource extends Resource
{
    protected static ?string $model = PublishingImprint::class;
    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-bookmark-square';
    protected static ?string $navigationLabel = 'Labels éditoriaux';
    protected static ?string $modelLabel = 'label';
    protected static ?string $pluralModelLabel = 'labels';
    protected static ?int $navigationSort = 2;
    public static function getNavigationGroup(): ?string { return 'Maison d’édition'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([Section::make('Label / Imprint')->columns(2)->schema([
            Select::make('publishing_house_id')->relationship('publishingHouse','name')->label('Maison')->searchable()->preload()->required(),
            TextInput::make('name')->required()->live(onBlur:true)->afterStateUpdated(fn($set,?string $state)=>$set('slug',Str::slug((string)$state))),
            TextInput::make('slug')->required(),
            Toggle::make('is_active')->label('Actif')->default(true),
            Textarea::make('description')->columnSpanFull(),
            FileUpload::make('logo_url')
                ->label('Logo du label')
                ->disk('public')
                ->directory('branding/imprints')
                ->visibility('public')
                ->image()
                ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
                ->maxSize(5120)
                ->helperText('Importez le logo du label.')
                ->columnSpanFull(),
        ])]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            ImageColumn::make('logo_url')->label('Logo')->disk('public')->square(),
            TextColumn::make('name')->searchable()->sortable(),
            TextColumn::make('publishingHouse.name')->label('Maison')->searchable(),
            IconColumn::make('is_active')->boolean()->label('Actif'),
            TextColumn::make('books_count')->counts('books')->label('Titres'),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return ['index'=>ListPublishingImprints::route('/'),'create'=>CreatePublishingImprint::route('/create'),'edit'=>EditPublishingImprint::route('/{record}/edit')];
    }
}
