<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

final class PublicMediaUrl
{
    public static function resolve(?string $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        $value = trim($value);

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return Storage::disk('public')->url(ltrim($value, '/'));
    }

    /**
     * @param array<int, mixed> $blocks
     * @return array<int, mixed>
     */
    public static function resolveContentBlocks(array $blocks): array
    {
        return array_map(function (mixed $block): mixed {
            if (! is_array($block) || ($block['type'] ?? null) !== 'image') {
                return $block;
            }

            $block['url'] = self::resolve(is_string($block['url'] ?? null) ? $block['url'] : null);

            return $block;
        }, $blocks);
    }
}
