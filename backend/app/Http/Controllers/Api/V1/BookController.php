<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Book\StoreBookRequest;
use App\Http\Requests\Book\UpdateBookRequest;
use App\Http\Resources\BookResource;
use App\Models\AcademicTaxonomy;
use App\Models\AuthorProfile;
use App\Models\Book;
use App\Services\BookDocumentMetadataService;
use App\Services\BookTaxonomyService;
use App\Services\PrivateBookFileService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class BookController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
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
            ->when(request()->string('search')->isNotEmpty(), function ($query): void {
                $search = request()->string('search')->toString();
                $query->where(fn ($query) => $query
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('subtitle', 'like', "%{$search}%")
                    ->orWhere('author_display_name', 'like', "%{$search}%")
                    ->orWhere('author_credit', 'like', "%{$search}%")
                    ->orWhere('publisher', 'like', "%{$search}%")
                );
            })
            ->when(request()->string('category')->isNotEmpty(), fn ($query) => $query
                ->whereJsonContains('categories', request()->string('category')->toString()))
            ->when(request()->string('editorial_pole')->isNotEmpty(), fn ($query) => $query
                ->where('editorial_pole', request()->string('editorial_pole')->toString()))
            ->when(request()->string('work_type')->isNotEmpty(), fn ($query) => $query
                ->where('work_type', request()->string('work_type')->toString()))
            ->when(request()->string('education')->isNotEmpty(), function ($query): void {
                $education = request()->string('education')->toString();
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
            ->when(request()->string('education_audience')->isNotEmpty(), function ($query): void {
                $audience = request()->string('education_audience')->toString();
                $query->whereHas('educationTaxonomies', fn ($taxonomyQuery) => $taxonomyQuery
                    ->where('academic_taxonomies.audience', $audience));
            })
            ->latest('published_at')
            ->orderByDesc('id')
            ->paginate(24);

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
                    'downloadable' => true,
                    'is_published' => false,
                    'currency_code' => $book->currency_code,
                    'file_size_mb' => max(1, (int) ceil($uploaded->getSize() / 1024 / 1024)),
                ],
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

        if ($profile->role !== 'admin') {
            unset($data['author_id'], $data['authorship_type'], $data['author_credit']);
            $data['author_display_name'] = $profile->authorProfile?->display_name
                ?? $profile->name
                ?? $request->user()->name;

            if (($data['status'] ?? null) === 'published') {
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
                    'downloadable' => true,
                    'is_published' => false,
                    'currency_code' => $book->currency_code,
                    'file_size_mb' => max(1, (int) ceil($uploaded->getSize() / 1024 / 1024)),
                ],
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
}
