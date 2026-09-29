<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LibraryResource;
use App\Models\Library;
use App\Models\ReadingProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LibraryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $profile = $request->user()->profile;

        $entries = Library::query()
            ->whereBelongsTo($profile, 'profile')
            ->where('status', 'active')
            ->with(['book.author', 'book.formats', 'subscription.plan'])
            ->latest('last_opened_at')
            ->orderByDesc('purchased_at')
            ->paginate(24);

        $progressByBook = ReadingProgress::query()
            ->where('user_id', $profile->id)
            ->whereIn('book_id', collect($entries->items())->pluck('book_id'))
            ->latest('updated_at')
            ->get()
            ->unique('book_id')
            ->keyBy('book_id');

        collect($entries->items())->each(function (Library $entry) use ($progressByBook): void {
            $progress = $progressByBook->get($entry->book_id);
            $entry->setAttribute('reading_progress_snapshot', $progress ? [
                'locator' => $progress->locator,
                'locator_type' => $progress->locator_type,
                'progress_percent' => (float) $progress->progress_percent,
                'updated_at' => $progress->updated_at?->toIso8601String(),
            ] : null);
        });

        return LibraryResource::collection($entries);
    }
}
