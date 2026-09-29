<?php

namespace App\Services;

use App\Models\EmailVerificationCode;
use App\Models\User;
use App\Notifications\VerifyEmailCodeNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class EmailVerificationService
{
    public function issue(User $user): void
    {
        if ($user->email_verified_at !== null) {
            return;
        }

        $code = (string) random_int(100000, 999999);

        EmailVerificationCode::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'code_hash' => Hash::make($code),
                'attempts' => 0,
                'sent_at' => now(),
                'expires_at' => now()->addMinutes((int) config('holistic.verification_ttl_minutes', 15)),
            ],
        );

        $user->notify(new VerifyEmailCodeNotification($code));
    }

    public function verify(User $user, string $code): void
    {
        if ($user->email_verified_at !== null) {
            return;
        }

        $record = EmailVerificationCode::query()->whereKey($user->id)->first();

        if ($record === null || $record->expires_at?->isPast()) {
            throw ValidationException::withMessages([
                'code' => 'Ce code a expiré. Demandez un nouveau code.',
            ]);
        }

        $maxAttempts = (int) config('holistic.verification_max_attempts', 5);

        if ($record->attempts >= $maxAttempts) {
            throw ValidationException::withMessages([
                'code' => 'Trop de tentatives. Demandez un nouveau code.',
            ]);
        }

        if (! Hash::check($code, $record->code_hash)) {
            $record->increment('attempts');

            throw ValidationException::withMessages([
                'code' => 'Le code de vérification est incorrect.',
            ]);
        }

        $user->forceFill(['email_verified_at' => now()])->save();
        $record->delete();
    }
}
