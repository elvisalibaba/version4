<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\Profile;
use App\Models\Rating;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Rating>
 */
class RatingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => Profile::factory(),
            'book_id' => Book::factory(),
            'rating' => fake()->numberBetween(1, 5),
            'review_text' => fake()->optional()->paragraph(),
            'helpful_count' => 0,
            'is_hidden' => false,
        ];
    }
}
