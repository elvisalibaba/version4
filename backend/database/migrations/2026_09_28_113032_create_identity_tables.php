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
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email')->unique();
            $table->string('name')->nullable();
            $table->enum('role', ['reader', 'author', 'admin'])->default('reader')->index();
            $table->timestampTz('created_at')->useCurrent();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('preferred_language', 10)->default('fr');
            $table->json('favorite_categories');
            $table->boolean('marketing_opt_in')->default(false);
            $table->foreignUuid('referred_by_affiliate_user_id')->nullable()->constrained('profiles')->nullOnDelete();
            $table->string('referred_by_affiliate_code')->nullable()->index();
            $table->enum('affiliate_source_type', ['book', 'plan'])->nullable();
            $table->uuid('affiliate_source_book_id')->nullable()->index();
            $table->uuid('affiliate_source_plan_id')->nullable()->index();

            $table->foreign('id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('author_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('display_name')->index();
            $table->string('avatar_url')->nullable();
            $table->text('bio')->nullable();
            $table->string('website')->nullable();
            $table->string('location')->nullable();
            $table->json('social_links');
            $table->string('professional_headline')->nullable();
            $table->string('phone', 50)->nullable();
            $table->json('genres');
            $table->text('publishing_goals')->nullable();
            $table->string('favorite_book')->nullable();
            $table->string('favorite_author')->nullable();
            $table->string('favorite_character')->nullable();
            $table->json('press_mentions');
            $table->timestamps();

            $table->foreign('id')->references('id')->on('profiles')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('author_profiles');
        Schema::dropIfExists('profiles');
    }
};
