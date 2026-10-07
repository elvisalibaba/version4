<?php

namespace App\Filament\Resources\AcademicTaxonomies;

use App\Filament\Concerns\RequiresStaffPermission;
use App\Filament\Resources\AcademicTaxonomies\Pages\CreateAcademicTaxonomy;
use App\Filament\Resources\AcademicTaxonomies\Pages\EditAcademicTaxonomy;
use App\Filament\Resources\AcademicTaxonomies\Pages\ListAcademicTaxonomies;
use App\Models\AcademicTaxonomy;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class AcademicTaxonomyResource extends Resource
{
    use RequiresStaffPermission;

    protected static string $staffManagePermission = 'catalog.manage';

    protected static ?string $staffViewPermission = 'catalog.view';

    protected static ?string $model = AcademicTaxonomy::class;

    protected static string|BackedEnum|null $navigationIcon = 'heroicon-o-academic-cap';

    protected static ?string $navigationLabel = 'Référentiel scolaire & universitaire';

    protected static ?string $modelLabel = 'classification académique';

    protected static ?string $pluralModelLabel = 'référentiel académique';

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?int $navigationSort = 1;

    public static function getNavigationGroup(): ?string
    {
        return 'Éducation';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Classification académique')
                ->description('Structure RDC : niveau, classe, section/option, domaine LMD, filière ou mention.')
                ->columns(2)
                ->schema([
                    TextInput::make('name')
                        ->label('Nom')
                        ->required()
                        ->maxLength(255)
                        ->live(onBlur: true)
                        ->afterStateUpdated(fn (Set $set, ?string $state) => $set('slug', Str::slug((string) $state))),
                    TextInput::make('slug')->required()->maxLength(255)->unique(ignoreRecord: true),
                    TextInput::make('code')->label('Code stable')->maxLength(80)->unique(ignoreRecord: true),
                    Select::make('parent_id')
                        ->relationship('parent', 'name')
                        ->label('Parent')
                        ->searchable()
                        ->preload(),
                    Select::make('audience')
                        ->label('Public')
                        ->options([
                            'school' => 'Élève / scolaire',
                            'university' => 'Étudiant / universitaire',
                        ])
                        ->required(),
                    Select::make('kind')
                        ->label('Type')
                        ->options([
                            'root' => 'Racine',
                            'level' => 'Niveau',
                            'class' => 'Classe / année',
                            'stream' => 'Filière scolaire',
                            'section' => 'Section',
                            'option' => 'Option',
                            'group' => 'Groupe',
                            'cycle' => 'Cycle LMD',
                            'domain' => 'Domaine universitaire',
                            'field' => 'Filière universitaire',
                            'mention' => 'Mention / spécialité',
                        ])
                        ->required(),
                    TextInput::make('sort_order')->label('Ordre')->numeric()->default(0),
                    Toggle::make('is_active')->label('Actif')->default(true),
                    Toggle::make('is_official')->label('Référentiel officiel')->default(false),
                    TextInput::make('source_url')->label('Source officielle')->url()->maxLength(1000)->columnSpanFull(),
                    Textarea::make('description')->label('Description')->rows(4)->columnSpanFull(),
                ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('sort_order')
            ->columns([
                TextColumn::make('name')->label('Nom')->searchable()->sortable(),
                TextColumn::make('parent.name')->label('Parent')->placeholder('Racine')->toggleable(),
                TextColumn::make('audience')->label('Public')->badge(),
                TextColumn::make('kind')->label('Type')->badge(),
                TextColumn::make('books_count')->counts('books')->label('Livres')->sortable(),
                IconColumn::make('is_official')->label('Officiel')->boolean(),
                IconColumn::make('is_active')->label('Actif')->boolean(),
                TextColumn::make('code')->label('Code')->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('sort_order')->label('Ordre')->sortable()->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('audience')->label('Public')->options([
                    'school' => 'Élèves',
                    'university' => 'Étudiants',
                ]),
                SelectFilter::make('kind')->label('Type')->options([
                    'level' => 'Niveau',
                    'class' => 'Classe',
                    'stream' => 'Filière scolaire',
                    'section' => 'Section',
                    'option' => 'Option',
                    'cycle' => 'Cycle LMD',
                    'domain' => 'Domaine universitaire',
                    'field' => 'Filière universitaire',
                    'mention' => 'Mention',
                ]),
            ])
            ->recordActions([EditAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAcademicTaxonomies::route('/'),
            'create' => CreateAcademicTaxonomy::route('/create'),
            'edit' => EditAcademicTaxonomy::route('/{record}/edit'),
        ];
    }
}
