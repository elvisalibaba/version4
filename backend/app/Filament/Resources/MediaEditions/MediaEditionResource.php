<?php

namespace App\Filament\Resources\MediaEditions;

use App\Filament\Resources\MediaEditions\Pages\ListMediaEditions;
use App\Filament\Resources\MediaEditions\Pages\CreateMediaEdition;
use App\Filament\Resources\MediaEditions\Pages\EditMediaEdition;
use App\Models\MediaEdition;
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

class MediaEditionResource extends Resource
{
    protected static ?string $model = MediaEdition::class;
    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-play-circle';
    protected static ?string $navigationLabel = 'Audio & Vidéo';
    protected static ?string $modelLabel = 'édition média';
    protected static ?string $pluralModelLabel = 'audio & vidéo';
    protected static ?int $navigationSort = 4;
    public static function getNavigationGroup(): ?string { return 'Catalogue'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Édition multimédia')->description('Prépare les livres audio, vidéos, masterclass et éditions enrichies pour le web et Flutter.')->columns(2)->schema([
                Select::make('book_id')->relationship('book','title')->label('Livre / œuvre')->searchable()->preload()->required(),
                Select::make('media_type')->label('Type')->options([
                    'ebook'=>'Ebook','audiobook'=>'Livre audio','video'=>'Vidéo','print'=>'Imprimé','bundle'=>'Bundle'
                ])->required()->default('audiobook'),
                TextInput::make('title')->label('Titre de l’édition'),
                TextInput::make('language')->label('Langue')->default('fr')->maxLength(10),
                TextInput::make('narrator')->label('Narrateur'),
                TextInput::make('presenter')->label('Présentateur'),
                TextInput::make('duration_seconds')->label('Durée (secondes)')->numeric()->minValue(0),
                TextInput::make('provider')->label('Fournisseur / CDN'),
                TextInput::make('storage_path')->label('Chemin stockage privé')->columnSpanFull(),
                TextInput::make('streaming_url')->label('URL streaming')->url()->columnSpanFull(),
                TextInput::make('preview_url')->label('URL extrait')->url()->columnSpanFull(),
                TextInput::make('mime_type')->label('MIME'),
                Select::make('drm_scheme')->label('DRM')->options(['none'=>'Aucun','signed_url'=>'URL signée','aes_256_gcm'=>'AES-256-GCM'])->default('none'),
                Select::make('status')->options(['draft'=>'Brouillon','processing'=>'Traitement','published'=>'Publié','archived'=>'Archivé'])->default('draft')->required(),
                DateTimePicker::make('published_at')->label('Publication'),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('book.title')->label('Œuvre')->searchable()->limit(35),
            TextColumn::make('media_type')->label('Format')->badge(),
            TextColumn::make('title')->label('Édition')->limit(30),
            TextColumn::make('language')->label('Langue'),
            TextColumn::make('narrator')->label('Narration')->toggleable(),
            TextColumn::make('status')->badge(),
            TextColumn::make('duration_seconds')->label('Durée')->formatStateUsing(fn($state)=>$state ? gmdate('H:i:s',(int)$state) : '—'),
        ])->filters([
            SelectFilter::make('media_type')->options(['ebook'=>'Ebook','audiobook'=>'Livre audio','video'=>'Vidéo','print'=>'Imprimé','bundle'=>'Bundle']),
            SelectFilter::make('status')->options(['draft'=>'Brouillon','processing'=>'Traitement','published'=>'Publié','archived'=>'Archivé']),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return ['index'=>ListMediaEditions::route('/'),'create'=>CreateMediaEdition::route('/create'),'edit'=>EditMediaEdition::route('/{record}/edit')];
    }
}
