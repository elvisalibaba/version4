<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LibraryResource;
use App\Models\Library;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LibraryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $entries = Library::query()
            ->whereBelongsTo($request->user()->profile, 'profile')
            ->where('status', 'active')
            ->with(['book.author', 'book.formats', 'subscription.plan'])
            ->latest('purchased_at')
            ->orderByDesc('id')
            ->paginate(24);

        return LibraryResource::collection($entries);
    }
}
