<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_reader_sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained('books')->cascadeOnDelete();
            $table->string('token_hash', 64)->unique();
            $table->string('device_fingerprint', 128)->nullable()->index();
            $table->string('client_type', 30)->default('web');
            $table->string('ip_hash', 64)->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('revoked_at')->nullable()->index();
            $table->timestamps();

            $table->index(['user_id', 'book_id', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_reader_sessions');
    }
};
