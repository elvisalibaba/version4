<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_valid_reader_payload_creates_account_and_returns_201(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'reader@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'role' => 'reader',
            'first_name' => 'Aline',
            'last_name' => 'Kanku',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.email', 'reader@example.com')
            ->assertJsonPath('data.profile.role', 'reader')
            ->assertJsonStructure(['token']);

        $this->assertDatabaseHas('users', ['email' => 'reader@example.com']);
        $this->assertDatabaseHas('profiles', ['email' => 'reader@example.com', 'role' => 'reader']);
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

    public function test_valid_credentials_return_a_sanctum_token(): void
    {
        $user = User::factory()->create(['email' => 'reader@example.com', 'password' => 'Password123']);

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Password123'])
            ->assertOk()
            ->assertJsonStructure(['data' => ['id', 'email'], 'token']);
    }
}
