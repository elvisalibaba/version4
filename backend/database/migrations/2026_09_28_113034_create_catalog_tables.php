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
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name')->unique();
            $table->string('slug')->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('books', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title')->index();
            $table->string('subtitle')->nullable();
            $table->longText('description')->nullable();
            $table->decimal('price', 12, 2)->default(0);
            $table->foreignUuid('author_id')->constrained('author_profiles')->cascadeOnDelete();
            $table->string('author_display_name')->nullable();
            $table->string('cover_url')->nullable();
            $table->string('file_url')->nullable();
            $table->enum('status', ['draft', 'published', 'archived', 'coming_soon'])->default('draft')->index();
            $table->json('co_authors');
            $table->string('isbn')->nullable()->index();
            $table->string('language', 10)->default('fr');
            $table->string('publisher')->nullable();
            $table->date('publication_date')->nullable();
            $table->unsignedInteger('page_count')->nullable();
            $table->json('categories');
            $table->json('tags');
            $table->string('age_rating', 30)->nullable();
            $table->string('edition')->nullable();
            $table->string('series_name')->nullable();
            $table->unsignedInteger('series_position')->nullable();
            $table->string('file_format', 30)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('sample_url')->nullable();
            $table->unsignedInteger('sample_pages')->nullable();
            $table->string('cover_thumbnail_url')->nullable();
            $table->string('cover_alt_text')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedBigInteger('purchases_count')->default(0);
            $table->decimal('rating_avg', 3, 2)->nullable();
            $table->unsignedInteger('ratings_count')->default(0);
            $table->string('currency_code', 3)->default('USD');
            $table->boolean('is_single_sale_enabled')->default(true);
            $table->boolean('is_subscription_available')->default(false);
            $table->enum('review_status', ['draft', 'submitted', 'approved', 'rejected', 'changes_requested'])->default('draft')->index();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignUuid('reviewed_by')->nullable()->constrained('profiles')->nullOnDelete();
            $table->text('review_note')->nullable();
            $table->enum('copyright_status', ['clear', 'review', 'blocked'])->default('review')->index();
            $table->text('copyright_note')->nullable();
            $table->timestamp('copyright_blocked_at')->nullable();
            $table->foreignUuid('copyright_blocked_by')->nullable()->constrained('profiles')->nullOnDelete();
            $table->foreignUuid('admin_import_batch_id')->nullable()->constrained('admin_book_import_batches')->nullOnDelete();
            $table->uuid('admin_import_item_id')->nullable()->index();
            $table->string('admin_import_checksum', 64)->nullable()->index();
            $table->string('admin_import_original_file_name')->nullable();
            $table->foreignUuid('admin_imported_by')->nullable()->constrained('profiles')->nullOnDelete();
            $table->timestamp('admin_imported_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'published_at']);
            $table->index(['author_id', 'status']);
        });

        Schema::create('book_formats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->enum('format', ['holistique_store', 'ebook', 'paperback', 'pocket', 'hardcover', 'audiobook']);
            $table->decimal('price', 12, 2)->default(0);
            $table->string('file_url')->nullable();
            $table->unsignedInteger('stock_quantity')->nullable();
            $table->unsignedInteger('file_size_mb')->nullable();
            $table->boolean('downloadable')->default(false);
            $table->boolean('is_published')->default(false);
            $table->string('currency_code', 3)->default('USD');
            $table->decimal('printing_cost', 12, 2)->nullable();
            $table->timestamps();

            $table->unique(['book_id', 'format']);
            $table->index(['format', 'is_published']);
        });

        Schema::create('book_assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('format_id')->nullable()->constrained('book_formats')->nullOnDelete();
            $table->enum('asset_type', ['full_book', 'sample', 'cover', 'thumbnail']);
            $table->enum('delivery_format', ['epub', 'pdf', 'mp3', 'm4b', 'jpg', 'png', 'webp']);
            $table->string('storage_path');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->string('checksum')->nullable();
            $table->boolean('is_encrypted')->default(false);
            $table->boolean('is_published')->default(false);
            $table->enum('encryption_scheme', ['none', 'aes_256_gcm'])->default('none');
            $table->unsignedInteger('encryption_key_version')->nullable();
            $table->timestamps();

            $table->index(['book_id', 'asset_type', 'is_published']);
        });

        Schema::create('book_authors', function (Blueprint $table) {
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('author_id')->constrained('author_profiles')->cascadeOnDelete();
            $table->enum('author_role', ['author', 'co_author', 'editor', 'translator', 'preface'])->default('author');
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->primary(['book_id', 'author_id']);
        });

        Schema::create('book_categories', function (Blueprint $table) {
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('category_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->primary(['book_id', 'category_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('book_categories');
        Schema::dropIfExists('book_authors');
        Schema::dropIfExists('book_assets');
        Schema::dropIfExists('book_formats');
        Schema::dropIfExists('books');
        Schema::dropIfExists('categories');
    }
};
