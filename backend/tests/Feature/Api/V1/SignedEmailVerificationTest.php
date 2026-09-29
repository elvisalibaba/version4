<?php

namespace Tests\Feature\Api\V1;

use App\Models\EmailVerificationCode;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class SignedEmailVerificationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_signed_email_link_verifies_account(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create([
            'email' => 'link@example.com',
        ]);

        Profile::factory()->create([
            'id' => $user->id,
            'email' => $user->email,
            'role' => 'reader',
        ]);

        EmailVerificationCode::query()->create([
            'user_id' => $user->id,
            'code_hash' => Hash::make('654321'),
            'attempts' => 0,
            'sent_at' => now(),
            'expires_at' => now()->addMinutes(15),
        ]);

        $url = URL::temporarySignedRoute(
            'api.v1.auth.verify-email-link',
            now()->addMinutes(15),
            ['user' => $user->id, 'code' => '654321'],
        );

        $this->get($url)
            ->assertRedirect(config('holistic.frontend_url').'/login?verified=1');

        $this->assertNotNull($user->fresh()->email_verified_at);
    }
}
