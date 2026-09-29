<?php

namespace App\Services;

use App\Models\Book;

class PublicationReadinessService
{
    public function evaluate(Book $book): array
    {
        $checks = [
            'metadata' => [
                'label' => 'Métadonnées',
                'weight' => 20,
                'ok' => filled($book->title) && filled($book->description) && filled($book->language),
            ],
            'cover' => [
                'label' => 'Couverture',
                'weight' => 15,
                'ok' => filled($book->cover_url),
            ],
            'manuscript' => [
                'label' => 'Manuscrit',
                'weight' => 20,
                'ok' => filled($book->file_url) || $book->assets()->where('asset_type', 'full_book')->exists(),
            ],
            'pricing' => [
                'label' => 'Prix',
                'weight' => 10,
                'ok' => (float) $book->price >= 0 && filled($book->currency_code),
            ],
            'rights' => [
                'label' => 'Droits',
                'weight' => 15,
                'ok' => $book->copyright_status === 'clear',
            ],
            'distribution' => [
                'label' => 'Distribution',
                'weight' => 10,
                'ok' => $book->distributionSetting()->exists(),
            ],
            'formats' => [
                'label' => 'Formats',
                'weight' => 10,
                'ok' => $book->formats()->exists(),
            ],
        ];

        $score = collect($checks)
            ->filter(fn (array $check): bool => $check['ok'])
            ->sum('weight');

        $blockers = collect($checks)
            ->filter(fn (array $check): bool => ! $check['ok'])
            ->pluck('label')
            ->values()
            ->all();

        return [
            'score' => (int) $score,
            'ready' => $score >= 90 && $book->copyright_status === 'clear',
            'blockers' => $blockers,
            'checks' => $checks,
        ];
    }
}
