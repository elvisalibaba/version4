<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\AuthorProfile;
use App\Models\Profile;
use App\Models\User;
use App\Notifications\WelcomeNotification;
use App\Services\EmailVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, EmailVerificationService $verification): JsonResponse
    {
        $data = $request->validated();

        $user = DB::transaction(function () use ($data): User {
            $name = $data['name'] ?? trim(($data['first_name'] ?? '').' '.($data['last_name'] ?? ''));
            $name = $name !== '' ? $name : Str::before($data['email'], '@');

            $user = User::query()->create([
                'name' => $name,
                'email' => mb_strtolower($data['email']),
                'password' => $data['password'],
            ]);

            Profile::query()->create([
                'id' => $user->id,
                'email' => $user->email,
                'name' => $name,
                'role' => $data['role'],
                'first_name' => $data['first_name'] ?? null,
                'last_name' => $data['last_name'] ?? null,
                'phone' => $data['phone'] ?? null,
                'country' => $data['country'] ?? null,
                'city' => $data['city'] ?? null,
                'preferred_language' => $data['preferred_language'] ?? 'fr',
                'favorite_categories' => $data['favorite_categories'] ?? [],
                'marketing_opt_in' => $data['marketing_opt_in'] ?? false,
                'referred_by_affiliate_code' => isset($data['referred_by_affiliate_code']) ? mb_strtoupper($data['referred_by_affiliate_code']) : null,
                'affiliate_source_type' => $data['affiliate_source_type'] ?? null,
                'affiliate_source_book_id' => $data['affiliate_source_book_id'] ?? null,
                'affiliate_source_plan_id' => $data['affiliate_source_plan_id'] ?? null,
            ]);

            if ($data['role'] === 'author') {
                AuthorProfile::query()->create([
                    'id' => $user->id,
                    'display_name' => $data['display_name'],
                    'professional_headline' => $data['professional_headline'] ?? null,
                    'bio' => $data['bio'] ?? null,
                    'website' => $data['website'] ?? null,
                    'location' => $data['location'] ?? null,
                    'phone' => $data['phone'] ?? null,
                    'social_links' => $data['social_links'] ?? [],
                    'genres' => $data['genres'] ?? [],
                    'publishing_goals' => $data['publishing_goals'] ?? null,
                    'press_mentions' => [],
                ]);
            }

            return $user;
        });

        try {
            $verification->issue($user);
        } catch (Throwable $error) {
            Log::warning('Impossible d’envoyer le code de vérification email.', [
                'user_id' => $user->id,
                'exception' => $error,
            ]);
        }

        $user->load('profile.authorProfile');

        return response()->json([
            'message' => 'Compte créé. Vérifiez votre adresse email pour continuer.',
            'verification_required' => true,
            'email' => $user->email,
            // Transitional token for clients deployed before the OTP screen existed.
            // Protected API routes remain blocked by the verified middleware until
            // the address has actually been confirmed.
            'data' => new UserResource($user),
            'token' => $user->createToken('email-verification')->plainTextToken,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::query()->where('email', mb_strtolower($data['email']))->first();

        if ($user === null || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Les identifiants fournis sont incorrects.']);
        }

        if ($user->email_verified_at === null) {
            return response()->json([
                'message' => 'Confirmez votre adresse email avant de vous connecter.',
                'verification_required' => true,
                'email' => $user->email,
            ], 403);
        }

        return response()->json([
            'data' => new UserResource($user->load('profile.authorProfile')),
            'token' => $user->createToken($data['device_name'] ?? 'web')->plainTextToken,
        ]);
    }

    public function verifyEmail(Request $request, EmailVerificationService $verification): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'digits:6'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $user = User::query()->where('email', mb_strtolower($data['email']))->first();

        if ($user === null) {
            throw ValidationException::withMessages(['email' => 'Compte introuvable.']);
        }

        $verification->verify($user, $data['code']);
        $user->load('profile.authorProfile');

        try {
            $user->notify(new WelcomeNotification());
        } catch (Throwable $error) {
            Log::warning('Impossible d’envoyer le mail de bienvenue.', [
                'user_id' => $user->id,
                'exception' => $error,
            ]);
        }

        return response()->json([
            'message' => 'Adresse email confirmée.',
            'data' => new UserResource($user),
            'token' => $user->createToken($data['device_name'] ?? 'web')->plainTextToken,
        ]);
    }

    public function verifyEmailLink(Request $request, User $user, EmailVerificationService $verification)
    {
        $verification->verify($user, (string) $request->query('code'));

        try {
            $user->loadMissing('profile.authorProfile');
            $user->notify(new WelcomeNotification());
        } catch (Throwable $error) {
            Log::warning('Impossible d’envoyer le mail de bienvenue après validation par lien.', [
                'user_id' => $user->id,
                'exception' => $error,
            ]);
        }

        return redirect()->away(config('holistic.frontend_url').'/login?verified=1');
    }

    public function resendVerification(Request $request, EmailVerificationService $verification): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        $user = User::query()->where('email', mb_strtolower($data['email']))->first();

        if ($user !== null && $user->email_verified_at === null) {
            try {
                $verification->issue($user);
            } catch (Throwable $error) {
                Log::warning('Impossible de renvoyer le code de vérification email.', [
                    'user_id' => $user->id,
                    'exception' => $error,
                ]);
            }
        }

        return response()->json([
            'message' => 'Si ce compte nécessite une vérification, un nouveau code a été envoyé.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user()->load('profile.authorProfile'));
    }
}
