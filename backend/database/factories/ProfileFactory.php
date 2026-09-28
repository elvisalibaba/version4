<?php

namespace Database\Factories;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Profile>
 */
class ProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => User::factory(),
            'email' => fake()->unique()->safeEmail(),
            'name' => fake()->name(),
            'role' => 'reader',
            'preferred_language' => 'fr',
            'favorite_categories' => [],
            'marketing_opt_in' => false,
        ];
    }

    public function author(): static
    {
        return $this->state(fn (): array => ['role' => 'author']);
    }

    public function admin(): static
    {
        return $this->state(fn (): array => ['role' => 'admin']);
    }
}
