<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Support\Str;

class BookTaxonomyService
{
    public function sync(Book $book, array $names): void
    {
        $ids = collect($names)
            ->filter(fn ($name) => is_string($name) && trim($name) !== '')
            ->map(function (string $name): string {
                $normalized = trim($name);
                $category = Category::query()->firstOrCreate(
                    ['name' => $normalized],
                    [
                        'slug' => Str::slug($normalized),
                        'sort_order' => 999,
                        'is_active' => true,
                        'is_featured' => false,
                        'content_types' => ['ebook', 'audiobook', 'video'],
                    ],
                );

                return $category->id;
            })
            ->values()
            ->all();

        $book->categoriesRelation()->sync($ids);
    }
}
