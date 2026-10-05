<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PromotionCampaign;
use App\Models\PromotionEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromotionEventController extends Controller
{
    public function store(Request $request, PromotionCampaign $campaign): JsonResponse
    {
        abort_unless($campaign->isRunning(), 404);

        $data = $request->validate([
            'event_type' => ['required', 'in:impression,click,checkout,conversion'],
            'book_id' => ['nullable', 'uuid', 'exists:books,id'],
            'channel' => ['nullable', 'string', 'max:30'],
            'revenue_amount' => ['nullable', 'numeric', 'min:0'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'metadata' => ['nullable', 'array'],
        ]);

        $event = PromotionEvent::query()->create([
            ...$data,
            'promotion_campaign_id' => $campaign->id,
            'user_id' => $request->user()?->profile?->id,
            'occurred_at' => now(),
        ]);

        return response()->json(['data' => ['id' => $event->id]], 201);
    }
}
