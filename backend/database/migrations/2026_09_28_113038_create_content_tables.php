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
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('excerpt');
            $table->string('tag');
            $table->string('author');
            $table->string('read_time');
            $table->string('cover_label')->default('Magazine editorial');
            $table->string('cover_image_url')->nullable();
            $table->string('cover_image_alt')->nullable();
            $table->date('published_at');
            $table->json('content_blocks');
            $table->timestamps();
        });

        Schema::create('flash_sale_configs', function (Blueprint $table) {
            $table->string('scope')->primary()->default('global');
            $table->json('selected_book_ids');
            $table->unsignedTinyInteger('discount_percentage')->default(20);
            $table->timestamp('updated_at')->useCurrent();
        });

        Schema::create('home_featured_configs', function (Blueprint $table) {
            $table->string('scope')->primary()->default('global');
            $table->json('selected_book_ids');
            $table->timestamp('updated_at')->useCurrent();
        });

        Schema::create('editorial_training_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('profiles')->nullOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->index();
            $table->string('phone', 50)->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('organization_name')->nullable();
            $table->enum('profile_type', ['author', 'aspiring_editor', 'publisher', 'entrepreneur', 'student', 'other']);
            $table->enum('experience_level', ['beginner', 'intermediate', 'advanced']);
            $table->enum('project_stage', ['idea', 'drafting', 'manuscript_ready', 'existing_catalog']);
            $table->enum('preferred_format', ['online', 'onsite', 'hybrid']);
            $table->text('objectives');
            $table->text('message')->nullable();
            $table->boolean('consent_to_contact')->default(true);
            $table->string('source')->default('formation-editoriale');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('editorial_training_requests');
        Schema::dropIfExists('home_featured_configs');
        Schema::dropIfExists('flash_sale_configs');
        Schema::dropIfExists('blog_posts');
    }
};
