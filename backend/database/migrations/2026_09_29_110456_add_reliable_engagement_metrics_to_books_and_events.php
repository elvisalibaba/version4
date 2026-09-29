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
        Schema::table('books', function (Blueprint $table) {
            $table->unsignedBigInteger('clicks_count')->default(0)->after('views_count');
        });

        Schema::table('book_engagement_events', function (Blueprint $table) {
            $table->string('event_type', 32)->change();
            $table->string('deduplication_key', 64)->nullable()->unique();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('book_engagement_events', function (Blueprint $table) {
            $table->dropColumn('deduplication_key');
        });

        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn('clicks_count');
        });
    }
};
