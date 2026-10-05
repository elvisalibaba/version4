<?php

namespace App\Filament\Resources\Orders;

use App\Support\StaffAccess;
use App\Filament\Resources\Orders\Pages\EditOrder;
use App\Filament\Resources\Orders\Pages\ListOrders;
use App\Models\Order;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class OrderResource extends Resource
{
    protected static ?string $model = Order::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationLabel = 'Commandes';

    protected static ?string $modelLabel = 'commande';

    protected static ?string $pluralModelLabel = 'commandes';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Commerce';
    }

    public static function canViewAny(): bool
    {
        return StaffAccess::allows('commerce.view') || StaffAccess::allows('commerce.manage');
    }

    public static function canCreate(): bool
    {
        return StaffAccess::allows('commerce.manage');
    }

    public static function canEdit($record): bool
    {
        return StaffAccess::allows('commerce.manage');
    }

    public static function canDelete($record): bool
    {
        return StaffAccess::allows('commerce.manage');
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Commande')
                ->columns(2)
                ->schema([
                    Select::make('user_id')->label('Client')->relationship('profile', 'email')->disabled(),
                    TextInput::make('total_price')->label('Montant')->disabled(),
                    TextInput::make('currency_code')->label('Devise')->disabled(),
                    Select::make('payment_status')
                        ->label('Statut paiement')
                        ->options([
                            'pending' => 'En attente',
                            'paid' => 'Payé',
                            'failed' => 'Échec',
                            'refunded' => 'Remboursé',
                        ])
                        ->required(),
                    TextInput::make('payment_provider')->label('Fournisseur paiement')->maxLength(100),
                    TextInput::make('payment_channel')->label('Canal')->maxLength(100),
                    TextInput::make('payment_transaction_id')->label('Transaction ID')->maxLength(255),
                    TextInput::make('payment_provider_status')->label('Statut fournisseur')->maxLength(100),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('id')->label('Référence')->copyable()->limit(12),
                TextColumn::make('profile.email')->label('Client')->searchable(),
                TextColumn::make('total_price')->label('Montant')->money(fn (Order $record): string => $record->currency_code)->sortable(),
                TextColumn::make('payment_status')->label('Paiement')->badge()->sortable(),
                TextColumn::make('payment_provider')->label('Provider')->toggleable(),
                TextColumn::make('items_count')->counts('items')->label('Articles')->sortable(),
                TextColumn::make('created_at')->label('Date')->dateTime('d/m/Y H:i')->sortable(),
            ])
            ->filters([
                SelectFilter::make('payment_status')
                    ->label('Paiement')
                    ->options([
                        'pending' => 'En attente',
                        'paid' => 'Payé',
                        'failed' => 'Échec',
                        'refunded' => 'Remboursé',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListOrders::route('/'),
            'edit' => EditOrder::route('/{record}/edit'),
        ];
    }
}
