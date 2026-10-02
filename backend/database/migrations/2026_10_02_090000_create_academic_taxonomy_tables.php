<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_taxonomies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('parent_id')->nullable()->constrained('academic_taxonomies')->nullOnDelete();
            $table->string('audience', 24)->index();
            $table->string('kind', 32)->index();
            $table->string('code', 80)->nullable()->unique();
            $table->string('name')->index();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('is_official')->default(false)->index();
            $table->string('source_url', 1000)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['audience', 'kind', 'is_active']);
            $table->index(['parent_id', 'sort_order']);
        });

        Schema::create('book_academic_taxonomy', function (Blueprint $table) {
            $table->foreignUuid('book_id')->constrained('books')->cascadeOnDelete();
            $table->foreignUuid('academic_taxonomy_id')->constrained('academic_taxonomies')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['book_id', 'academic_taxonomy_id']);
            $table->index(['academic_taxonomy_id', 'book_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_academic_taxonomy');
        Schema::dropIfExists('academic_taxonomies');
    }
};
