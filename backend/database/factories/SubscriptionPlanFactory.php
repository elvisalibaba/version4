<?php

namespace Database\Factories;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SubscriptionPlan>
 */
class SubscriptionPlanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'slug' => fake()->unique()->slug(),
            'monthly_price' => 9.99,
            'currency_code' => 'USD',
            'is_active' => true,
            'max_devices' => 2,
            'offline_days' => 7,
            'downloads_enabled' => true,
        ];
    }
}
