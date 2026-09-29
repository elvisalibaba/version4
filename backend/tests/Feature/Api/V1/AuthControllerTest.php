<?php

namespace Tests\Feature\Api\V1;

use App\Models\EmailVerificationCode;
use App\Models\Profile;
use App\Models\User;
use App\Notifications\VerifyEmailCodeNotification;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_valid_reader_payload_creates_unverified_account_and_sends_code(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'reader@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'role' => 'reader',
            'first_name' => 'Aline',
            'last_name' => 'Kanku',
        ]);

        $response->assertCreated()
            ->assertJsonPath('verification_required', true)
            ->assertJsonPath('email', 'reader@example.com');

        $user = User::query()->where('email', 'reader@example.com')->firstOrFail();

        $this->assertNull($user->email_verified_at);
        $this->assertDatabaseHas('profiles', ['email' => 'reader@example.com', 'role' => 'reader']);
        $this->assertDatabaseHas('email_verification_codes', ['user_id' => $user->id]);
        Notification::assertSentTo($user, VerifyEmailCodeNotification::class);
    }

    public function test_admin_role_registration_returns_422(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'email' => 'admin@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'role' => 'admin',
        ])->assertUnprocessable()->assertJsonValidationErrors('role');

        $this->assertDatabaseMissing('users', ['email' => 'admin@example.com']);
    }

    public function test_unverified_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'email' => 'reader@example.com',
            'password' => 'Password123',
            'email_verified_at' => null,
        ]);

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Password123'])
            ->assertForbidden()
            ->assertJsonPath('verification_required', true);
    }

    public function test_email_code_verification_returns_sanctum_token(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'reader@example.com',
            'email_verified_at' => null,
        ]);
        Profile::factory()->create([
            'id' => $user->id,
            'email' => $user->email,
            'role' => 'reader',
        ]);
        EmailVerificationCode::query()->create([
            'user_id' => $user->id,
            'code_hash' => Hash::make('123456'),
            'attempts' => 0,
            'sent_at' => now(),
            'expires_at' => now()->addMinutes(15),
        ]);

        $this->postJson('/api/v1/auth/verify-email', [
            'email' => $user->email,
            'code' => '123456',
            'device_name' => 'test',
        ])->assertOk()
            ->assertJsonStructure(['data' => ['id', 'email'], 'token']);

        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertDatabaseMissing('email_verification_codes', ['user_id' => $user->id]);
    }

    public function test_verified_credentials_return_a_sanctum_token(): void
    {
        $user = User::factory()->create([
            'email' => 'reader@example.com',
            'password' => 'Password123',
            'email_verified_at' => now(),
        ]);

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Password123'])
            ->assertOk()
            ->assertJsonStructure(['data' => ['id', 'email'], 'token']);
    }
}
