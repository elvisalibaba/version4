<?php

namespace App\Filament\Resources\Promotions;

use App\Support\StaffAccess;
use App\Filament\Resources\Promotions\Pages\CreatePromotionCampaign;
use App\Filament\Resources\Promotions\Pages\EditPromotionCampaign;
use App\Filament\Resources\Promotions\Pages\ListPromotionCampaigns;
use App\Models\Book;
use App\Models\PromotionCampaign;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PromotionCampaignResource extends Resource
{
    protected static ?string $model = PromotionCampaign::class;
    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-megaphone';
    protected static ?string $navigationLabel = 'Promotions';
    protected static ?string $modelLabel = 'campagne';
    protected static ?string $pluralModelLabel = 'campagnes promotionnelles';
    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Marketing & Promotions';
    }

    public static function canViewAny(): bool
    {
        return StaffAccess::allows('marketing.manage');
    }

    public static function canCreate(): bool
    {
        return StaffAccess::allows('marketing.manage');
    }

    public static function canEdit($record): bool
    {
        return StaffAccess::allows('marketing.manage');
    }

    public static function canDelete($record): bool
    {
        return StaffAccess::allows('marketing.manage');
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Campagne promotionnelle')
                ->columns(2)
                ->schema([
                    TextInput::make('name')->label('Nom interne')->required()->maxLength(255),
                    TextInput::make('internal_code')->label('Code interne')->required()->unique(ignoreRecord: true)->maxLength(80),
                    TextInput::make('headline')->label('Accroche publique')->maxLength(255)->columnSpanFull(),
                    Textarea::make('description')->label('Description')->rows(3)->columnSpanFull(),
                    Select::make('discount_type')->label('Type de remise')->options([
                        'percentage' => 'Pourcentage',
                        'fixed' => 'Montant fixe',
                    ])->required()->default('percentage'),
                    TextInput::make('discount_value')->label('Valeur remise')->numeric()->minValue(0)->required(),
                    TextInput::make('currency_code')->label('Devise si remise fixe')->maxLength(3)->default('USD'),
                    TextInput::make('priority')->label('Priorité')->numeric()->minValue(1)->default(100)->required(),
                    Select::make('selected_book_ids')
                        ->label('Livres concernés')
                        ->multiple()->searchable()->preload()
                        ->options(fn (): array => Book::query()->where('status', 'published')->orderBy('title')->pluck('title', 'id')->all())
                        ->helperText('Laissez vide pour appliquer la campagne à tout le catalogue éligible.')
                        ->columnSpanFull(),
                    Select::make('channels')->label('Canaux')->multiple()->options([
                        'web' => 'Web',
                        'mobile' => 'Application mobile',
                        'home' => 'Accueil',
                        'catalog' => 'Catalogue',
                        'email' => 'Email',
                        'social' => 'Réseaux sociaux',
                    ])->default(['web', 'mobile']),
                    Toggle::make('is_active')->label('Campagne active')->default(false),
                    DateTimePicker::make('starts_at')->label('Début'),
                    DateTimePicker::make('ends_at')->label('Fin'),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn ($query) => $query
                ->withCount([
                    'events as impressions_count' => fn ($query) => $query->where('event_type', 'impression'),
                    'events as clicks_count' => fn ($query) => $query->where('event_type', 'click'),
                    'events as checkouts_count' => fn ($query) => $query->where('event_type', 'checkout'),
                    'events as conversions_count' => fn ($query) => $query->where('event_type', 'conversion'),
                ]))
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('name')->label('Campagne')->searchable(),
                TextColumn::make('internal_code')->label('Code')->badge(),
                TextColumn::make('discount_value')->label('Remise')
                    ->formatStateUsing(fn ($state, PromotionCampaign $record) => $record->discount_type === 'percentage' ? $state.'%' : $state.' '.($record->currency_code ?: '')),
                IconColumn::make('is_active')->label('Active')->boolean(),
                TextColumn::make('impressions_count')->label('Impressions')->numeric(),
                TextColumn::make('clicks_count')->label('Clics')->numeric(),
                TextColumn::make('checkouts_count')->label('Paniers')->numeric(),
                TextColumn::make('conversions_count')->label('Conversions')->numeric(),
                TextColumn::make('starts_at')->label('Début')->dateTime('d/m/Y H:i'),
                TextColumn::make('ends_at')->label('Fin')->dateTime('d/m/Y H:i'),
            ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPromotionCampaigns::route('/'),
            'create' => CreatePromotionCampaign::route('/create'),
            'edit' => EditPromotionCampaign::route('/{record}/edit'),
        ];
    }
}
