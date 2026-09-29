<?php

namespace App\Filament\Resources\AdDeliveries;

use App\Filament\Resources\AdDeliveries\Pages\ListAdDeliverys;
use App\Filament\Resources\AdDeliveries\Pages\CreateAdDelivery;
use App\Filament\Resources\AdDeliveries\Pages\EditAdDelivery;
use App\Models\AdAssignment;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class AdDeliveryResource extends Resource
{
    protected static ?string $model = AdAssignment::class;
    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-arrow-path-rounded-square';
    protected static ?string $navigationLabel = 'Diffusion';
    protected static ?string $modelLabel = 'diffusion publicitaire';
    protected static ?string $pluralModelLabel = 'diffusion publicitaire';
    protected static ?int $navigationSort = 4;
    public static function getNavigationGroup(): ?string { return 'Publicité'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([Section::make('Diffusion')->columns(2)->schema([
            Select::make('campaign_id')->relationship('campaign','name')->label('Campagne')->searchable()->preload()->required(),
            Select::make('creative_id')->relationship('creative','title')->label('Création')->searchable()->preload()->required(),
            Select::make('placement_id')->relationship('placement','name')->label('Emplacement')->searchable()->preload()->required(),
            Select::make('status')->options(['active'=>'Active','paused'=>'Pause','completed'=>'Terminée'])->default('active')->required(),
            TextInput::make('weight')->label('Priorité / poids')->numeric()->default(100)->minValue(1),
            DateTimePicker::make('starts_at')->label('Début'),
            DateTimePicker::make('ends_at')->label('Fin'),
        ])]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('campaign.name')->label('Campagne')->searchable(),
            TextColumn::make('creative.title')->label('Création')->searchable(),
            TextColumn::make('placement.code')->label('Emplacement')->copyable(),
            TextColumn::make('status')->badge(),
            TextColumn::make('weight')->label('Poids'),
            TextColumn::make('events_count')->counts('events')->label('Événements'),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return ['index'=>ListAdDeliverys::route('/'),'create'=>CreateAdDelivery::route('/create'),'edit'=>EditAdDelivery::route('/{record}/edit')];
    }
}
