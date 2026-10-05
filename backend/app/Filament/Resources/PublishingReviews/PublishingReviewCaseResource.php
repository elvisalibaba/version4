<?php

namespace App\Filament\Resources\PublishingReviews;

use App\Support\StaffAccess;
use App\Filament\Resources\PublishingReviews\Pages\CreatePublishingReviewCase;
use App\Filament\Resources\PublishingReviews\Pages\EditPublishingReviewCase;
use App\Filament\Resources\PublishingReviews\Pages\ListPublishingReviewCases;
use App\Models\Book;
use App\Models\PublishingReviewCase;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class PublishingReviewCaseResource extends Resource
{
    protected static ?string $model = PublishingReviewCase::class;
    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-shield-exclamation';
    protected static ?string $navigationLabel = 'Décisions & recours';
    protected static ?string $modelLabel = 'dossier';
    protected static ?string $pluralModelLabel = 'dossiers de revue';

    public static function getNavigationGroup(): ?string
    {
        return 'Direction éditoriale';
    }

    public static function canViewAny(): bool
    {
        return StaffAccess::allows('editorial.review');
    }

    public static function canCreate(): bool
    {
        return StaffAccess::allows('editorial.review');
    }

    public static function canEdit($record): bool
    {
        return StaffAccess::allows('editorial.review');
    }

    public static function canDelete($record): bool
    {
        return StaffAccess::allows('editorial.review');
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Décision éditoriale explicable')
                ->columns(2)
                ->schema([
                    Select::make('book_id')->label('Livre')->relationship('book', 'title')->searchable()->preload()->required(),
                    TextInput::make('case_number')->label('N° dossier')->required()->unique(ignoreRecord: true),
                    Select::make('case_type')->label('Type')->options([
                        'metadata' => 'Métadonnées',
                        'rights' => 'Droits',
                        'content' => 'Contenu',
                        'quality' => 'Qualité',
                        'payment' => 'Paiement',
                        'account' => 'Compte',
                        'other' => 'Autre',
                    ])->required(),
                    Select::make('severity')->label('Gravité')->options([
                        'info' => 'Information',
                        'warning' => 'Avertissement',
                        'blocking' => 'Bloquant',
                    ])->required(),
                    Select::make('status')->label('Statut')->options([
                        'open' => 'Ouvert',
                        'author_action' => 'Action auteur requise',
                        'under_review' => 'En revue',
                        'resolved' => 'Résolu',
                        'rejected' => 'Rejeté',
                        'appealed' => 'Recours auteur',
                    ])->required(),
                    TextInput::make('reason_code')->label('Code motif')->maxLength(80),
                    TextInput::make('title')->label('Titre décision')->required()->columnSpanFull(),
                    Textarea::make('explanation')->label('Explication précise')->rows(5)->required()->columnSpanFull(),
                    Textarea::make('required_action')->label('Action demandée à l’auteur')->rows(4)->columnSpanFull(),
                    Textarea::make('author_response')->label('Réponse / recours auteur')->rows(4)->columnSpanFull(),
                    Textarea::make('resolution_note')->label('Résolution')->rows(4)->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->defaultSort('created_at', 'desc')->columns([
            TextColumn::make('case_number')->label('Dossier')->searchable(),
            TextColumn::make('book.title')->label('Livre')->searchable(),
            TextColumn::make('case_type')->label('Type')->badge(),
            TextColumn::make('severity')->label('Gravité')->badge(),
            TextColumn::make('status')->label('Statut')->badge(),
            TextColumn::make('created_at')->label('Ouvert')->dateTime('d/m/Y H:i'),
        ])->filters([
            SelectFilter::make('status')->options([
                'open' => 'Ouvert',
                'author_action' => 'Action auteur',
                'under_review' => 'En revue',
                'resolved' => 'Résolu',
                'rejected' => 'Rejeté',
                'appealed' => 'Recours',
            ]),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListPublishingReviewCases::route('/'),
            'create' => CreatePublishingReviewCase::route('/create'),
            'edit' => EditPublishingReviewCase::route('/{record}/edit'),
        ];
    }
}
