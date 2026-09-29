<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AdAssignment;
use App\Models\AdEvent;
use App\Models\AdPlacement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdController extends Controller
{
    public function serve(Request $request, string $placementCode): JsonResponse
    {
        $channel = $request->string('channel')->toString() ?: 'web';

        $placement = AdPlacement::query()
            ->where('code', $placementCode)
            ->where('is_active', true)
            ->whereIn('channel', [$channel, 'both'])
            ->first();

        if ($placement === null) {
            return response()->json(['data' => null]);
        }

        $now = now();
        $assignment = AdAssignment::query()
            ->with(['campaign', 'creative', 'placement'])
            ->where('placement_id', $placement->id)
            ->where('status', 'active')
            ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
            ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', $now))
            ->whereHas('campaign', fn ($query) => $query
                ->where('status', 'active')
                ->where(fn ($query) => $query->whereNull('starts_at')->orWhere('starts_at', '<=', $now))
                ->where(fn ($query) => $query->whereNull('ends_at')->orWhere('ends_at', '>=', $now)))
            ->whereHas('creative', fn ($query) => $query->where('is_active', true))
            ->orderByDesc('weight')
            ->inRandomOrder()
            ->first();

        if ($assignment === null) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'assignment_id' => $assignment->id,
                'placement' => [
                    'code' => $placement->code,
                    'surface' => $placement->surface,
                    'position' => $placement->position,
                    'width' => $placement->width,
                    'height' => $placement->height,
                ],
                'campaign' => [
                    'id' => $assignment->campaign->id,
                    'name' => $assignment->campaign->name,
                    'advertiser' => $assignment->campaign->advertiser_name,
                ],
                'creative' => [
                    'id' => $assignment->creative->id,
                    'type' => $assignment->creative->creative_type,
                    'headline' => $assignment->creative->headline,
                    'body' => $assignment->creative->body,
                    'asset_url' => $assignment->creative->asset_url,
                    'click_url' => $assignment->creative->click_url,
                    'cta_label' => $assignment->creative->cta_label,
                    'alt_text' => $assignment->creative->alt_text,
                ],
            ],
        ]);
    }

    public function track(Request $request, AdAssignment $assignment): JsonResponse
    {
        $data = $request->validate([
            'event_type' => ['required', Rule::in(['impression', 'click'])],
            'session' => ['nullable', 'string', 'max:191'],
            'context' => ['nullable', 'array'],
        ]);

        $userId = $request->user('sanctum')?->id;
        $sessionHash = filled($data['session'] ?? null)
            ? hash_hmac('sha256', (string) $data['session'], (string) config('app.key'))
            : null;

        AdEvent::query()->create([
            'assignment_id' => $assignment->id,
            'event_type' => $data['event_type'],
            'user_id' => $userId,
            'session_hash' => $sessionHash,
            'context' => $data['context'] ?? [],
            'occurred_at' => now(),
        ]);

        return response()->json(['message' => 'Événement enregistré.'], 201);
    }
}
