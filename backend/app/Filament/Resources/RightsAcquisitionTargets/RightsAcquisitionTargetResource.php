<?php

namespace App\Filament\Resources\RightsAcquisitionTargets;

use App\Filament\Resources\RightsAcquisitionTargets\Pages\CreateRightsAcquisitionTarget;
use App\Filament\Resources\RightsAcquisitionTargets\Pages\EditRightsAcquisitionTarget;
use App\Filament\Resources\RightsAcquisitionTargets\Pages\ListRightsAcquisitionTargets;
use App\Models\RightsAcquisitionTarget;
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

class RightsAcquisitionTargetResource extends Resource
{
    protected static ?string $model = RightsAcquisitionTarget::class;
    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-magnifying-glass-circle';
    protected static ?string $navigationLabel = 'Acquisitions de droits';
    protected static ?string $modelLabel = 'cible de droits';
    protected static ?string $pluralModelLabel = 'acquisitions de droits';
    protected static ?int $navigationSort = 3;
    public static function getNavigationGroup(): ?string { return 'Maison d’édition'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([Section::make('Prospection de droits')->description('Suivi interne avant création d’un titre publiable dans le catalogue.')->columns(2)->schema([
            Select::make('author_profile_id')->relationship('authorProfile','display_name')->label('Auteur / ayant droit')->searchable()->preload(),
            TextInput::make('title')->label('Titre ciblé')->required(),
            TextInput::make('original_publisher')->label('Éditeur actuel / original'),
            TextInput::make('isbn')->label('ISBN'),
            Select::make('status')->options([
                'prospect'=>'Prospect','contacted'=>'Contacté','negotiating'=>'Négociation',
                'contracted'=>'Contracté','rejected'=>'Refusé','on_hold'=>'En attente',
            ])->default('prospect')->required(),
            Select::make('priority')->label('Priorité')->options([1=>'Très haute',2=>'Haute',3=>'Normale',4=>'Basse',5=>'Veille'])->default(3)->required(),
            TagsInput::make('territories')->label('Territoires visés'),
            TagsInput::make('languages')->label('Langues visées'),
            TagsInput::make('desired_media')->label('Formats visés')->placeholder('ebook, print, audiobook, video'),
            TextInput::make('estimated_budget')->label('Budget estimé')->numeric()->minValue(0),
            TextInput::make('currency_code')->label('Devise')->default('USD')->maxLength(3),
            TextInput::make('contact_name')->label('Agent / contact'),
            TextInput::make('contact_email')->label('Email contact')->email(),
            TextInput::make('source_url')->label('Source / page officielle')->url()->columnSpanFull(),
            DateTimePicker::make('next_action_at')->label('Prochaine relance'),
            Textarea::make('notes')->rows(5)->columnSpanFull(),
        ])]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('title')->label('Titre ciblé')->searchable()->sortable()->limit(40),
            TextColumn::make('authorProfile.display_name')->label('Auteur')->searchable(),
            TextColumn::make('status')->badge(),
            TextColumn::make('priority')->label('Priorité')->sortable(),
            TextColumn::make('desired_media')->label('Formats')->badge(),
            TextColumn::make('next_action_at')->label('Prochaine action')->dateTime('d/m/Y H:i')->sortable(),
        ])->filters([
            SelectFilter::make('status')->options([
                'prospect'=>'Prospect','contacted'=>'Contacté','negotiating'=>'Négociation',
                'contracted'=>'Contracté','rejected'=>'Refusé','on_hold'=>'En attente',
            ]),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index'=>ListRightsAcquisitionTargets::route('/'),
            'create'=>CreateRightsAcquisitionTarget::route('/create'),
            'edit'=>EditRightsAcquisitionTarget::route('/{record}/edit'),
        ];
    }
}
