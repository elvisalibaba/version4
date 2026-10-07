<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('mobile_app_versions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('platform', ['android', 'ios'])->default('android');
            $table->string('version_name');
            $table->unsignedInteger('version_code');
            $table->unsignedInteger('minimum_supported_version_code')->default(1);
            $table->string('package_name')->nullable();
            $table->string('storage_path')->unique();
            $table->string('file_name');
            $table->string('mime_type')->default('application/vnd.android.package-archive');
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->string('checksum_sha256', 64)->nullable();
            $table->text('release_notes')->nullable();
            $table->boolean('is_mandatory')->default(false);
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->unsignedBigInteger('download_count')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('profiles')->nullOnDelete();
            $table->timestamps();
            $table->unique(['platform', 'version_code']);
        });

        Schema::create('mobile_app_configs', function (Blueprint $table) {
            $table->string('scope')->primary()->default('global');
            $table->string('app_name')->default('Holistique Stores');
            $table->string('hero_title')->default('Telecharger Holistique Stores');
            $table->text('hero_description');
            $table->string('android_cta_label')->default('Telecharger l APK');
            $table->string('apk_path')->nullable();
            $table->string('apk_file_name')->nullable();
            $table->string('version_label')->nullable();
            $table->text('release_notes')->nullable();
            $table->boolean('is_public')->default(false);
            $table->boolean('trial_enabled')->default(true);
            $table->unsignedTinyInteger('trial_days')->default(7);
            $table->timestamp('updated_at')->useCurrent();
            $table->foreignUuid('updated_by')->nullable()->constrained('profiles')->nullOnDelete();
            $table->foreignUuid('current_android_version_id')->nullable()->constrained('mobile_app_versions')->nullOnDelete();
        });

        Schema::create('mobile_app_trial_grants', function (Blueprint $table) {
            $table->foreignUuid('user_id')->primary()->constrained('profiles')->cascadeOnDelete();
            $table->string('source')->default('web_download');
            $table->timestamp('granted_at')->useCurrent();
            $table->dateTime('expires_at')->index();
            $table->enum('status', ['active', 'expired', 'revoked'])->default('active');
            $table->unsignedInteger('claimed_download_count')->default(1);
            $table->timestamp('last_downloaded_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('user_devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->string('device_uuid');
            $table->enum('platform', ['android', 'ios', 'web'])->default('android');
            $table->string('device_name')->nullable();
            $table->string('manufacturer')->nullable();
            $table->string('model')->nullable();
            $table->string('os_version')->nullable();
            $table->string('app_version_name')->nullable();
            $table->unsignedInteger('app_version_code')->nullable();
            $table->longText('public_key')->nullable();
            $table->enum('integrity_status', ['unknown', 'trusted', 'suspicious', 'blocked'])->default('unknown');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_trusted')->default(false);
            $table->timestamp('last_seen_at')->useCurrent();
            $table->timestamp('revoked_at')->nullable();
            $table->json('metadata');
            $table->timestamps();
            $table->unique(['user_id', 'device_uuid']);
        });

        Schema::create('offline_reading_licenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('device_id')->constrained('user_devices')->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('format_id')->nullable()->constrained('book_formats')->nullOnDelete();
            $table->foreignUuid('asset_id')->nullable()->constrained('book_assets')->nullOnDelete();
            $table->string('license_token_hash')->unique();
            $table->enum('status', ['active', 'expired', 'revoked'])->default('active');
            $table->timestamp('issued_at')->useCurrent();
            $table->dateTime('valid_until')->index();
            $table->timestamp('last_verified_at')->nullable();
            $table->unsignedTinyInteger('max_offline_days')->default(7);
            $table->timestamp('revoked_at')->nullable();
            $table->text('revoke_reason')->nullable();
            $table->json('metadata');
            $table->timestamps();
        });

        Schema::create('book_downloads', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('device_id')->constrained('user_devices')->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('format_id')->nullable()->constrained('book_formats')->nullOnDelete();
            $table->foreignUuid('asset_id')->nullable()->constrained('book_assets')->nullOnDelete();
            $table->foreignUuid('license_id')->nullable()->constrained('offline_reading_licenses')->nullOnDelete();
            $table->enum('status', ['requested', 'downloading', 'paused', 'completed', 'failed', 'deleted'])->default('requested');
            $table->unsignedBigInteger('bytes_downloaded')->default(0);
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->boolean('checksum_verified')->default(false);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->text('error_message')->nullable();
            $table->json('metadata');
            $table->timestamps();
        });

        Schema::create('reading_sync_queue', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('device_id')->constrained('user_devices')->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('format_id')->nullable()->constrained('book_formats')->nullOnDelete();
            $table->string('client_event_id');
            $table->enum('event_type', ['progress_upsert', 'highlight_upsert', 'highlight_delete', 'bookmark_upsert', 'bookmark_delete', 'reader_settings']);
            $table->json('payload');
            $table->enum('status', ['pending', 'processing', 'processed', 'failed'])->default('pending');
            $table->dateTime('device_created_at');
            $table->timestamp('processed_at')->nullable();
            $table->text('processing_error')->nullable();
            $table->unsignedInteger('retry_count')->default(0);
            $table->timestamps();
            $table->unique(['device_id', 'client_event_id']);
            $table->index(['status', 'created_at']);
        });

        Schema::create('push_notification_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('device_id')->constrained('user_devices')->cascadeOnDelete();
            $table->enum('provider', ['fcm', 'apns'])->default('fcm');
            // VARCHAR indexable : MySQL 8 refuse un index UNIQUE sur une colonne TEXT.
            $table->string('token', 512)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_seen_at')->useCurrent();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('push_notification_tokens');
        Schema::dropIfExists('reading_sync_queue');
        Schema::dropIfExists('book_downloads');
        Schema::dropIfExists('offline_reading_licenses');
        Schema::dropIfExists('user_devices');
        Schema::dropIfExists('mobile_app_trial_grants');
        Schema::dropIfExists('mobile_app_configs');
        Schema::dropIfExists('mobile_app_versions');
    }
};
