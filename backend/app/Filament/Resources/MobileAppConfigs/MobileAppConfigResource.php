<?php

namespace App\Filament\Resources\MobileAppConfigs;

use App\Filament\Resources\MobileAppConfigs\Pages\CreateMobileAppConfig;
use App\Filament\Resources\MobileAppConfigs\Pages\EditMobileAppConfig;
use App\Filament\Resources\MobileAppConfigs\Pages\ListMobileAppConfigs;
use App\Models\MobileAppConfig;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class MobileAppConfigResource extends Resource
{
    protected static ?string $model = MobileAppConfig::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-device-phone-mobile';

    protected static ?string $navigationLabel = 'Application mobile';

    protected static ?string $modelLabel = 'configuration mobile';

    protected static ?string $pluralModelLabel = 'configuration mobile';

    protected static ?string $recordTitleAttribute = 'app_name';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Mobile';
    }

    public static function canCreate(): bool
    {
        return ! MobileAppConfig::query()->whereKey('global')->exists();
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Présentation')
                ->columns(2)
                ->schema([
                    TextInput::make('app_name')->label('Nom application')->required()->maxLength(120),
                    TextInput::make('android_cta_label')->label('Libellé bouton Android')->required()->maxLength(120),
                    TextInput::make('hero_title')->label('Titre')->required()->maxLength(255)->columnSpanFull(),
                    Textarea::make('hero_description')->label('Description')->rows(4)->required()->columnSpanFull(),
                ]),

            Section::make('APK de secours')
                ->columns(2)
                ->schema([
                    FileUpload::make('apk_path')
                        ->label('APK')
                        ->disk('books')
                        ->directory('mobile/android')
                        ->visibility('private')
                        ->acceptedFileTypes([
                            'application/vnd.android.package-archive',
                            'application/octet-stream',
                        ])
                        ->maxSize(512000),
                    TextInput::make('apk_file_name')->label('Nom de téléchargement')->maxLength(255),
                    TextInput::make('version_label')->label('Version affichée')->maxLength(80),
                    Textarea::make('release_notes')->label('Notes de version')->rows(4)->columnSpanFull(),
                ]),

            Section::make('Publication et essai')
                ->columns(3)
                ->schema([
                    Toggle::make('is_public')->label('Téléchargement public'),
                    Toggle::make('trial_enabled')->label('Essai activé')->default(true),
                    TextInput::make('trial_days')->label('Durée essai (jours)')->numeric()->minValue(1)->maxValue(30)->default(7),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('app_name')->label('Application'),
                TextColumn::make('version_label')->label('Version'),
                IconColumn::make('is_public')->label('Publique')->boolean(),
                IconColumn::make('trial_enabled')->label('Essai')->boolean(),
                TextColumn::make('trial_days')->label('Jours essai'),
                TextColumn::make('updated_at')->label('Mise à jour')->dateTime('d/m/Y H:i'),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListMobileAppConfigs::route('/'),
            'create' => CreateMobileAppConfig::route('/create'),
            'edit' => EditMobileAppConfig::route('/{record}/edit'),
        ];
    }
}
