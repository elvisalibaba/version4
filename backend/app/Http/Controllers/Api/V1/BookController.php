<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Book\StoreBookRequest;
use App\Http\Requests\Book\UpdateBookRequest;
use App\Http\Resources\BookResource;
use App\Models\Book;
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
            ->with(['author', 'formats' => fn ($query) => $query->where('is_published', true)])
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

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBookRequest $request, PrivateBookFileService $files): BookResource
    {
        $data = Arr::except($request->validated(), ['file', 'cover']);
        $profile = $request->user()->profile;
        $data['author_id'] = $profile->role === 'admin' ? ($data['author_id'] ?? $profile->id) : $profile->id;
        $data['status'] = $profile->role === 'admin' ? ($data['status'] ?? 'draft') : 'draft';
        $data['review_status'] = 'draft';
        $data['copyright_status'] = 'review';
        $data['co_authors'] = [];
        $data['categories'] ??= [];
        $data['tags'] ??= [];

        $book = Book::query()->create($data);

        if ($request->hasFile('file')) {
            $path = $files->store($request->file('file'), $book);
            $book->update(['file_url' => $path, 'file_format' => $request->string('file_format')->toString() ?: $request->file('file')->extension()]);
            $book->formats()->create([
                'format' => 'holistique_store', 'price' => $book->price, 'file_url' => $path,
                'downloadable' => true, 'is_published' => false, 'currency_code' => $book->currency_code,
            ]);
        }

        if ($request->hasFile('cover')) {
            $book->update(['cover_url' => $request->file('cover')->store("covers/{$book->id}", 'public')]);
        }

        return new BookResource($book->load(['author', 'formats']));
    }

    /**
     * Display the specified resource.
     */
    public function show(Book $book): BookResource
    {
        if ($book->status !== 'published') {
            Gate::authorize('view', $book);
        }

        return new BookResource($book->load(['author', 'formats', 'subscriptionPlans:id,name,slug,monthly_price,currency_code']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBookRequest $request, Book $book, PrivateBookFileService $files): BookResource
    {
        $data = Arr::except($request->validated(), ['file', 'cover']);
        if ($request->user()->profile->role !== 'admin') {
            unset($data['author_id']);
            if (($data['status'] ?? null) === 'published') {
                $data['status'] = 'draft';
                $data['review_status'] = 'submitted';
                $data['submitted_at'] = now();
            }
        }
        $book->update($data);

        if ($request->hasFile('file')) {
            $path = $files->store($request->file('file'), $book);
            $book->update(['file_url' => $path, 'file_format' => $request->string('file_format')->toString() ?: $request->file('file')->extension()]);
        }

        if ($request->hasFile('cover')) {
            $book->update(['cover_url' => $request->file('cover')->store("covers/{$book->id}", 'public')]);
        }

        return new BookResource($book->load(['author', 'formats']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Book $book): Response
    {
        Gate::authorize('delete', $book);
        Storage::disk('books')->deleteDirectory($book->id);
        $book->delete();

        return response()->noContent();
    }
}
