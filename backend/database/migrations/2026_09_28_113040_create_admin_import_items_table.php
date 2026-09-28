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
        Schema::create('admin_book_import_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('batch_id')->constrained('admin_book_import_batches')->cascadeOnDelete();
            $table->uuid('item_id')->index();
            $table->foreignUuid('created_by')->constrained('profiles')->cascadeOnDelete();
            $table->string('source_checksum_sha256', 64)->index();
            $table->string('source_file_name');
            $table->unsignedBigInteger('source_file_size_bytes');
            $table->string('source_storage_path');
            $table->string('cover_storage_path');
            $table->enum('status', ['prepared', 'processing', 'completed', 'failed'])->default('prepared');
            $table->unsignedInteger('attempt_count')->default(1);
            $table->boolean('rights_confirmed')->default(false);
            $table->foreignUuid('book_id')->nullable()->constrained('books')->nullOnDelete();
            $table->text('error_message')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['batch_id', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_book_import_items');
    }
};
