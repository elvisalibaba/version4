<?php

namespace App\Filament\Resources\AdCampaigns;

use App\Filament\Concerns\RequiresStaffPermission;
use App\Filament\Resources\AdCampaigns\Pages\CreateAdCampaign;
use App\Filament\Resources\AdCampaigns\Pages\EditAdCampaign;
use App\Filament\Resources\AdCampaigns\Pages\ListAdCampaigns;
use App\Models\AdCampaign;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class AdCampaignResource extends Resource
{
    use RequiresStaffPermission;

    protected static string $staffManagePermission = 'marketing.manage';

    protected static ?string $staffViewPermission = 'analytics.view';

    protected static ?string $model = AdCampaign::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-megaphone';

    protected static ?string $navigationLabel = 'Campagnes';

    protected static ?string $modelLabel = 'campagne publicitaire';

    protected static ?string $pluralModelLabel = 'campagnes publicitaires';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Publicité';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([Section::make('Campagne')->columns(2)->schema([
            TextInput::make('advertiser_name')->label('Annonceur')->required(),
            TextInput::make('advertiser_email')->label('Email annonceur')->email(),
            TextInput::make('name')->label('Nom campagne')->required(),
            Select::make('objective')->options(['awareness' => 'Notoriété', 'traffic' => 'Trafic', 'conversion' => 'Conversion', 'launch' => 'Lancement'])->default('awareness'),
            Select::make('status')->options(['draft' => 'Brouillon', 'scheduled' => 'Planifiée', 'active' => 'Active', 'paused' => 'Pause', 'completed' => 'Terminée'])->default('draft')->required(),
            TagsInput::make('channels')->label('Canaux')->placeholder('web, mobile'),
            TextInput::make('budget')->numeric()->minValue(0)->default(0),
            TextInput::make('currency_code')->label('Devise')->default('USD')->maxLength(3),
            DateTimePicker::make('starts_at')->label('Début'),
            DateTimePicker::make('ends_at')->label('Fin'),
            TextInput::make('frequency_cap')->label('Fréquence max')->numeric()->minValue(1),
            Textarea::make('notes')->columnSpanFull()->rows(4),
        ])]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('name')->label('Campagne')->searchable()->sortable(),
            TextColumn::make('advertiser_name')->label('Annonceur')->searchable(),
            TextColumn::make('status')->badge(),
            TextColumn::make('budget')->money(fn ($record) => $record->currency_code)->label('Budget'),
            TextColumn::make('spent')->money(fn ($record) => $record->currency_code)->label('Dépensé'),
            TextColumn::make('starts_at')->dateTime('d/m/Y H:i')->label('Début'),
            TextColumn::make('ends_at')->dateTime('d/m/Y H:i')->label('Fin'),
        ])->filters([
            SelectFilter::make('status')->options(['draft' => 'Brouillon', 'scheduled' => 'Planifiée', 'active' => 'Active', 'paused' => 'Pause', 'completed' => 'Terminée']),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return ['index' => ListAdCampaigns::route('/'), 'create' => CreateAdCampaign::route('/create'), 'edit' => EditAdCampaign::route('/{record}/edit')];
    }
}
