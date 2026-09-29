<?php

namespace App\Filament\Resources\AdCreatives;

use App\Filament\Resources\AdCreatives\Pages\ListAdCreatives;
use App\Filament\Resources\AdCreatives\Pages\CreateAdCreative;
use App\Filament\Resources\AdCreatives\Pages\EditAdCreative;
use App\Models\AdCreative;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class AdCreativeResource extends Resource
{
    protected static ?string $model = AdCreative::class;
    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-photo';
    protected static ?string $navigationLabel = 'Créations';
    protected static ?string $modelLabel = 'création publicitaire';
    protected static ?string $pluralModelLabel = 'créations publicitaires';
    protected static ?int $navigationSort = 3;
    public static function getNavigationGroup(): ?string { return 'Publicité'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([Section::make('Création')->columns(2)->schema([
            Select::make('campaign_id')->relationship('campaign','name')->label('Campagne')->searchable()->preload()->required(),
            TextInput::make('title')->label('Nom interne')->required(),
            Select::make('creative_type')->label('Format')->options(['banner'=>'Bannière','image'=>'Image','video'=>'Vidéo','native'=>'Native'])->default('banner')->required(),
            Toggle::make('is_active')->label('Active')->default(true),
            TextInput::make('headline')->label('Titre affiché')->columnSpanFull(),
            Textarea::make('body')->label('Texte')->rows(4)->columnSpanFull(),
            TextInput::make('asset_url')->label('Asset URL')->url()->columnSpanFull(),
            TextInput::make('click_url')->label('URL cible')->url()->columnSpanFull(),
            TextInput::make('cta_label')->label('CTA'),
            TextInput::make('alt_text')->label('Texte alternatif'),
        ])]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('title')->label('Création')->searchable(),
            TextColumn::make('campaign.name')->label('Campagne')->searchable(),
            TextColumn::make('creative_type')->label('Format')->badge(),
            TextColumn::make('headline')->label('Titre')->limit(30),
            IconColumn::make('is_active')->boolean()->label('Active'),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return ['index'=>ListAdCreatives::route('/'),'create'=>CreateAdCreative::route('/create'),'edit'=>EditAdCreative::route('/{record}/edit')];
    }
}
