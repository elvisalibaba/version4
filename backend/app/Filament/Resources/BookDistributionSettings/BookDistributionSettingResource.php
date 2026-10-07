<?php

namespace App\Filament\Resources\BookDistributionSettings;

use App\Filament\Resources\BookDistributionSettings\Pages\ListBookDistributionSettings;
use App\Models\BookDistributionSetting;
use App\Support\StaffAccess;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

/**
 * Seul endroit où le taux de royalties d'un livre peut être fixé.
 * Les auteurs le voient en lecture seule dans leur studio.
 */
class BookDistributionSettingResource extends Resource
{
    protected static ?string $model = BookDistributionSetting::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-receipt-percent';

    protected static ?string $navigationLabel = 'Taux de royalties';

    protected static ?string $modelLabel = 'taux de royalties';

    protected static ?string $pluralModelLabel = 'taux de royalties';

    protected static ?int $navigationSort = 0;

    public static function getNavigationGroup(): ?string
    {
        return 'Finance auteurs';
    }

    public static function canViewAny(): bool
    {
        return StaffAccess::allows('finance.manage');
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('updated_at', 'desc')
            ->columns([
                TextColumn::make('book.title')->label('Livre')->searchable()->limit(50),
                TextColumn::make('book.author_display_name')->label('Auteur')->placeholder('—'),
                TextColumn::make('local_currency')->label('Devise'),
                TextColumn::make('royalty_rate')
                    ->label('Taux auteur')
                    ->formatStateUsing(fn ($state) => $state === null ? 'Taux plateforme' : number_format((float) $state * 100, 0).' %')
                    ->placeholder('Taux plateforme ('.number_format((float) config('publishing.default_royalty_rate', 0.70) * 100, 0).' %)'),
                TextColumn::make('updated_at')->label('Modifié')->since(),
            ])
            ->recordActions([
                Action::make('setRoyaltyRate')
                    ->label('Fixer le taux')
                    ->icon('heroicon-o-receipt-percent')
                    ->fillForm(fn (BookDistributionSetting $record): array => [
                        'royalty_rate' => $record->royalty_rate !== null ? round((float) $record->royalty_rate * 100, 2) : null,
                    ])
                    ->schema([
                        TextInput::make('royalty_rate')
                            ->label('Taux auteur (%)')
                            ->numeric()
                            ->minValue(0)
                            ->maxValue(100)
                            ->suffix('%')
                            ->helperText('Selon le contrat signé. Laissez vide pour appliquer le taux plateforme.'),
                    ])
                    ->action(fn (BookDistributionSetting $record, array $data) => $record->update([
                        'royalty_rate' => filled($data['royalty_rate'] ?? null)
                            ? round(((float) $data['royalty_rate']) / 100, 4)
                            : null,
                    ])),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListBookDistributionSettings::route('/'),
        ];
    }
}
