<?php

namespace App\Filament\Resources\MobileAppVersions;

use App\Filament\Concerns\RequiresStaffPermission;
use App\Filament\Resources\MobileAppVersions\Pages\CreateMobileAppVersion;
use App\Filament\Resources\MobileAppVersions\Pages\EditMobileAppVersion;
use App\Filament\Resources\MobileAppVersions\Pages\ListMobileAppVersions;
use App\Models\MobileAppVersion;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
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

class MobileAppVersionResource extends Resource
{
    use RequiresStaffPermission;

    protected static string $staffManagePermission = 'platform.manage';

    protected static ?string $staffViewPermission = null;

    protected static ?string $model = MobileAppVersion::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-arrow-down-tray';

    protected static ?string $navigationLabel = 'Versions mobile';

    protected static ?string $modelLabel = 'version mobile';

    protected static ?string $pluralModelLabel = 'versions mobile';

    protected static ?string $recordTitleAttribute = 'version_name';

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): ?string
    {
        return 'Mobile';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Version')
                ->columns(3)
                ->schema([
                    Select::make('platform')->label('Plateforme')->options(['android' => 'Android', 'ios' => 'iOS'])->default('android')->required(),
                    TextInput::make('version_name')->label('Version')->required()->maxLength(80),
                    TextInput::make('version_code')->label('Code version')->numeric()->minValue(1)->required(),
                    TextInput::make('minimum_supported_version_code')->label('Version minimale')->numeric()->minValue(1)->default(1)->required(),
                    TextInput::make('package_name')->label('Package')->maxLength(255),
                    TextInput::make('file_name')->label('Nom fichier')->required()->maxLength(255),
                    FileUpload::make('storage_path')
                        ->label('Fichier application')
                        ->disk('books')
                        ->directory('mobile/releases')
                        ->visibility('private')
                        ->acceptedFileTypes([
                            'application/vnd.android.package-archive',
                            'application/octet-stream',
                        ])
                        ->maxSize(512000)
                        ->required()
                        ->columnSpanFull(),
                    TextInput::make('checksum_sha256')->label('SHA-256')->maxLength(64)->columnSpan(2),
                    TextInput::make('file_size_bytes')->label('Taille (octets)')->numeric()->minValue(0),
                    Textarea::make('release_notes')->label('Notes de version')->rows(4)->columnSpanFull(),
                    Toggle::make('is_mandatory')->label('Mise à jour obligatoire'),
                    Toggle::make('is_published')->label('Publiée'),
                    DateTimePicker::make('published_at')->label('Publication'),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('version_code', 'desc')
            ->columns([
                TextColumn::make('platform')->label('Plateforme')->badge(),
                TextColumn::make('version_name')->label('Version')->searchable(),
                TextColumn::make('version_code')->label('Code')->sortable(),
                TextColumn::make('minimum_supported_version_code')->label('Min.')->sortable(),
                IconColumn::make('is_published')->label('Publiée')->boolean(),
                IconColumn::make('is_mandatory')->label('Obligatoire')->boolean(),
                TextColumn::make('download_count')->label('Téléchargements')->numeric()->sortable(),
                TextColumn::make('published_at')->label('Publication')->dateTime('d/m/Y H:i')->sortable(),
            ])
            ->filters([
                SelectFilter::make('platform')->options(['android' => 'Android', 'ios' => 'iOS']),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListMobileAppVersions::route('/'),
            'create' => CreateMobileAppVersion::route('/create'),
            'edit' => EditMobileAppVersion::route('/{record}/edit'),
        ];
    }
}
