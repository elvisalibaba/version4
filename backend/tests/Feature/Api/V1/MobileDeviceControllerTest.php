<?php

namespace Tests\Feature\Api\V1;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MobileDeviceControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_bootstrap_is_public(): void
    {
        $this->getJson('/api/v1/mobile/bootstrap')
            ->assertOk()
            ->assertJsonPath('data.api_version', 'v1')
            ->assertJsonPath('data.auth.provider', 'Laravel Sanctum');
    }

    public function test_authenticated_user_can_register_device_and_push_token(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        Profile::factory()->create([
            'id' => $user->id,
            'email' => $user->email,
            'role' => 'reader',
        ]);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/mobile/devices', [
            'device_uuid' => 'flutter-test-device',
            'platform' => 'android',
            'device_name' => 'Flutter Test',
            'app_version_name' => '1.0.0',
            'app_version_code' => 1,
        ])->assertCreated();

        $this->postJson('/api/v1/mobile/push-token', [
            'device_uuid' => 'flutter-test-device',
            'provider' => 'fcm',
            'token' => 'test-fcm-token',
        ])->assertCreated()
            ->assertJsonPath('data.provider', 'fcm');

        $this->assertDatabaseHas('user_devices', [
            'user_id' => $user->id,
            'device_uuid' => 'flutter-test-device',
            'is_active' => 1,
        ]);
    }
}
