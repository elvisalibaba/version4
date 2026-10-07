<?php

namespace App\Filament\Resources\PublishingHouseMembers;

use App\Filament\Concerns\RequiresStaffPermission;
use App\Filament\Resources\PublishingHouseMembers\Pages\CreatePublishingHouseMember;
use App\Filament\Resources\PublishingHouseMembers\Pages\EditPublishingHouseMember;
use App\Filament\Resources\PublishingHouseMembers\Pages\ListPublishingHouseMembers;
use App\Models\PublishingHouseMember;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PublishingHouseMemberResource extends Resource
{
    use RequiresStaffPermission;

    protected static string $staffManagePermission = 'authors.manage';

    protected static ?string $staffViewPermission = 'catalog.view';

    protected static ?string $model = PublishingHouseMember::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationLabel = 'Équipe éditoriale';

    protected static ?string $modelLabel = 'membre';

    protected static ?string $pluralModelLabel = 'équipe éditoriale';

    protected static ?int $navigationSort = 4;

    public static function getNavigationGroup(): ?string
    {
        return 'Maison d’édition';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([Section::make('Membre de la maison')->columns(2)->schema([
            Select::make('publishing_house_id')->relationship('publishingHouse', 'name')->label('Maison')->searchable()->preload()->required(),
            Select::make('profile_id')->relationship('profile', 'email')->label('Compte')->searchable()->preload()->required(),
            Select::make('role')->options([
                'owner' => 'Direction', 'admin' => 'Administration', 'editor' => 'Éditorial', 'rights' => 'Droits',
                'marketing' => 'Marketing', 'finance' => 'Finance', 'analyst' => 'Analyste',
            ])->default('editor')->required(),
            TextInput::make('title')->label('Fonction'),
            Toggle::make('is_active')->label('Actif')->default(true),
            DateTimePicker::make('joined_at')->label('Arrivée')->default(now()),
        ])]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('profile.name')->label('Nom')->placeholder('—')->searchable(),
            TextColumn::make('profile.email')->label('Email')->searchable(),
            TextColumn::make('publishingHouse.name')->label('Maison'),
            TextColumn::make('role')->label('Rôle')->badge(),
            TextColumn::make('title')->label('Fonction'),
            IconColumn::make('is_active')->boolean()->label('Actif'),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPublishingHouseMembers::route('/'),
            'create' => CreatePublishingHouseMember::route('/create'),
            'edit' => EditPublishingHouseMember::route('/{record}/edit'),
        ];
    }
}
