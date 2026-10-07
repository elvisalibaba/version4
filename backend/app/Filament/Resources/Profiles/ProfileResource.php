<?php

namespace App\Filament\Resources\Profiles;

use App\Filament\Resources\Profiles\Pages\EditProfile;
use App\Filament\Resources\Profiles\Pages\ListProfiles;
use App\Models\Profile;
use App\Support\StaffAccess;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ProfileResource extends Resource
{
    protected static ?string $model = Profile::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationLabel = 'Utilisateurs';

    protected static ?string $modelLabel = 'utilisateur';

    protected static ?string $pluralModelLabel = 'utilisateurs';

    protected static ?string $recordTitleAttribute = 'email';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Utilisateurs';
    }

    public static function canViewAny(): bool
    {
        return StaffAccess::allows('users.view') || StaffAccess::allows('users.manage');
    }

    public static function canEdit($record): bool
    {
        if (! StaffAccess::allows('users.manage')) {
            return false;
        }

        // Seul un super administrateur peut modifier un compte du staff.
        return $record->role !== 'admin' || static::currentUserIsSuperAdmin();
    }

    /**
     * Rôle, fonction interne et permissions ne sont modifiables que par un
     * super administrateur : sinon un détenteur de `users.manage` pourrait
     * s'attribuer (ou attribuer à un complice) tous les droits.
     */
    public static function currentUserIsSuperAdmin(): bool
    {
        return (bool) auth()->user()?->profile?->isSuperAdmin();
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Compte')
                ->columns(2)
                ->schema([
                    TextInput::make('email')->label('E-mail')->disabled(),
                    Select::make('role')
                        ->label('Rôle')
                        ->options([
                            'reader' => 'Lecteur',
                            'author' => 'Auteur',
                            'admin' => 'Administrateur',
                        ])
                        ->disabled(fn (): bool => ! static::currentUserIsSuperAdmin())
                        ->required(),
                    Select::make('staff_role')
                        ->label('Fonction interne')
                        ->options([
                            'super_admin' => 'Super administrateur',
                            'editorial_director' => 'Direction éditoriale',
                            'editor' => 'Éditeur',
                            'corrector' => 'Correcteur',
                            'legal' => 'Juridique / droits',
                            'finance' => 'Finance',
                            'marketing' => 'Marketing',
                            'support' => 'Support',
                            'analyst' => 'Data / analyste',
                        ])
                        ->visible(fn (Get $get): bool => $get('role') === 'admin')
                        // Une fonction vide équivaut à super_admin : on impose un choix explicite.
                        ->required(fn (Get $get): bool => $get('role') === 'admin')
                        ->disabled(fn (): bool => ! static::currentUserIsSuperAdmin())
                        ->helperText('Détermine les accès métier au Control Center.'),

                    Select::make('staff_permissions')
                        ->label('Permissions complémentaires')
                        ->multiple()
                        ->searchable()
                        ->options(fn (): array => config('staff_permissions.permissions', []))
                        ->visible(fn (Get $get): bool => $get('role') === 'admin')
                        ->disabled(fn (): bool => ! static::currentUserIsSuperAdmin())
                        ->helperText('Ajouts ponctuels au rôle interne. Le Super Admin possède tout.')
                        ->columnSpanFull(),
                    TextInput::make('name')->label('Nom affiché')->maxLength(255),
                    FileUpload::make('avatar_url')
                        ->label('Photo de profil')
                        ->disk('public')
                        ->directory('avatars/profiles')
                        ->visibility('public')
                        ->image()
                        ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
                        ->maxSize(5120)
                        ->helperText('Importez une photo JPG, PNG ou WebP. Aucune URL à saisir.')
                        ->columnSpanFull(),
                    TextInput::make('first_name')->label('Prénom')->maxLength(255),
                    TextInput::make('last_name')->label('Nom')->maxLength(255),
                    TextInput::make('phone')->label('Téléphone')->maxLength(50),
                    TextInput::make('country')->label('Pays')->maxLength(120),
                    TextInput::make('city')->label('Ville')->maxLength(120),
                    TextInput::make('preferred_language')->label('Langue')->maxLength(10),
                    Toggle::make('marketing_opt_in')->label('Communications marketing'),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                ImageColumn::make('avatar_url')->label('Photo')->disk('public')->circular()->defaultImageUrl(null),
                TextColumn::make('name')->label('Nom')->searchable()->sortable(),
                TextColumn::make('email')->label('E-mail')->searchable()->copyable(),
                TextColumn::make('role')->label('Rôle')->badge()->sortable(),
                TextColumn::make('country')->label('Pays')->toggleable(),
                TextColumn::make('city')->label('Ville')->toggleable(),
                IconColumn::make('marketing_opt_in')->label('Marketing')->boolean()->toggleable(),
                TextColumn::make('created_at')->label('Inscription')->dateTime('d/m/Y H:i')->sortable(),
            ])
            ->filters([
                SelectFilter::make('role')
                    ->label('Rôle')
                    ->options([
                        'reader' => 'Lecteur',
                        'author' => 'Auteur',
                        'admin' => 'Administrateur',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListProfiles::route('/'),
            'edit' => EditProfile::route('/{record}/edit'),
        ];
    }
}
