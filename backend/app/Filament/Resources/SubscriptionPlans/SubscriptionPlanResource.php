<?php

namespace App\Filament\Resources\SubscriptionPlans;

use App\Filament\Resources\SubscriptionPlans\Pages\CreateSubscriptionPlan;
use App\Filament\Resources\SubscriptionPlans\Pages\EditSubscriptionPlan;
use App\Filament\Resources\SubscriptionPlans\Pages\ListSubscriptionPlans;
use App\Models\SubscriptionPlan;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class SubscriptionPlanResource extends Resource
{
    protected static ?string $model = SubscriptionPlan::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-rectangle-stack';

    protected static ?string $navigationLabel = 'Plans';

    protected static ?string $modelLabel = 'plan';

    protected static ?string $pluralModelLabel = 'plans';

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): ?string
    {
        return 'Commerce';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Plan d’abonnement')
                ->columns(2)
                ->schema([
                    TextInput::make('name')
                        ->label('Nom')
                        ->required()
                        ->maxLength(255)
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn (Set $set, ?string $state) => $set('slug', Str::slug((string) $state))),
                    TextInput::make('slug')->label('Slug')->required()->maxLength(255),
                    TextInput::make('monthly_price')->label('Prix mensuel')->numeric()->minValue(0)->required(),
                    TextInput::make('currency_code')->label('Devise')->default('USD')->maxLength(3)->required(),
                    TextInput::make('max_devices')->label('Appareils max')->numeric()->minValue(1)->maxValue(10)->default(2),
                    TextInput::make('offline_days')->label('Jours hors ligne')->numeric()->minValue(0)->maxValue(30)->default(7),
                    Toggle::make('downloads_enabled')->label('Téléchargements autorisés')->default(true),
                    Toggle::make('is_active')->label('Plan actif')->default(true),
                    Textarea::make('description')->label('Description')->rows(4)->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')->label('Plan')->searchable()->sortable(),
                TextColumn::make('monthly_price')->label('Prix')->money(fn (SubscriptionPlan $record): string => $record->currency_code)->sortable(),
                IconColumn::make('is_active')->label('Actif')->boolean(),
                IconColumn::make('downloads_enabled')->label('Offline')->boolean(),
                TextColumn::make('max_devices')->label('Appareils')->numeric(),
                TextColumn::make('subscriptions_count')->counts('subscriptions')->label('Abonnés')->sortable(),
                TextColumn::make('created_at')->label('Créé le')->dateTime('d/m/Y')->sortable(),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListSubscriptionPlans::route('/'),
            'create' => CreateSubscriptionPlan::route('/create'),
            'edit' => EditSubscriptionPlan::route('/{record}/edit'),
        ];
    }
}
