<?php

namespace App\Filament\Resources\AdPlacements;

use App\Filament\Concerns\RequiresStaffPermission;
use App\Filament\Resources\AdPlacements\Pages\CreateAdPlacement;
use App\Filament\Resources\AdPlacements\Pages\EditAdPlacement;
use App\Filament\Resources\AdPlacements\Pages\ListAdPlacements;
use App\Models\AdPlacement;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class AdPlacementResource extends Resource
{
    use RequiresStaffPermission;

    protected static string $staffManagePermission = 'marketing.manage';

    protected static ?string $staffViewPermission = 'analytics.view';

    protected static ?string $model = AdPlacement::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-rectangle-stack';

    protected static ?string $navigationLabel = 'Emplacements';

    protected static ?string $modelLabel = 'emplacement publicitaire';

    protected static ?string $pluralModelLabel = 'emplacements publicitaires';

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): ?string
    {
        return 'Publicité';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([Section::make('Emplacement')->columns(2)->schema([
            TextInput::make('code')->label('Code API')->required()->unique(ignoreRecord: true),
            TextInput::make('name')->required(),
            Select::make('channel')->options(['web' => 'Web', 'mobile' => 'Mobile', 'both' => 'Web + Mobile'])->default('web')->required(),
            TextInput::make('surface')->label('Surface')->required(),
            TextInput::make('position')->label('Position'),
            TagsInput::make('allowed_creative_types')->label('Formats autorisés'),
            TextInput::make('width')->label('Largeur px')->numeric(),
            TextInput::make('height')->label('Hauteur px')->numeric(),
            Toggle::make('is_active')->label('Actif')->default(true),
        ])]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('code')->label('Code')->copyable()->searchable(),
            TextColumn::make('name')->searchable(),
            TextColumn::make('channel')->badge(),
            TextColumn::make('surface')->label('Surface'),
            TextColumn::make('position')->label('Position'),
            IconColumn::make('is_active')->boolean()->label('Actif'),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return ['index' => ListAdPlacements::route('/'), 'create' => CreateAdPlacement::route('/create'), 'edit' => EditAdPlacement::route('/{record}/edit')];
    }
}
