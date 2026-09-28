<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\MobileAppConfig;
use App\Models\MobileAppTrialGrant;
use App\Models\MobileAppVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MobileAppController extends Controller
{
    public function download()
    {
        $config = MobileAppConfig::query()->find('global');
        abort_unless($config?->is_public, 404);

        $version = MobileAppVersion::query()
            ->where('platform', 'android')
            ->where('is_published', true)
            ->latest('published_at')
            ->first();

        $path = $version?->storage_path ?: $config->apk_path;
        abort_unless(filled($path), 404);

        if (str_starts_with($path, 'https://') || str_starts_with($path, 'http://')) {
            return redirect()->away($path);
        }

        $disk = Storage::disk('books');
        abort_unless($disk->exists($path), 404);

        if ($version !== null) {
            $version->increment('download_count');
        }

        return $disk->download(
            $path,
            $version?->file_name ?: ($config->apk_file_name ?: 'holistique-stores.apk'),
            ['Content-Type' => $version?->mime_type ?: 'application/vnd.android.package-archive'],
        );
    }

    public function claimTrial(Request $request): JsonResponse
    {
        $config = MobileAppConfig::query()->find('global');
        abort_unless($config?->trial_enabled, 404);

        $profile = $request->user()->profile;
        $days = max(1, min(30, (int) $config->trial_days));
        $now = now();

        $grant = MobileAppTrialGrant::query()->firstOrNew(['user_id' => $profile->id]);

        if (! $grant->exists || $grant->status !== 'active' || $grant->expires_at?->isPast()) {
            $grant->source = 'web_download';
            $grant->granted_at = $now;
            $grant->expires_at = $now->copy()->addDays($days);
            $grant->status = 'active';
            $grant->claimed_download_count = 1;
        } else {
            $grant->claimed_download_count = max(1, (int) $grant->claimed_download_count) + 1;
        }

        $grant->last_downloaded_at = $now;
        $grant->save();

        return response()->json(['data' => $grant]);
    }
}
