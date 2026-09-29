<?php

namespace App\Filament\Resources\PaymentAttempts;

use App\Filament\Resources\PaymentAttempts\Pages\ListPaymentAttempts;
use App\Filament\Resources\PaymentAttempts\Pages\ViewPaymentAttempt;
use App\Models\PaymentAttempt;
use BackedEnum;
use Filament\Actions\ViewAction;
use Filament\Forms\Components\Placeholder;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class PaymentAttemptResource extends Resource
{
    protected static ?string $model = PaymentAttempt::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-banknotes';

    protected static ?string $navigationLabel = 'Tentatives de paiement';

    protected static ?string $modelLabel = 'tentative de paiement';

    protected static ?string $pluralModelLabel = 'tentatives de paiement';

    protected static ?int $navigationSort = 4;

    public static function getNavigationGroup(): ?string
    {
        return 'Commerce';
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Paiement')
                ->columns(2)
                ->schema([
                    Placeholder::make('user')->label('Utilisateur')->content(fn (PaymentAttempt $record) => $record->profile?->email ?: $record->user_id),
                    Placeholder::make('order')->label('Commande')->content(fn (PaymentAttempt $record) => $record->order_id ?: '—'),
                    Placeholder::make('provider')->label('Fournisseur')->content(fn (PaymentAttempt $record) => $record->provider),
                    Placeholder::make('channel')->label('Canal')->content(fn (PaymentAttempt $record) => $record->payment_channel ?: '—'),
                    Placeholder::make('reference')->label('Référence')->content(fn (PaymentAttempt $record) => $record->provider_reference ?: '—'),
                    Placeholder::make('status')->label('Statut')->content(fn (PaymentAttempt $record) => $record->status),
                    Placeholder::make('amount')->label('Montant')->content(fn (PaymentAttempt $record) => number_format((float) $record->amount, 2, ',', ' ').' '.$record->currency_code),
                    Placeholder::make('verified')->label('Vérifié le')->content(fn (PaymentAttempt $record) => $record->verified_at?->format('d/m/Y H:i') ?: '—'),
                    Placeholder::make('failure')->label('Erreur')->content(fn (PaymentAttempt $record) => $record->failure_reason ?: '—')->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('provider_reference')->label('Référence')->searchable()->copyable()->placeholder('—'),
                TextColumn::make('profile.email')->label('Utilisateur')->searchable(),
                TextColumn::make('amount')->label('Montant')->money(fn (PaymentAttempt $record): string => $record->currency_code)->sortable(),
                TextColumn::make('provider')->label('Provider')->badge(),
                TextColumn::make('payment_channel')->label('Canal')->toggleable(),
                TextColumn::make('status')->label('Statut')->badge()->sortable(),
                TextColumn::make('created_at')->label('Créée le')->dateTime('d/m/Y H:i')->sortable(),
                TextColumn::make('verified_at')->label('Vérifiée le')->dateTime('d/m/Y H:i')->toggleable(),
            ])
            ->filters([
                SelectFilter::make('status')->options([
                    'created' => 'Créée',
                    'pending' => 'En attente',
                    'processing' => 'Traitement',
                    'paid' => 'Payée',
                    'failed' => 'Échec',
                    'cancelled' => 'Annulée',
                    'expired' => 'Expirée',
                    'refunded' => 'Remboursée',
                ]),
            ])
            ->recordActions([
                ViewAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPaymentAttempts::route('/'),
            'view' => ViewPaymentAttempt::route('/{record}'),
        ];
    }
}
