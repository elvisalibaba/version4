<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Book\StoreBookRequest;
use App\Http\Requests\Book\UpdateBookRequest;
use App\Http\Resources\BookResource;
use App\Models\Book;
use App\Services\BookDocumentMetadataService;
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
            ->with([
                'author',
                'publishingHouse',
                'imprint',
                'mediaEditions' => fn ($query) => $query->where('status', 'published'),
                'formats' => fn ($query) => $query->where('is_published', true),
            ])
            ->when(request()->string('search')->isNotEmpty(), function ($query): void {
                $search = request()->string('search')->toString();
                $query->where(fn ($query) => $query->where('title', 'like', "%{$search}%")
                    ->orWhere('subtitle', 'like', "%{$search}%")
                    ->orWhere('author_display_name', 'like', "%{$search}%"));
            })
            ->when(request()->string('category')->isNotEmpty(), fn ($query) => $query->whereJsonContains('categories', request()->string('category')->toString()))
            ->latest('published_at')
            ->orderByDesc('id')
            ->paginate(24);

        return BookResource::collection($books);
    }

    public function store(StoreBookRequest $request, PrivateBookFileService $files, BookDocumentMetadataService $metadata): BookResource
    {
        $validated = $request->validated();
        $planIds = Arr::pull($validated, 'subscription_plan_ids', []);
        $data = Arr::except($validated, ['file', 'cover', 'sample']);
        $profile = $request->user()->profile;

        $data['author_id'] = $profile->role === 'admin' ? ($data['author_id'] ?? $profile->id) : $profile->id;
        if ($profile->role !== 'admin') {
            $data['author_display_name'] = $profile->authorProfile?->display_name ?? $profile->name ?? $request->user()->name;
        }
        $data['status'] = $profile->role === 'admin' ? ($data['status'] ?? 'draft') : 'draft';
        $data['review_status'] = 'draft';
        $data['copyright_status'] = 'review';
        $data['co_authors'] ??= [];
        $data['categories'] ??= [];
        $data['tags'] ??= [];

        $book = Book::query()->create($data);

        if ($request->hasFile('file')) {
            $path = $files->store($request->file('file'), $book);
            $format = $request->string('file_format')->toString() ?: $request->file('file')->extension();
            $book->update([
                'file_url' => $path,
                'file_format' => $format,
                'file_size' => $request->file('file')->getSize(),
            ]);
            $book->formats()->updateOrCreate(
                ['format' => 'holistique_store'],
                [
                    'price' => $book->price,
                    'file_url' => $path,
                    'downloadable' => true,
                    'is_published' => false,
                    'currency_code' => $book->currency_code,
                    'file_size_mb' => max(1, (int) ceil($request->file('file')->getSize() / 1024 / 1024)),
                ],
            );
        }

        if ($request->hasFile('cover')) {
            $book->update(['cover_url' => $request->file('cover')->store("covers/{$book->id}", 'public')]);
        }

        if ($request->hasFile('sample')) {
            $samplePath = $request->file('sample')->store("{$book->id}/samples", 'books');
            $book->update(['sample_url' => $samplePath]);
        }

        if ($request->hasFile('file')) {
            $book = $metadata->enrich($book);
        }

        $book->subscriptionPlans()->sync($book->is_subscription_available ? $planIds : []);

        return new BookResource($book->load(['author', 'publishingHouse', 'imprint', 'mediaEditions', 'formats', 'subscriptionPlans']));
    }

    public function show(Book $book): BookResource
    {
        if ($book->status !== 'published') {
            Gate::authorize('view', $book);
        }

        return new BookResource($book->load([
            'author', 'publishingHouse', 'imprint',
            'mediaEditions' => fn ($query) => $query->where('status', 'published')->with('chapters'),
            'formats',
            'subscriptionPlans:id,name,slug,description,monthly_price,currency_code,is_active,max_devices,offline_days,downloads_enabled'
        ]));
    }

    public function update(UpdateBookRequest $request, Book $book, PrivateBookFileService $files, BookDocumentMetadataService $metadata): BookResource
    {
        $validated = $request->validated();
        $hasPlanIds = array_key_exists('subscription_plan_ids', $validated);
        $planIds = Arr::pull($validated, 'subscription_plan_ids', []);
        $data = Arr::except($validated, ['file', 'cover', 'sample']);

        if ($request->user()->profile->role !== 'admin') {
            unset($data['author_id']);
            $data['author_display_name'] = $request->user()->profile->authorProfile?->display_name
                ?? $request->user()->profile->name
                ?? $request->user()->name;

            if (($data['status'] ?? null) === 'published') {
                $data['status'] = 'draft';
                $data['review_status'] = 'submitted';
                $data['submitted_at'] = now();
            }
        }

        $book->update($data);

        if ($request->hasFile('file')) {
            $path = $files->store($request->file('file'), $book);
            $format = $request->string('file_format')->toString() ?: $request->file('file')->extension();
            $book->update([
                'file_url' => $path,
                'file_format' => $format,
                'file_size' => $request->file('file')->getSize(),
            ]);
            $book->formats()->updateOrCreate(
                ['format' => 'holistique_store'],
                [
                    'price' => $book->price,
                    'file_url' => $path,
                    'downloadable' => true,
                    'is_published' => false,
                    'currency_code' => $book->currency_code,
                    'file_size_mb' => max(1, (int) ceil($request->file('file')->getSize() / 1024 / 1024)),
                ],
            );
        } elseif ($book->formats()->where('format', 'holistique_store')->exists()) {
            $book->formats()->where('format', 'holistique_store')->update([
                'price' => $book->price,
                'currency_code' => $book->currency_code,
            ]);
        }

        if ($request->hasFile('cover')) {
            $book->update(['cover_url' => $request->file('cover')->store("covers/{$book->id}", 'public')]);
        }

        if ($request->hasFile('sample')) {
            $samplePath = $request->file('sample')->store("{$book->id}/samples", 'books');
            $book->update(['sample_url' => $samplePath]);
        }

        if ($request->hasFile('file')) {
            $book = $metadata->enrich($book);
        }

        if ($hasPlanIds || array_key_exists('is_subscription_available', $data)) {
            $book->subscriptionPlans()->sync($book->is_subscription_available ? $planIds : []);
        }

        return new BookResource($book->load(['author', 'formats', 'subscriptionPlans']));
    }

    public function destroy(Book $book): Response
    {
        Gate::authorize('delete', $book);
        Storage::disk('books')->deleteDirectory($book->id);
        $book->delete();

        return response()->noContent();
    }
}
