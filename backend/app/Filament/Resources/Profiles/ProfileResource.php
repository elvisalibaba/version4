<?php

namespace App\Filament\Resources\Profiles;

use App\Filament\Resources\Profiles\Pages\EditProfile;
use App\Filament\Resources\Profiles\Pages\ListProfiles;
use App\Models\Profile;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ProfileResource extends Resource
{
    protected static ?string $model = Profile::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationLabel = 'Utilisateurs';

    protected static ?string $modelLabel = 'utilisateur';

    protected static ?string $pluralModelLabel = 'utilisateurs';

    protected static ?string $recordTitleAttribute = 'email';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Utilisateurs';
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
                        ->required(),
                    TextInput::make('name')->label('Nom affiché')->maxLength(255),
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
