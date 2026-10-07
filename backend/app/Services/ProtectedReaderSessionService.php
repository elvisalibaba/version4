<?php

namespace App\Services;

use App\Models\Book;
use App\Models\BookReaderSession;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProtectedReaderSessionService
{
    /**
     * @return array{token:string, expires_at:string}
     */
    public function issue(Profile $profile, Book $book, Request $request): array
    {
        $ttl = max(2, (int) config('reading.session_ttl_minutes', 10));
        $token = Str::random(80);
        $tokenHash = hash('sha256', $token);
        $device = trim((string) $request->header('X-Holistique-Device-Id', ''));
        $userAgent = trim((string) $request->userAgent());
        $fingerprint = $device !== ''
            ? hash('sha256', 'device:'.$device)
            : ($userAgent !== '' ? hash('sha256', 'ua:'.$userAgent) : null);

        $session = BookReaderSession::query()->create([
            'user_id' => $profile->id,
            'book_id' => $book->id,
            'token_hash' => $tokenHash,
            'device_fingerprint' => $fingerprint,
            'client_type' => mb_substr((string) $request->header('X-Holistique-Reader', 'web'), 0, 30),
            'ip_hash' => $this->hashIp($request->ip()),
            'expires_at' => now()->addMinutes($ttl),
        ]);

        $this->prune($profile->id, $book->id, $session->id);

        return [
            'token' => $token,
            'expires_at' => $session->expires_at->toIso8601String(),
        ];
    }

    public function validate(Request $request, Profile $profile, Book $book): ?BookReaderSession
    {
        if (! config('reading.require_session', true)) {
            return null;
        }

        // En-tête uniquement : un jeton en query string finirait dans les logs d'accès.
        $token = trim((string) $request->header('X-Holistique-Reader-Token', ''));

        abort_if($token === '', 401, 'Session de lecture sécurisée requise.');

        $session = BookReaderSession::query()
            ->where('token_hash', hash('sha256', $token))
            ->where('user_id', $profile->id)
            ->where('book_id', $book->id)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();

        abort_unless($session !== null, 401, 'Session de lecture expirée ou invalide.');

        $device = trim((string) $request->header('X-Holistique-Device-Id', ''));
        $userAgent = trim((string) $request->userAgent());
        $currentFingerprint = $device !== ''
            ? hash('sha256', 'device:'.$device)
            : ($userAgent !== '' ? hash('sha256', 'ua:'.$userAgent) : null);

        if ($session->device_fingerprint !== null && $currentFingerprint !== null) {
            abort_unless(hash_equals($session->device_fingerprint, $currentFingerprint), 401, 'Session liée à un autre appareil.');
        }

        $session->forceFill(['last_used_at' => now()])->saveQuietly();

        return $session;
    }

    private function prune(string $userId, string $bookId, string $keepId): void
    {
        BookReaderSession::query()
            ->where('user_id', $userId)
            ->where('book_id', $bookId)
            ->where('expires_at', '<=', now())
            ->delete();

        $max = max(1, (int) config('reading.max_active_sessions_per_book', 5));
        $ids = BookReaderSession::query()
            ->where('user_id', $userId)
            ->where('book_id', $bookId)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->whereKeyNot($keepId)
            ->latest()
            ->pluck('id')
            ->all();

        foreach (array_slice($ids, $max - 1) as $id) {
            BookReaderSession::query()->whereKey($id)->update(['revoked_at' => now()]);
        }
    }

    private function hashIp(?string $ip): ?string
    {
        if (! $ip) {
            return null;
        }

        return hash_hmac('sha256', $ip, (string) config('app.key'));
    }
}
