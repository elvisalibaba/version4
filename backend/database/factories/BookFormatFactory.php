<?php

namespace Database\Factories;

use App\Models\BookFormat;
use App\Models\Book;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BookFormat>
 */
class BookFormatFactory extends Factory
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
            'format' => 'ebook',
            'price' => 9.99,
            'file_url' => null,
            'downloadable' => true,
            'is_published' => true,
            'currency_code' => 'USD',
        ];
    }
}
