<?php

namespace App\Filament\Resources\RightsContracts;

use App\Support\StaffAccess;
use App\Filament\Resources\RightsContracts\Pages\ListRightsContracts;
use App\Filament\Resources\RightsContracts\Pages\CreateRightsContract;
use App\Filament\Resources\RightsContracts\Pages\EditRightsContract;
use App\Models\RightsContract;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class RightsContractResource extends Resource
{
    protected static ?string $model = RightsContract::class;
    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-shield-check';
    protected static ?string $navigationLabel = 'Droits & licences';
    protected static ?string $modelLabel = 'contrat de droits';
    protected static ?string $pluralModelLabel = 'droits & licences';
    protected static ?int $navigationSort = 3;
    public static function getNavigationGroup(): ?string { return 'Maison d’édition'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Contrat / Licence')->columns(2)->schema([
                Select::make('book_id')->relationship('book','title')->label('Titre')->searchable()->preload(),
                Select::make('publishing_house_id')->relationship('publishingHouse','name')->label('Maison')->searchable()->preload(),
                TextInput::make('contract_number')->label('N° contrat'),
                Select::make('status')->options([
                    'draft'=>'Brouillon','negotiating'=>'Négociation','active'=>'Actif','expired'=>'Expiré','terminated'=>'Résilié','blocked'=>'Bloqué'
                ])->default('draft')->required(),
                TextInput::make('rights_holder_name')->label('Titulaire des droits')->required(),
                TextInput::make('licensor_name')->label('Concédant / Agent'),
                TagsInput::make('territories')->label('Territoires')->placeholder('CD, FR, BE…'),
                TagsInput::make('languages')->label('Langues')->placeholder('fr, en…'),
                TagsInput::make('permitted_media')->label('Formats autorisés')->placeholder('ebook, print, audiobook, video'),
                Toggle::make('exclusive')->label('Exclusif'),
                DatePicker::make('starts_at')->label('Début'),
                DatePicker::make('ends_at')->label('Fin'),
                FileUpload::make('proof_path')->label('Contrat / preuve')->disk('books')->directory('rights-contracts')->visibility('private')->columnSpanFull(),
                Textarea::make('notes')->rows(5)->columnSpanFull(),
            ]),
        ]);
    }

    public static function canViewAny(): bool
    {
        return StaffAccess::allows('rights.manage');
    }

    public static function canCreate(): bool
    {
        return StaffAccess::allows('rights.manage');
    }

    public static function canEdit($record): bool
    {
        return StaffAccess::allows('rights.manage');
    }

    public static function canDelete($record): bool
    {
        return StaffAccess::allows('rights.manage');
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('book.title')->label('Titre')->searchable()->limit(35),
            TextColumn::make('rights_holder_name')->label('Titulaire')->searchable(),
            TextColumn::make('status')->badge(),
            IconColumn::make('exclusive')->boolean()->label('Exclusif'),
            TextColumn::make('starts_at')->date('d/m/Y')->label('Début'),
            TextColumn::make('ends_at')->date('d/m/Y')->label('Fin'),
        ])->filters([
            SelectFilter::make('status')->options(['draft'=>'Brouillon','negotiating'=>'Négociation','active'=>'Actif','expired'=>'Expiré','terminated'=>'Résilié','blocked'=>'Bloqué']),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return ['index'=>ListRightsContracts::route('/'),'create'=>CreateRightsContract::route('/create'),'edit'=>EditRightsContract::route('/{record}/edit')];
    }
}
