<?php

namespace App\Filament\Resources\PublishingHouses;

use App\Filament\Resources\PublishingHouses\Pages\ListPublishingHouses;
use App\Filament\Resources\PublishingHouses\Pages\CreatePublishingHouse;
use App\Filament\Resources\PublishingHouses\Pages\EditPublishingHouse;
use App\Models\PublishingHouse;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class PublishingHouseResource extends Resource
{
    protected static ?string $model = PublishingHouse::class;
    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-building-office-2';
    protected static ?string $navigationLabel = 'Maison d’édition';
    protected static ?string $modelLabel = 'maison d’édition';
    protected static ?string $pluralModelLabel = 'maisons d’édition';
    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string { return 'Maison d’édition'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Identité éditoriale')->columns(2)->schema([
                TextInput::make('name')->label('Nom public')->required()->live(onBlur: true)
                    ->afterStateUpdated(fn ($set, ?string $state) => $set('slug', Str::slug((string) $state))),
                TextInput::make('legal_name')->label('Raison sociale'),
                TextInput::make('slug')->required(),
                Select::make('status')->options(['active'=>'Active','inactive'=>'Inactive','suspended'=>'Suspendue'])->default('active')->required(),
                TextInput::make('email')->email(),
                TextInput::make('phone')->label('Téléphone'),
                TextInput::make('website')->url()->columnSpanFull(),
                FileUpload::make('logo_url')
                    ->label('Logo de la maison')
                    ->disk('public')
                    ->directory('branding/publishing-houses')
                    ->visibility('public')
                    ->image()
                    ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
                    ->maxSize(5120)
                    ->helperText('Importez le logo au lieu de saisir une URL.')
                    ->columnSpanFull(),
                TextInput::make('country_code')->label('Pays (ISO)')->maxLength(2),
                TextInput::make('city')->label('Ville'),
                TextInput::make('primary_currency')->label('Devise')->default('USD')->maxLength(3),
                Textarea::make('address')->label('Adresse')->columnSpanFull(),
                Textarea::make('description')->label('Présentation')->rows(5)->columnSpanFull(),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            ImageColumn::make('logo_url')->label('Logo')->disk('public')->square(),
            TextColumn::make('name')->label('Maison')->searchable()->sortable(),
            TextColumn::make('status')->badge(),
            TextColumn::make('country_code')->label('Pays'),
            TextColumn::make('books_count')->counts('books')->label('Titres'),
            TextColumn::make('imprints_count')->counts('imprints')->label('Labels'),
            TextColumn::make('created_at')->dateTime('d/m/Y')->label('Créée le'),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return ['index'=>ListPublishingHouses::route('/'),'create'=>CreatePublishingHouse::route('/create'),'edit'=>EditPublishingHouse::route('/{record}/edit')];
    }
}
