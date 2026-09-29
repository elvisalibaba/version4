<?php

namespace App\Filament\Resources\BlogPosts;

use App\Filament\Resources\BlogPosts\Pages\CreateBlogPost;
use App\Filament\Resources\BlogPosts\Pages\EditBlogPost;
use App\Filament\Resources\BlogPosts\Pages\ListBlogPosts;
use App\Models\BlogPost;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class BlogPostResource extends Resource
{
    protected static ?string $model = BlogPost::class;

    protected static string | BackedEnum | null $navigationIcon = 'heroicon-o-newspaper';

    protected static ?string $navigationLabel = 'Blog';

    protected static ?string $modelLabel = 'article';

    protected static ?string $pluralModelLabel = 'articles';

    protected static ?string $recordTitleAttribute = 'title';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Contenu';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Publication')
                ->columns(2)
                ->schema([
                    TextInput::make('title')
                        ->label('Titre')
                        ->required()
                        ->maxLength(255)
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn (Set $set, ?string $state) => $set('slug', Str::slug((string) $state))),
                    TextInput::make('slug')->label('Slug')->required()->maxLength(255)->unique(ignoreRecord: true),
                    TextInput::make('tag')->label('Rubrique')->required()->maxLength(120),
                    TextInput::make('author')->label('Auteur')->required()->maxLength(120),
                    TextInput::make('read_time')->label('Temps de lecture')->default('5 min')->required()->maxLength(50),
                    DatePicker::make('published_at')->label('Date de publication')->required()->default(now()),
                    Textarea::make('excerpt')->label('Résumé')->rows(4)->required()->columnSpanFull(),
                    TextInput::make('cover_label')->label('Label couverture')->default('Magazine editorial')->maxLength(255),
                    TextInput::make('cover_image_url')->label('URL image couverture')->url()->maxLength(2048),
                    TextInput::make('cover_image_alt')->label('Texte alternatif')->maxLength(255),
                ]),

            Section::make('Contenu')
                ->schema([
                    Repeater::make('content_blocks')
                        ->label('Blocs')
                        ->schema([
                            Select::make('type')
                                ->options([
                                    'paragraph' => 'Paragraphe',
                                    'image' => 'Image',
                                ])
                                ->required()
                                ->default('paragraph'),
                            Textarea::make('text')->label('Texte')->rows(5),
                            TextInput::make('url')->label('URL image')->url(),
                            TextInput::make('alt')->label('Texte alternatif'),
                            TextInput::make('caption')->label('Légende'),
                        ])
                        ->columns(2)
                        ->addActionLabel('Ajouter un bloc')
                        ->reorderable()
                        ->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('published_at', 'desc')
            ->columns([
                TextColumn::make('title')->label('Titre')->searchable()->sortable()->limit(55),
                TextColumn::make('tag')->label('Rubrique')->badge()->searchable(),
                TextColumn::make('author')->label('Auteur')->searchable(),
                TextColumn::make('published_at')->label('Publié le')->date('d/m/Y')->sortable(),
                TextColumn::make('updated_at')->label('Mis à jour')->dateTime('d/m/Y H:i')->toggleable(isToggledHiddenByDefault: true),
            ])
            ->recordActions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListBlogPosts::route('/'),
            'create' => CreateBlogPost::route('/create'),
            'edit' => EditBlogPost::route('/{record}/edit'),
        ];
    }
}
