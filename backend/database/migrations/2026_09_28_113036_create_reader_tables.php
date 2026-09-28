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
        Schema::create('book_favorites', function (Blueprint $table) {
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->primary(['user_id', 'book_id']);
        });

        Schema::create('ratings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->decimal('rating', 2, 1);
            $table->timestamps();
            $table->unique(['user_id', 'book_id']);
        });

        Schema::create('highlights', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('page')->nullable();
            $table->text('text')->nullable();
            $table->text('note')->nullable();
            $table->string('color', 30)->default('yellow');
            $table->text('locator')->nullable();
            $table->enum('locator_type', ['epub_cfi', 'pdf_page', 'pdf_locator', 'custom'])->nullable();
            $table->text('selected_text')->nullable();
            $table->string('chapter_label')->nullable();
            $table->decimal('progress_percent', 5, 2)->nullable();
            $table->uuid('device_record_id')->nullable()->index();
            $table->string('client_highlight_id')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'book_id']);
        });

        Schema::create('reading_progress', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('format_id')->nullable()->constrained('book_formats')->nullOnDelete();
            $table->text('locator');
            $table->enum('locator_type', ['epub_cfi', 'pdf_page', 'pdf_locator', 'audio_position', 'custom'])->default('epub_cfi');
            $table->decimal('progress_percent', 5, 2)->default(0);
            $table->string('device_id')->nullable();
            $table->string('device_name')->nullable();
            $table->uuid('device_record_id')->nullable()->index();
            $table->unsignedBigInteger('sync_revision')->default(1);
            $table->timestamps();
            $table->unique(['user_id', 'book_id', 'format_id']);
        });

        Schema::create('book_engagement_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('profiles')->nullOnDelete();
            $table->enum('event_type', ['detail_view', 'reader_open', 'file_access']);
            $table->string('source')->nullable();
            $table->enum('user_role', ['reader', 'author', 'admin'])->nullable();
            $table->boolean('is_authenticated')->default(false);
            $table->json('metadata');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['book_id', 'event_type', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('book_engagement_events');
        Schema::dropIfExists('reading_progress');
        Schema::dropIfExists('highlights');
        Schema::dropIfExists('ratings');
        Schema::dropIfExists('book_favorites');
    }
};
