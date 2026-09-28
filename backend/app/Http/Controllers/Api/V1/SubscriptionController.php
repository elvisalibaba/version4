<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SubscriptionController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return SubscriptionResource::collection(Subscription::query()
            ->whereBelongsTo($request->user()->profile, 'profile')
            ->with('plan.books:id,title')
            ->latest('started_at')
            ->paginate(24));
    }
}
