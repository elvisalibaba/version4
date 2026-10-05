<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_audit_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('actor_id')->nullable()->constrained('profiles')->nullOnDelete();
            $table->string('action', 120)->index();
            $table->string('entity_type', 120)->nullable()->index();
            $table->uuid('entity_id')->nullable()->index();
            $table->enum('severity', ['info', 'warning', 'critical'])->default('info')->index();
            $table->text('summary')->nullable();
            $table->json('before_state')->nullable();
            $table->json('after_state')->nullable();
            $table->json('context')->nullable();
            $table->timestamp('occurred_at')->useCurrent()->index();
            $table->timestamps();

            $table->index(['entity_type', 'entity_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_audit_events');
    }
};
