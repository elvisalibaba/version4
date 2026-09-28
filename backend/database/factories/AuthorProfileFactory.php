<?php

namespace Database\Factories;

use App\Models\AuthorProfile;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuthorProfile>
 */
class AuthorProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => Profile::factory()->author(),
            'display_name' => fake()->name(),
            'social_links' => [],
            'genres' => [fake()->word()],
            'press_mentions' => [],
        ];
    }
}
