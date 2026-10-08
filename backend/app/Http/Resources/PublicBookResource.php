<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

/**
 * Vue publique d'un livre : la ressource complète, sans les champs de la
 * chaîne éditoriale, des droits ni des statistiques internes.
 */
class PublicBookResource extends BookResource
{
    /**
     * Clés réservées à l'espace auteur et à l'administration.
     */
    public const INTERNAL_KEYS = [
        'review_status',
        'review_note',
        'copyright_status',
        'copyright_note',
        'editorial_stage',
        'spiritual_metadata',
        'bat_status',
        'bat_approved_at',
        'views_count',
        'clicks_count',
        'submitted_at',
        'reviewed_at',
    ];

    public const INTERNAL_FORMAT_KEYS = ['printing_cost'];

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $payload = Arr::except(parent::toArray($request), self::INTERNAL_KEYS);

        if ($payload['formats'] instanceof Collection) {
            $payload['formats'] = $payload['formats']
                ->map(fn (array $format): array => Arr::except($format, self::INTERNAL_FORMAT_KEYS))
                ->values();
        }

        return $payload;
    }
}
