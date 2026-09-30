<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ratings', function (Blueprint $table): void {
            $table->text('review_text')->nullable()->after('rating');
            $table->unsignedInteger('helpful_count')->default(0)->after('review_text');
            $table->boolean('is_hidden')->default(false)->after('helpful_count')->index();
            $table->timestamp('hidden_at')->nullable()->after('is_hidden');
            $table->foreignUuid('hidden_by')->nullable()->after('hidden_at')->constrained('profiles')->nullOnDelete();
            $table->text('moderation_note')->nullable()->after('hidden_by');

            $table->index(
                ['book_id', 'is_hidden', 'created_at'],
                'ratings_book_visibility_created_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::table('ratings', function (Blueprint $table): void {
            $table->dropIndex('ratings_book_visibility_created_idx');
            $table->dropIndex('ratings_is_hidden_index');
            $table->dropForeign(['hidden_by']);
            $table->dropColumn([
                'review_text',
                'helpful_count',
                'is_hidden',
                'hidden_at',
                'hidden_by',
                'moderation_note',
            ]);
        });
    }
};
