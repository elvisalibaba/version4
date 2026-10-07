<?php

namespace App\Filament\Resources\Categories;

use App\Filament\Concerns\RequiresStaffPermission;
use App\Filament\Resources\Categories\Pages\CreateCategory;
use App\Filament\Resources\Categories\Pages\EditCategory;
use App\Filament\Resources\Categories\Pages\ListCategories;
use App\Models\Category;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
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

class CategoryResource extends Resource
{
    use RequiresStaffPermission;

    protected static string $staffManagePermission = 'catalog.manage';

    protected static ?string $staffViewPermission = 'catalog.view';

    protected static ?string $model = Category::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-tag';

    protected static ?string $navigationLabel = 'Catégories';

    protected static ?string $modelLabel = 'catégorie';

    protected static ?string $pluralModelLabel = 'catégories';

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?int $navigationSort = 2;

    public static function getNavigationGroup(): ?string
    {
        return 'Catalogue';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([Section::make('Taxonomie éditoriale')->columns(2)->schema([
            TextInput::make('name')->label('Nom')->required()->maxLength(255)->live(onBlur: true)
                ->afterStateUpdated(fn (Set $set, ?string $state) => $set('slug', Str::slug((string) $state))),
            TextInput::make('slug')->required()->maxLength(255),
            Select::make('parent_id')->relationship('parent', 'name')->label('Catégorie parente')->searchable()->preload(),
            TextInput::make('sort_order')->label('Ordre')->numeric()->default(0),
            TagsInput::make('content_types')->label('Médias compatibles')->placeholder('ebook, audiobook, video')->columnSpanFull(),
            Toggle::make('is_active')->label('Active')->default(true),
            Toggle::make('is_featured')->label('Mise en avant'),
            TextInput::make('icon')->label('Icône'),
            TextInput::make('color')->label('Couleur'),
            Textarea::make('description')->rows(4)->columnSpanFull(),
        ])]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('name')->label('Nom')->searchable()->sortable(),
            TextColumn::make('parent.name')->label('Parent')->placeholder('Racine'),
            TextColumn::make('content_types')->label('Médias')->badge(),
            IconColumn::make('is_active')->boolean()->label('Active'),
            IconColumn::make('is_featured')->boolean()->label('Vedette'),
            TextColumn::make('books_count')->counts('books')->label('Livres')->sortable(),
            TextColumn::make('sort_order')->label('Ordre')->sortable(),
        ])->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return ['index' => ListCategories::route('/'), 'create' => CreateCategory::route('/create'), 'edit' => EditCategory::route('/{record}/edit')];
    }
}
