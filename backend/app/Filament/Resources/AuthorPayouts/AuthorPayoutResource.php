<?php

namespace App\Filament\Resources\AuthorPayouts;

use App\Support\StaffAccess;
use App\Filament\Resources\AuthorPayouts\Pages\ListAuthorPayouts;
use App\Models\AuthorPayout;
use App\Services\AuthorRoyaltyService;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AuthorPayoutResource extends Resource
{
    protected static ?string $model = AuthorPayout::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-banknotes';

    protected static ?string $navigationLabel = 'Versements auteurs';

    protected static ?string $modelLabel = 'versement auteur';

    protected static ?string $pluralModelLabel = 'versements auteurs';

    protected static ?int $navigationSort = 2;

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
            ->defaultSort('requested_at', 'desc')
            ->columns([
                TextColumn::make('profile.email')->label('Auteur')->searchable(),
                TextColumn::make('amount')->label('Montant')->money(fn (AuthorPayout $record): string => $record->currency_code)->weight('bold'),
                TextColumn::make('payoutAccount.provider')->label('Banque / réseau')->placeholder('—'),
                TextColumn::make('status')->label('Statut')->badge(),
                TextColumn::make('provider_reference')->label('Référence')->placeholder('—')->copyable(),
                TextColumn::make('requested_at')->label('Demandé le')->dateTime('d/m/Y H:i')->sortable(),
                TextColumn::make('processed_at')->label('Traité le')->dateTime('d/m/Y H:i')->placeholder('—'),
            ])
            ->filters([
                SelectFilter::make('status')->options([
                    'requested' => 'Demandé',
                    'approved' => 'Approuvé',
                    'processing' => 'En traitement',
                    'paid' => 'Payé',
                    'failed' => 'Échec',
                    'rejected' => 'Rejeté',
                    'cancelled' => 'Annulé',
                ]),
            ])
            ->recordActions([
                Action::make('approve')
                    ->label('Approuver')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (AuthorPayout $record): bool => $record->status === 'requested')
                    ->action(fn (AuthorPayout $record) => app(AuthorRoyaltyService::class)->approvePayout($record)),
                Action::make('processing')
                    ->label('Mettre en traitement')
                    ->color('warning')
                    ->visible(fn (AuthorPayout $record): bool => in_array($record->status, ['requested', 'approved'], true))
                    ->action(fn (AuthorPayout $record) => app(AuthorRoyaltyService::class)->startPayoutProcessing($record)),
                Action::make('paid')
                    ->label('Marquer payé')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (AuthorPayout $record): bool => in_array($record->status, ['approved', 'processing'], true))
                    ->action(fn (AuthorPayout $record) => app(AuthorRoyaltyService::class)->markPayoutPaid($record)),
                Action::make('reject')
                    ->label('Rejeter')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (AuthorPayout $record): bool => in_array($record->status, ['requested', 'approved'], true))
                    ->action(fn (AuthorPayout $record) => app(AuthorRoyaltyService::class)->rejectPayout($record)),
                Action::make('failed')
                    ->label('Échec paiement')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (AuthorPayout $record): bool => $record->status === 'processing')
                    ->action(fn (AuthorPayout $record) => app(AuthorRoyaltyService::class)->failPayout($record)),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAuthorPayouts::route('/'),
        ];
    }
}
