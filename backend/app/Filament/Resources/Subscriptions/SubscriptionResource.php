<?php

namespace App\Filament\Resources\Subscriptions;

use App\Filament\Resources\Subscriptions\Pages\EditSubscription;
use App\Filament\Resources\Subscriptions\Pages\ListSubscriptions;
use App\Models\Subscription;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class SubscriptionResource extends Resource
{
    protected static ?string $model = Subscription::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-credit-card';

    protected static ?string $navigationLabel = 'Abonnements';

    protected static ?string $modelLabel = 'abonnement';

    protected static ?string $pluralModelLabel = 'abonnements';

    protected static ?int $navigationSort = 3;

    public static function getNavigationGroup(): ?string
    {
        return 'Commerce';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Abonnement utilisateur')
                ->columns(2)
                ->schema([
                    TextInput::make('profile.email')->label('Utilisateur')->disabled(),
                    TextInput::make('plan.name')->label('Plan')->disabled(),
                    Select::make('status')
                        ->label('Statut')
                        ->options([
                            'active' => 'Actif',
                            'cancelled' => 'Annulé',
                            'expired' => 'Expiré',
                            'past_due' => 'Paiement en retard',
                        ])
                        ->required(),
                    DateTimePicker::make('started_at')->label('Début')->required(),
                    DateTimePicker::make('expires_at')->label('Expiration'),
                    TextInput::make('affiliate_code_used')->label('Code affilié')->maxLength(255),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('profile.email')->label('Utilisateur')->searchable(),
                TextColumn::make('plan.name')->label('Plan')->searchable(),
                TextColumn::make('status')->label('Statut')->badge()->sortable(),
                TextColumn::make('started_at')->label('Début')->dateTime('d/m/Y H:i')->sortable(),
                TextColumn::make('expires_at')->label('Expiration')->dateTime('d/m/Y H:i')->placeholder('Sans expiration')->sortable(),
                TextColumn::make('affiliate_code_used')->label('Affilié')->toggleable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'active' => 'Actif',
                        'cancelled' => 'Annulé',
                        'expired' => 'Expiré',
                        'past_due' => 'Paiement en retard',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListSubscriptions::route('/'),
            'edit' => EditSubscription::route('/{record}/edit'),
        ];
    }
}
