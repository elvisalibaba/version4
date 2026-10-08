<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Book\IndexBookRequest;
use App\Http\Requests\Book\StoreBookRequest;
use App\Http\Requests\Book\UpdateBookRequest;
use App\Http\Resources\BookResource;
use App\Models\AcademicTaxonomy;
use App\Models\AuthorProfile;
use App\Models\Book;
use App\Services\BookDocumentMetadataService;
use App\Services\BookTaxonomyService;
use App\Services\PrivateBookFileService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class BookController extends Controller
{
    public function index(IndexBookRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $formats = $request->formats();

        $books = Book::query()
            ->publiclyAvailable()
            ->withAvg([
                'ratings as visible_rating_avg' => fn ($query) => $query->where('is_hidden', false),
            ], 'rating')
            ->withCount([
                'ratings as visible_ratings_count' => fn ($query) => $query->where('is_hidden', false),
            ])
            ->with([
                'author',
                'publishingHouse',
                'imprint',
                'educationTaxonomies',
                'mediaEditions' => fn ($query) => $query->where('status', 'published'),
                'formats' => fn ($query) => $query->where('is_published', true),
            ])
            ->when(filled($filters['search'] ?? null), function ($query) use ($filters): void {
                // Échappe % et _ : saisis par l'utilisateur, ils deviendraient des jokers SQL.
                $search = addcslashes(mb_substr(trim($filters['search']), 0, 120), '%_\\');
                $query->where(fn ($query) => $query
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('subtitle', 'like', "%{$search}%")
                    ->orWhere('author_display_name', 'like', "%{$search}%")
                    ->orWhere('author_credit', 'like', "%{$search}%")
                    ->orWhere('publisher', 'like', "%{$search}%")
                );
            })
            ->when(filled($filters['category'] ?? null), fn ($query) => $query
                ->whereJsonContains('categories', $filters['category']))
            ->when(filled($filters['editorial_pole'] ?? null), fn ($query) => $query
                ->where('editorial_pole', $filters['editorial_pole']))
            ->when(filled($filters['work_type'] ?? null), fn ($query) => $query
                ->where('work_type', $filters['work_type']))
            ->when(filled($filters['education'] ?? null), function ($query) use ($filters): void {
                $education = $filters['education'];
                $taxonomy = AcademicTaxonomy::query()
                    ->where('slug', $education)
                    ->orWhere('code', $education)
                    ->first();

                if (! $taxonomy) {
                    $query->whereRaw('1 = 0');

                    return;
                }

                $taxonomyIds = collect([$taxonomy->id]);
                $frontier = collect([$taxonomy->id]);

                while ($frontier->isNotEmpty()) {
                    $children = AcademicTaxonomy::query()
                        ->whereIn('parent_id', $frontier)
                        ->pluck('id');

                    $newChildren = $children->diff($taxonomyIds);

                    if ($newChildren->isEmpty()) {
                        break;
                    }

                    $taxonomyIds = $taxonomyIds->merge($newChildren);
                    $frontier = $newChildren;
                }

                $query->whereHas('educationTaxonomies', fn ($taxonomyQuery) => $taxonomyQuery
                    ->whereIn('academic_taxonomies.id', $taxonomyIds));
            })
            ->when(filled($filters['education_audience'] ?? null), fn ($query) => $query
                ->whereHas('educationTaxonomies', fn ($taxonomyQuery) => $taxonomyQuery
                    ->where('academic_taxonomies.audience', $filters['education_audience'])))
            ->when($formats !== [], fn ($query) => $this->filterByFormats($query, $formats))
            ->when(filled($filters['language'] ?? null), fn ($query) => $query
                ->where('language', $filters['language']))
            ->when(isset($filters['is_free']), fn ($query) => $request->boolean('is_free')
                ? $query->where('is_single_sale_enabled', true)->where('price', '<=', 0)
                : $query->where(fn ($query) => $query->where('is_single_sale_enabled', false)->orWhere('price', '>', 0)))
            ->when(isset($filters['subscription']), fn ($query) => $query
                ->where('is_subscription_available', $request->boolean('subscription')))
            ->when(isset($filters['has_sample']), fn ($query) => $request->boolean('has_sample')
                ? $query->whereNotNull('sample_url')->where('sample_url', '!=', '')
                : $query->where(fn ($query) => $query->whereNull('sample_url')->orWhere('sample_url', '')))
            ->when(isset($filters['price_min']), fn ($query) => $query->where('price', '>=', $filters['price_min']))
            ->when(isset($filters['price_max']), fn ($query) => $query->where('price', '<=', $filters['price_max']))
            ->tap(fn ($query) => $this->applySort($query, $filters['sort'] ?? 'newest'))
            ->paginate($request->perPage())
            ->withQueryString();

        return BookResource::collection($books);
    }

    public function store(
        StoreBookRequest $request,
        PrivateBookFileService $files,
        BookDocumentMetadataService $metadata,
        BookTaxonomyService $taxonomy,
    ): BookResource {
        $validated = $request->validated();
        $planIds = Arr::pull($validated, 'subscription_plan_ids', []);
        $data = Arr::except($validated, ['file', 'cover', 'sample']);
        $profile = $request->user()->profile;

        $data['price'] ??= 0;
        $data['currency_code'] ??= 'USD';
        $data['language'] ??= 'fr';
        $data['publisher'] ??= 'Holistique Books';
        $data['editorial_pole'] ??= 'general';
        $data['work_type'] ??= 'book';
        $data['editorial_stage'] ??= 'intake';
        $data['co_authors'] ??= [];
        $data['categories'] ??= [];
        $data['tags'] ??= [];

        if ($profile->role === 'admin') {
            $data['author_id'] = $data['author_id'] ?? null;

            if (filled($data['author_id'])) {
                $catalogAuthor = AuthorProfile::query()->find($data['author_id']);

                $data['author_credit'] = $data['author_credit']
                    ?? $catalogAuthor?->display_name;

                $data['author_display_name'] = $data['author_display_name']
                    ?? $data['author_credit']
                    ?? $catalogAuthor?->display_name;
            } else {
                $data['author_display_name'] = $data['author_display_name']
                    ?? $data['author_credit']
                    ?? null;

                $data['authorship_type'] ??= filled($data['author_credit'] ?? null)
                    ? 'named'
                    : 'anonymous';
            }

            $data['status'] ??= 'draft';
        } else {
            unset(
                $data['reading_access_mode'],
                $data['can_read_on_platform'],
                $data['allow_download'],
                $data['allow_print'],
                $data['allow_copy'],
                $data['reader_watermark_enabled'],
                $data['rights_agreement_reference'],
                $data['reader_rights_note'],
            );
            $data['author_id'] = $profile->id;
            $data['authorship_type'] = 'named';
            $data['author_credit'] = $profile->authorProfile?->display_name
                ?? $profile->name
                ?? $request->user()->name;
            $data['author_display_name'] = $data['author_credit'];
            $data['status'] = 'draft';
        }

        $data['review_status'] = 'draft';
        $data['copyright_status'] = 'review';

        if (($data['status'] ?? null) === 'published') {
            $data['editorial_stage'] = 'published';
            $data['published_at'] = now();
        }

        $book = Book::query()->create($data);
        $taxonomy->sync($book, $book->categories ?? []);

        if ($request->hasFile('file')) {
            $uploaded = $request->file('file');
            $path = $files->store($uploaded, $book);
            $format = $request->string('file_format')->toString()
                ?: mb_strtolower($uploaded->getClientOriginalExtension() ?: $uploaded->extension());

            $book->forceFill([
                'file_url' => $path,
                'file_format' => $format,
                'file_size' => $uploaded->getSize(),
            ])->saveQuietly();

            $book->formats()->updateOrCreate(
                ['format' => 'holistique_store'],
                [
                    'price' => $book->price,
                    'file_url' => $path,
                    'downloadable' => false,
                    'is_published' => false,
                    'currency_code' => $book->currency_code,
                    'file_size_mb' => max(1, (int) ceil($uploaded->getSize() / 1024 / 1024)),
                ],
            );

            $this->archiveManuscriptVersion(
                $book,
                $profile->id,
                $path,
                $format,
                $uploaded->getSize(),
                'Version initiale déposée via API.',
            );
        }

        if ($request->hasFile('cover')) {
            $coverPath = $request->file('cover')->store("covers/{$book->id}", 'public');

            $book->forceFill([
                'cover_url' => $coverPath,
                'cover_thumbnail_url' => $coverPath,
                'cover_source' => 'upload',
            ])->saveQuietly();
        }

        if ($request->hasFile('sample')) {
            $samplePath = $request->file('sample')->store("{$book->id}/samples", 'books');
            $book->forceFill(['sample_url' => $samplePath])->saveQuietly();
        }

        $book = $metadata->enrich($book);

        $book->subscriptionPlans()->sync($book->is_subscription_available ? $planIds : []);

        $book->editorialEvents()->create([
            'actor_id' => $profile->id,
            'event_type' => 'created',
            'to_stage' => $book->editorial_stage,
            'notes' => 'Livre créé via API.',
        ]);

        return new BookResource($book->load([
            'author',
            'publishingHouse',
            'imprint',
            'educationTaxonomies',
            'mediaEditions',
            'formats',
            'subscriptionPlans',
        ]));
    }

    public function show(Book $book): BookResource
    {
        if ($book->status !== 'published' || $book->copyright_status !== 'clear') {
            Gate::authorize('view', $book);
        }

        $book->loadAvg([
            'ratings as visible_rating_avg' => fn ($query) => $query->where('is_hidden', false),
        ], 'rating')->loadCount([
            'ratings as visible_ratings_count' => fn ($query) => $query->where('is_hidden', false),
        ]);

        return new BookResource($book->load([
            'author',
            'publishingHouse',
            'imprint',
            'educationTaxonomies',
            'mediaEditions' => fn ($query) => $query->where('status', 'published')->with('chapters'),
            'formats',
            'subscriptionPlans:id,name,slug,description,monthly_price,currency_code,is_active,max_devices,offline_days,downloads_enabled',
        ]));
    }

    public function update(
        UpdateBookRequest $request,
        Book $book,
        PrivateBookFileService $files,
        BookDocumentMetadataService $metadata,
        BookTaxonomyService $taxonomy,
    ): BookResource {
        $validated = $request->validated();
        $hasPlanIds = array_key_exists('subscription_plan_ids', $validated);
        $planIds = Arr::pull($validated, 'subscription_plan_ids', []);
        $data = Arr::except($validated, ['file', 'cover', 'sample']);
        $profile = $request->user()->profile;
        $previousStage = $book->editorial_stage;
        // Un livre en ligne ne change de contenu qu'après validation éditoriale.
        $isLiveForAuthor = $profile->role !== 'admin' && $book->status === 'published';

        if ($profile->role !== 'admin') {
            abort_if(
                $isLiveForAuthor && ($request->hasFile('cover') || $request->hasFile('sample')),
                422,
                'Ce livre est publié : contactez l’équipe éditoriale pour changer la couverture ou l’extrait.',
            );

            unset(
                $data['editorial_stage'],
                $data['author_id'],
                $data['authorship_type'],
                $data['author_credit'],
                $data['reading_access_mode'],
                $data['can_read_on_platform'],
                $data['allow_download'],
                $data['allow_print'],
                $data['allow_copy'],
                $data['reader_watermark_enabled'],
                $data['rights_agreement_reference'],
                $data['reader_rights_note'],
            );
            $data['author_display_name'] = $profile->authorProfile?->display_name
                ?? $profile->name
                ?? $request->user()->name;

            if (($data['status'] ?? null) === 'published' && $isLiveForAuthor) {
                unset($data['status']);
            } elseif (($data['status'] ?? null) === 'published') {
                $data['status'] = 'draft';
                $data['review_status'] = 'submitted';
                $data['submitted_at'] = now();
            }
        } else {
            if (array_key_exists('author_id', $data) && filled($data['author_id'])) {
                $catalogAuthor = AuthorProfile::query()->find($data['author_id']);

                if (blank($data['author_credit'] ?? null)) {
                    $data['author_credit'] = $catalogAuthor?->display_name;
                }
            }

            if (array_key_exists('author_credit', $data) || array_key_exists('author_id', $data)) {
                $data['author_display_name'] = $data['author_credit']
                    ?? (filled($data['author_id'] ?? null)
                        ? AuthorProfile::query()->whereKey($data['author_id'])->value('display_name')
                        : null);
            }

            if (($data['status'] ?? $book->status) === 'published') {
                $data['published_at'] = $book->published_at ?? now();
                $data['editorial_stage'] = 'published';
            }
        }

        $book->update($data);

        if (array_key_exists('categories', $data)) {
            $taxonomy->sync($book, $book->categories ?? []);
        }

        if ($request->hasFile('file') && $isLiveForAuthor) {
            // La révision est archivée et soumise ; le fichier lu par les
            // lecteurs reste celui qui a été validé.
            $uploaded = $request->file('file');
            $path = $files->store($uploaded, $book);

            $this->archiveManuscriptVersion(
                $book,
                $profile->id,
                $path,
                $request->string('file_format')->toString()
                    ?: mb_strtolower($uploaded->getClientOriginalExtension() ?: $uploaded->extension()),
                $uploaded->getSize(),
                'Révision proposée par l’auteur sur un livre publié, en attente de validation.',
                'pending_review',
            );

            $book->forceFill([
                'review_status' => 'submitted',
                'submitted_at' => now(),
            ])->saveQuietly();
        } elseif ($request->hasFile('file')) {
            $uploaded = $request->file('file');
            $path = $files->store($uploaded, $book);
            $format = $request->string('file_format')->toString()
                ?: mb_strtolower($uploaded->getClientOriginalExtension() ?: $uploaded->extension());

            $book->forceFill([
                'file_url' => $path,
                'file_format' => $format,
                'file_size' => $uploaded->getSize(),
            ])->saveQuietly();

            $book->formats()->updateOrCreate(
                ['format' => 'holistique_store'],
                [
                    'price' => $book->price,
                    'file_url' => $path,
                    'downloadable' => false,
                    'is_published' => false,
                    'currency_code' => $book->currency_code,
                    'file_size_mb' => max(1, (int) ceil($uploaded->getSize() / 1024 / 1024)),
                ],
            );

            $this->archiveManuscriptVersion(
                $book,
                $profile->id,
                $path,
                $format,
                $uploaded->getSize(),
                'Nouvelle version déposée via API.',
            );
        } elseif ($book->formats()->where('format', 'holistique_store')->exists()) {
            $book->formats()->where('format', 'holistique_store')->update([
                'price' => $book->price,
                'currency_code' => $book->currency_code,
            ]);
        }

        if ($request->hasFile('cover')) {
            $coverPath = $request->file('cover')->store("covers/{$book->id}", 'public');

            $book->forceFill([
                'cover_url' => $coverPath,
                'cover_thumbnail_url' => $coverPath,
                'cover_source' => 'upload',
            ])->saveQuietly();
        }

        if ($request->hasFile('sample')) {
            $samplePath = $request->file('sample')->store("{$book->id}/samples", 'books');
            $book->forceFill(['sample_url' => $samplePath])->saveQuietly();
        }

        $book = $metadata->enrich($book);

        if ($hasPlanIds || array_key_exists('is_subscription_available', $data)) {
            $book->subscriptionPlans()->sync($book->is_subscription_available ? $planIds : []);
        }

        if ($previousStage !== $book->editorial_stage) {
            $book->editorialEvents()->create([
                'actor_id' => $profile->id,
                'event_type' => 'stage_changed',
                'from_stage' => $previousStage,
                'to_stage' => $book->editorial_stage,
                'notes' => 'Étape éditoriale mise à jour via API.',
            ]);
        }

        return new BookResource($book->load([
            'author',
            'publishingHouse',
            'imprint',
            'educationTaxonomies',
            'formats',
            'subscriptionPlans',
        ]));
    }

    public function destroy(Book $book): Response
    {
        Gate::authorize('delete', $book);
        Storage::disk('books')->deleteDirectory($book->id);
        $book->delete();

        return response()->noContent();
    }

    /**
     * Garde les livres ayant au moins un des formats demandés en vente.
     * L'audio compte aussi via une édition multimédia publiée.
     *
     * @param  list<string>  $formats
     */
    private function filterByFormats(Builder $query, array $formats): void
    {
        $query->where(function (Builder $query) use ($formats): void {
            $query->whereHas('formats', fn (Builder $formatQuery) => $formatQuery
                ->where('is_published', true)
                ->whereIn('format', $formats));

            if (in_array('audiobook', $formats, true)) {
                $query->orWhereHas('mediaEditions', fn (Builder $editionQuery) => $editionQuery
                    ->where('status', 'published')
                    ->where('media_type', 'audiobook'));
            }
        });
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'bestsellers' => $query->orderByDesc('purchases_count'),
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'rating' => $query->orderByDesc('visible_rating_avg')->orderByDesc('visible_ratings_count'),
            default => null,
        };

        $query->latest('published_at')->orderByDesc('id');
    }

    private function archiveManuscriptVersion(
        Book $book,
        string $profileId,
        string $path,
        string $format,
        int $size,
        string $summary,
        string $status = 'author_draft',
    ): void {
        $nextVersion = ((int) $book->manuscriptVersions()->max('version_number')) + 1;

        $book->manuscriptVersions()->create([
            'created_by' => $profileId,
            'version_number' => $nextVersion,
            'file_path' => $path,
            'file_format' => $format,
            'file_size' => $size,
            'status' => $status,
            'change_summary' => $summary,
        ]);

        $book->editorialEvents()->create([
            'actor_id' => $profileId,
            'event_type' => 'manuscript_version_uploaded',
            'to_stage' => $book->editorial_stage,
            'notes' => 'Version '.$nextVersion.' du manuscrit archivée.',
            'payload' => ['version_number' => $nextVersion],
        ]);
    }
}
