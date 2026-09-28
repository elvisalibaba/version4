<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\AuthorProfile;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
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

        return response()->json([
            'data' => new UserResource($user->load('profile.authorProfile')),
            'token' => $user->createToken('web')->plainTextToken,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::query()->where('email', mb_strtolower($data['email']))->first();

        if ($user === null || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'Les identifiants fournis sont incorrects.']);
        }

        return response()->json([
            'data' => new UserResource($user->load('profile.authorProfile')),
            'token' => $user->createToken($data['device_name'] ?? 'web')->plainTextToken,
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
