<?php

namespace Database\Factories;

use App\Models\Subscription;
use App\Models\Profile;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
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
            'plan_id' => SubscriptionPlan::factory(),
            'status' => 'active',
            'started_at' => now(),
            'expires_at' => now()->addMonth(),
            'affiliate_commission_rate' => 0.0200,
        ];
    }
}
