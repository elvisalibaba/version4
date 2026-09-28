<?php

namespace Database\Factories;

use App\Models\BookAsset;
use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BookAsset>
 */
class BookAssetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'book_id' => Book::factory(),
            'asset_type' => 'full_book',
            'delivery_format' => 'pdf',
            'storage_path' => fake()->uuid().'/book.pdf',
            'mime_type' => 'application/pdf',
            'is_encrypted' => false,
            'is_published' => true,
            'encryption_scheme' => 'none',
        ];
    }
}
