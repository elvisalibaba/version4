<?php

namespace Database\Factories;

use App\Models\Book;
use App\Models\AuthorProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Book>
 */
class BookFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'price' => 9.99,
            'author_id' => AuthorProfile::factory(),
            'status' => 'published',
            'co_authors' => [],
            'language' => 'fr',
            'categories' => [],
            'tags' => [],
            'currency_code' => 'USD',
            'is_single_sale_enabled' => true,
            'is_subscription_available' => false,
            'review_status' => 'approved',
            'copyright_status' => 'clear',
            'published_at' => now(),
        ];
    }

    public function free(): static
    {
        return $this->state(fn (): array => ['price' => 0, 'is_single_sale_enabled' => true]);
    }

    public function draft(): static
    {
        return $this->state(fn (): array => ['status' => 'draft', 'published_at' => null]);
    }

    public function subscriptionOnly(): static
    {
        return $this->state(fn (): array => ['is_single_sale_enabled' => false, 'is_subscription_available' => true]);
    }
}
