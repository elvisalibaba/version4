<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            $table->dropForeign(['author_id']);
        });

        Schema::table('books', function (Blueprint $table): void {
            $table->uuid('author_id')->nullable()->change();
        });

        Schema::table('books', function (Blueprint $table): void {
            $table->foreign('author_id')->references('id')->on('author_profiles')->nullOnDelete();

            $table->string('authorship_type', 30)->default('named')->after('author_id')->index();
            $table->string('author_credit')->nullable()->after('authorship_type');

            $table->string('editorial_pole', 30)->default('general')->after('tags')->index();
            $table->string('work_type', 40)->default('book')->after('editorial_pole')->index();
            $table->string('editorial_stage', 40)->default('intake')->after('work_type')->index();

            $table->json('spiritual_metadata')->nullable()->after('editorial_stage');
            $table->json('ingestion_metadata')->nullable()->after('spiritual_metadata');

            $table->string('cover_source', 30)->nullable()->after('cover_url');

            $table->string('bat_status', 20)->default('pending')->after('review_note')->index();
            $table->timestamp('bat_approved_at')->nullable()->after('bat_status');
            $table->foreignUuid('bat_approved_by')->nullable()->after('bat_approved_at')->constrained('profiles')->nullOnDelete();
        });

        Schema::create('book_editorial_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('actor_id')->nullable()->constrained('profiles')->nullOnDelete();
            $table->string('event_type', 40)->index();
            $table->string('from_stage', 40)->nullable();
            $table->string('to_stage', 40)->nullable()->index();
            $table->text('notes')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['book_id', 'created_at']);
        });

        $spiritualityParentId = DB::table('categories')
            ->where('slug', 'spiritualite-religion')
            ->value('id');

        $spiritualCategories = [
            ['Bible & Études bibliques', 'bible-etudes-bibliques'],
            ['Théologie', 'theologie'],
            ['Dévotion & Méditation', 'devotion-meditation'],
            ['Prière & Vie spirituelle', 'priere-vie-spirituelle'],
            ['Prédication & Ministère', 'predication-ministere'],
            ['Leadership chrétien', 'leadership-chretien'],
            ['Église & Ministères', 'eglise-ministeres'],
        ];

        foreach ($spiritualCategories as $index => [$name, $slug]) {
            if (! DB::table('categories')->where('slug', $slug)->exists()) {
                DB::table('categories')->insert([
                    'id' => (string) Str::uuid(),
                    'name' => $name,
                    'slug' => $slug,
                    'parent_id' => $spiritualityParentId,
                    'description' => 'Catégorie du pôle ecclésial / édition spirituelle Holistique Books.',
                    'sort_order' => 200 + $index,
                    'is_active' => true,
                    'is_featured' => false,
                    'content_types' => json_encode(['ebook', 'audiobook', 'video']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('categories')->whereIn('slug', [
            'bible-etudes-bibliques',
            'theologie',
            'devotion-meditation',
            'priere-vie-spirituelle',
            'predication-ministere',
            'leadership-chretien',
            'eglise-ministeres',
        ])->delete();

        Schema::dropIfExists('book_editorial_events');

        Schema::table('books', function (Blueprint $table): void {
            $table->dropForeign(['bat_approved_by']);
            $table->dropForeign(['author_id']);
            $table->dropColumn([
                'authorship_type',
                'author_credit',
                'editorial_pole',
                'work_type',
                'editorial_stage',
                'spiritual_metadata',
                'ingestion_metadata',
                'cover_source',
                'bat_status',
                'bat_approved_at',
                'bat_approved_by',
            ]);
        });

        $fallbackAuthorId = DB::table('author_profiles')
            ->where('display_name', 'Auteur non attribué')
            ->value('id');

        if (! $fallbackAuthorId && DB::table('books')->whereNull('author_id')->exists()) {
            $fallbackAuthorId = (string) Str::uuid();

            DB::table('author_profiles')->insert([
                'id' => $fallbackAuthorId,
                'display_name' => 'Auteur non attribué',
                'social_links' => json_encode([]),
                'genres' => json_encode([]),
                'press_mentions' => json_encode([]),
                'catalog_origin' => 'migration_fallback',
                'rights_status' => 'unknown',
                'is_reference_profile' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if ($fallbackAuthorId) {
            DB::table('books')->whereNull('author_id')->update([
                'author_id' => $fallbackAuthorId,
            ]);
        }

        Schema::table('books', function (Blueprint $table): void {
            $table->uuid('author_id')->nullable(false)->change();
            $table->foreign('author_id')->references('id')->on('author_profiles')->cascadeOnDelete();
        });
    }
};
