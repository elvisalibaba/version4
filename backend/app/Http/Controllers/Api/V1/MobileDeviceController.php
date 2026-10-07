<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MobileAppConfig;
use App\Models\MobileAppVersion;
use App\Models\PushNotificationToken;
use App\Models\UserDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MobileDeviceController extends Controller
{
    public function bootstrap(): JsonResponse
    {
        $config = MobileAppConfig::query()->find('global');

        $versions = MobileAppVersion::query()
            ->where('is_published', true)
            ->whereIn('platform', ['android', 'ios'])
            ->orderByDesc('version_code')
            ->get()
            ->unique('platform')
            ->mapWithKeys(fn (MobileAppVersion $version): array => [
                $version->platform => [
                    'version_name' => $version->version_name,
                    'version_code' => $version->version_code,
                    'minimum_supported_version_code' => $version->minimum_supported_version_code,
                    'mandatory' => $version->is_mandatory,
                    'release_notes' => $version->release_notes,
                ],
            ]);

        return response()->json([
            'data' => [
                'api_version' => config('holistic.api_version', 'v1'),
                'server_time' => now()->toIso8601String(),
                'auth' => [
                    'scheme' => 'Bearer',
                    'provider' => 'Laravel Sanctum',
                    'email_verification' => 'otp_6_digits',
                ],
                'features' => [
                    'reader' => true,
                    'author_studio' => true,
                    'payments_easypay' => true,
                    'subscriptions' => true,
                    'offline_reading' => true,
                    'reading_progress_sync' => true,
                    'highlights_sync' => true,
                    'push_notifications' => true,
                    'audiobooks' => true,
                    'video' => true,
                    'advertising' => true,
                    'ad_endpoint' => '/api/v1/ads/{placementCode}',
                ],
                'trial' => [
                    'enabled' => (bool) ($config?->trial_enabled ?? false),
                    'days' => (int) ($config?->trial_days ?? 0),
                ],
                'versions' => $versions,
            ],
        ]);
    }

    public function upsertDevice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_uuid' => ['required', 'string', 'max:191'],
            'platform' => ['required', Rule::in(['android', 'ios'])],
            'device_name' => ['nullable', 'string', 'max:191'],
            'manufacturer' => ['nullable', 'string', 'max:120'],
            'model' => ['nullable', 'string', 'max:120'],
            'os_version' => ['nullable', 'string', 'max:120'],
            'app_version_name' => ['nullable', 'string', 'max:60'],
            'app_version_code' => ['nullable', 'integer', 'min:1'],
            'public_key' => ['nullable', 'string', 'max:20000'],
            'metadata' => ['nullable', 'array'],
        ]);

        $profile = $request->user()->profile;
        abort_unless($profile !== null, 403);

        $device = UserDevice::query()->updateOrCreate(
            ['user_id' => $profile->id, 'device_uuid' => $data['device_uuid']],
            [
                ...$data,
                'metadata' => $data['metadata'] ?? [],
                'is_active' => true,
                'revoked_at' => null,
                'last_seen_at' => now(),
            ],
        );

        return response()->json(['data' => $device], $device->wasRecentlyCreated ? 201 : 200);
    }

    public function heartbeat(Request $request, string $deviceUuid): JsonResponse
    {
        $profile = $request->user()->profile;
        abort_unless($profile !== null, 403);

        $device = UserDevice::query()
            ->where('user_id', $profile->id)
            ->where('device_uuid', $deviceUuid)
            ->firstOrFail();

        $device->update([
            'last_seen_at' => now(),
            'is_active' => true,
        ]);

        return response()->json(['data' => $device->fresh()]);
    }

    public function revokeDevice(Request $request, string $deviceUuid): JsonResponse
    {
        $profile = $request->user()->profile;
        abort_unless($profile !== null, 403);

        $device = UserDevice::query()
            ->where('user_id', $profile->id)
            ->where('device_uuid', $deviceUuid)
            ->firstOrFail();

        $device->update([
            'is_active' => false,
            'is_trusted' => false,
            'revoked_at' => now(),
        ]);

        PushNotificationToken::query()
            ->where('user_id', $profile->id)
            ->where('device_id', $device->id)
            ->update([
                'is_active' => false,
                'revoked_at' => now(),
            ]);

        return response()->json(['message' => 'Appareil révoqué.']);
    }

    public function upsertPushToken(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_uuid' => ['required', 'string', 'max:191'],
            'provider' => ['required', Rule::in(['fcm', 'apns'])],
            'token' => ['required', 'string', 'max:512'],
        ]);

        $profile = $request->user()->profile;
        abort_unless($profile !== null, 403);

        $device = UserDevice::query()
            ->where('user_id', $profile->id)
            ->where('device_uuid', $data['device_uuid'])
            ->where('is_active', true)
            ->firstOrFail();

        $pushToken = PushNotificationToken::query()->updateOrCreate(
            ['token' => $data['token']],
            [
                'user_id' => $profile->id,
                'device_id' => $device->id,
                'provider' => $data['provider'],
                'is_active' => true,
                'last_seen_at' => now(),
                'revoked_at' => null,
            ],
        );

        return response()->json([
            'data' => [
                'id' => $pushToken->id,
                'provider' => $pushToken->provider,
                'active' => $pushToken->is_active,
                'last_seen_at' => $pushToken->last_seen_at,
            ],
        ], $pushToken->wasRecentlyCreated ? 201 : 200);
    }
}
