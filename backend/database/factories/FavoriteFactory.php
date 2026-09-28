<?php

namespace Database\Factories;

use App\Models\Favorite;
use App\Models\Book;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Favorite>
 */
class FavoriteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => Profile::factory(),
            'book_id' => Book::factory(),
        ];
    }
}
