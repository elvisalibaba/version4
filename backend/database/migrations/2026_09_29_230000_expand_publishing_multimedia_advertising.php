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
        Schema::table('categories', function (Blueprint $table): void {
            $table->foreignUuid('parent_id')->nullable()->after('slug')->constrained('categories')->nullOnDelete();
            $table->text('description')->nullable()->after('parent_id');
            $table->string('icon', 80)->nullable()->after('description');
            $table->string('color', 20)->nullable()->after('icon');
            $table->unsignedInteger('sort_order')->default(0)->after('color');
            $table->boolean('is_active')->default(true)->after('sort_order')->index();
            $table->boolean('is_featured')->default(false)->after('is_active')->index();
            $table->json('content_types')->nullable()->after('is_featured');
        });

        Schema::table('author_profiles', function (Blueprint $table): void {
            $table->string('country_code', 2)->nullable()->after('location')->index();
            $table->string('catalog_origin', 30)->default('platform')->after('country_code')->index();
            $table->string('rights_status', 30)->default('unknown')->after('catalog_origin')->index();
            $table->boolean('is_reference_profile')->default(false)->after('rights_status')->index();
            $table->string('reference_source_url', 2048)->nullable()->after('is_reference_profile');
            $table->text('rights_notes')->nullable()->after('reference_source_url');
        });

        Schema::create('publishing_houses', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name')->index();
            $table->string('legal_name')->nullable();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('status', 30)->default('active')->index();
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('website', 2048)->nullable();
            $table->string('country_code', 2)->nullable()->index();
            $table->string('city')->nullable();
            $table->text('address')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('primary_currency', 3)->default('USD');
            $table->json('brand_settings')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('publishing_imprints', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('publishing_house_id')->constrained()->cascadeOnDelete();
            $table->string('name')->index();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('logo_url')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('publishing_house_members', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('publishing_house_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('profile_id')->constrained('profiles')->cascadeOnDelete();
            $table->string('role', 40)->default('editor')->index();
            $table->string('title')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();
            $table->unique(['publishing_house_id', 'profile_id']);
        });

        Schema::table('books', function (Blueprint $table): void {
            $table->foreignUuid('publishing_house_id')->nullable()->after('publisher')->constrained()->nullOnDelete();
            $table->foreignUuid('imprint_id')->nullable()->after('publishing_house_id')->constrained('publishing_imprints')->nullOnDelete();
        });

        Schema::create('rights_contracts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('book_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignUuid('publishing_house_id')->nullable()->constrained()->nullOnDelete();
            $table->string('contract_number')->nullable()->unique();
            $table->string('rights_holder_name');
            $table->string('licensor_name')->nullable();
            $table->string('status', 30)->default('draft')->index();
            $table->json('territories')->nullable();
            $table->json('languages')->nullable();
            $table->json('permitted_media')->nullable();
            $table->boolean('exclusive')->default(false);
            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable()->index();
            $table->json('royalty_terms')->nullable();
            $table->string('proof_path')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('profiles')->nullOnDelete();
            $table->timestamps();

            $table->index(['book_id', 'status']);
        });

        Schema::create('media_editions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->string('media_type', 30)->index();
            $table->string('title')->nullable();
            $table->string('language', 10)->default('fr')->index();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->string('narrator')->nullable();
            $table->string('presenter')->nullable();
            $table->string('provider')->nullable();
            $table->string('storage_path')->nullable();
            $table->string('streaming_url', 2048)->nullable();
            $table->string('preview_url', 2048)->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size_bytes')->nullable();
            $table->string('drm_scheme', 50)->default('none');
            $table->json('metadata')->nullable();
            $table->string('status', 30)->default('draft')->index();
            $table->timestamp('published_at')->nullable()->index();
            $table->timestamps();

            $table->index(['book_id', 'media_type', 'status']);
        });

        Schema::create('media_chapters', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('media_edition_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position')->default(1);
            $table->string('title');
            $table->unsignedInteger('starts_at_second')->nullable();
            $table->unsignedInteger('ends_at_second')->nullable();
            $table->string('storage_path')->nullable();
            $table->string('streaming_url', 2048)->nullable();
            $table->boolean('is_preview')->default(false);
            $table->timestamps();

            $table->unique(['media_edition_id', 'position']);
        });

        Schema::create('ad_campaigns', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('advertiser_name');
            $table->string('advertiser_email')->nullable();
            $table->string('name');
            $table->string('objective', 40)->default('awareness');
            $table->string('status', 30)->default('draft')->index();
            $table->json('channels')->nullable();
            $table->decimal('budget', 14, 2)->default(0);
            $table->decimal('spent', 14, 2)->default(0);
            $table->string('currency_code', 3)->default('USD');
            $table->timestamp('starts_at')->nullable()->index();
            $table->timestamp('ends_at')->nullable()->index();
            $table->json('targeting')->nullable();
            $table->unsignedInteger('frequency_cap')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('ad_placements', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('channel', 20)->default('web')->index();
            $table->string('surface')->index();
            $table->string('position')->nullable();
            $table->json('allowed_creative_types')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('ad_creatives', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('campaign_id')->constrained('ad_campaigns')->cascadeOnDelete();
            $table->string('title');
            $table->string('creative_type', 30)->default('banner')->index();
            $table->string('headline')->nullable();
            $table->text('body')->nullable();
            $table->string('asset_url', 2048)->nullable();
            $table->string('click_url', 2048)->nullable();
            $table->string('cta_label')->nullable();
            $table->string('alt_text')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        Schema::create('ad_assignments', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('campaign_id')->constrained('ad_campaigns')->cascadeOnDelete();
            $table->foreignUuid('creative_id')->constrained('ad_creatives')->cascadeOnDelete();
            $table->foreignUuid('placement_id')->constrained('ad_placements')->cascadeOnDelete();
            $table->string('status', 30)->default('active')->index();
            $table->unsignedInteger('weight')->default(100);
            $table->timestamp('starts_at')->nullable()->index();
            $table->timestamp('ends_at')->nullable()->index();
            $table->timestamps();

            $table->unique(['creative_id', 'placement_id']);
        });

        Schema::create('ad_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('assignment_id')->nullable()->constrained('ad_assignments')->nullOnDelete();
            $table->string('event_type', 20)->index();
            $table->foreignUuid('user_id')->nullable()->constrained('profiles')->nullOnDelete();
            $table->string('session_hash', 64)->nullable()->index();
            $table->json('context')->nullable();
            $table->timestamp('occurred_at')->useCurrent()->index();
            $table->timestamps();

            $table->index(['assignment_id', 'event_type', 'occurred_at']);
        });

        $categories = [
            ['Littérature africaine', 'litterature-africaine'],
            ['Littérature congolaise', 'litterature-congolaise'],
            ['Roman', 'roman'],
            ['Romance', 'romance'],
            ['Thriller & Suspense', 'thriller-suspense'],
            ['Policier', 'policier'],
            ['Science-fiction', 'science-fiction'],
            ['Fantasy', 'fantasy'],
            ['Poésie', 'poesie'],
            ['Bande dessinée & Manga', 'bande-dessinee-manga'],
            ['Jeunesse', 'jeunesse'],
            ['Young Adult', 'young-adult'],
            ['Biographie & Mémoires', 'biographie-memoires'],
            ['Histoire', 'histoire'],
            ['Politique & Société', 'politique-societe'],
            ['Business & Entrepreneuriat', 'business-entrepreneuriat'],
            ['Finance & Investissement', 'finance-investissement'],
            ['Développement personnel', 'developpement-personnel'],
            ['Leadership & Management', 'leadership-management'],
            ['Économie', 'economie'],
            ['Technologie & Intelligence artificielle', 'technologie-intelligence-artificielle'],
            ['Science', 'science'],
            ['Santé & Bien-être', 'sante-bien-etre'],
            ['Psychologie', 'psychologie'],
            ['Spiritualité & Religion', 'spiritualite-religion'],
            ['Éducation & Formation', 'education-formation'],
            ['Cuisine & Gastronomie', 'cuisine-gastronomie'],
            ['Voyage & Culture', 'voyage-culture'],
            ['Art & Design', 'art-design'],
            ['Droit & Administration', 'droit-administration'],
        ];

        foreach ($categories as $index => [$name, $slug]) {
            DB::table('categories')->insertOrIgnore([
                'id' => (string) Str::uuid(),
                'name' => $name,
                'slug' => $slug,
                'description' => 'Catégorie éditoriale Holistique Books.',
                'sort_order' => $index + 1,
                'is_active' => true,
                'is_featured' => $index < 8,
                'content_types' => json_encode(['ebook', 'audiobook', 'video']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $referenceAuthors = [
            ['Robert Kiyosaki', 'US', ['Finance', 'Entrepreneuriat'], 'https://richdad.com/about/robert-kiyosaki/'],
            ['Paulo Coelho', 'BR', ['Roman', 'Spiritualité'], null],
            ['Chimamanda Ngozi Adichie', 'NG', ['Roman', 'Essai'], null],
            ['Stephen King', 'US', ['Thriller', 'Horreur'], null],
            ['J. K. Rowling', 'GB', ['Fantasy', 'Jeunesse'], null],
            ['James Patterson', 'US', ['Thriller', 'Policier'], null],
            ['Dan Brown', 'US', ['Thriller', 'Mystère'], null],
            ['Margaret Atwood', 'CA', ['Roman', 'Science-fiction'], null],
            ['Yuval Noah Harari', 'IL', ['Histoire', 'Essai'], null],
            ['Khaled Hosseini', 'US', ['Roman', 'Littérature'], null],
        ];

        foreach ($referenceAuthors as [$name, $country, $genres, $source]) {
            if (! DB::table('author_profiles')->where('display_name', $name)->exists()) {
                DB::table('author_profiles')->insert([
                    'id' => (string) Str::uuid(),
                    'display_name' => $name,
                    'social_links' => json_encode([]),
                    'genres' => json_encode($genres),
                    'press_mentions' => json_encode([]),
                    'country_code' => $country,
                    'catalog_origin' => 'international_reference',
                    'rights_status' => 'not_acquired',
                    'is_reference_profile' => true,
                    'reference_source_url' => $source,
                    'rights_notes' => 'Référence de prospection éditoriale. Aucun droit de publication, distribution, audio ou vidéo n’est présumé acquis.',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $houseId = (string) Str::uuid();
        DB::table('publishing_houses')->insertOrIgnore([
            'id' => $houseId,
            'name' => 'Holistique Books',
            'legal_name' => 'Holistique Books',
            'slug' => 'holistique-books',
            'description' => 'Maison d’édition et plateforme de lecture numérique.',
            'status' => 'active',
            'country_code' => 'CD',
            'city' => 'Kinshasa',
            'primary_currency' => 'USD',
            'brand_settings' => json_encode([
                'primary' => '#173d2c',
                'accent' => '#e8ac42',
            ]),
            'metadata' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $placements = [
            ['web.home.hero', 'Accueil — Hero', 'web', 'home', 'hero', ['banner', 'image', 'native'], 1200, 360],
            ['web.home.feed', 'Accueil — Flux', 'web', 'home', 'feed', ['banner', 'native'], 1200, 300],
            ['web.book.detail', 'Fiche livre', 'web', 'book_detail', 'sidebar', ['banner', 'native'], 600, 600],
            ['web.reader.dashboard', 'Dashboard lecteur', 'web', 'reader_dashboard', 'inline', ['banner', 'native'], 1200, 240],
            ['mobile.home.banner', 'Mobile — Accueil', 'mobile', 'home', 'banner', ['banner', 'image'], 1080, 420],
            ['mobile.library.native', 'Mobile — Bibliothèque', 'mobile', 'library', 'native', ['native', 'image'], 1080, 420],
            ['mobile.reader.interstitial', 'Mobile — Interstitiel lecteur', 'mobile', 'reader', 'interstitial', ['image', 'video'], 1080, 1920],
        ];

        foreach ($placements as [$code, $name, $channel, $surface, $position, $types, $width, $height]) {
            DB::table('ad_placements')->insertOrIgnore([
                'id' => (string) Str::uuid(),
                'code' => $code,
                'name' => $name,
                'channel' => $channel,
                'surface' => $surface,
                'position' => $position,
                'allowed_creative_types' => json_encode($types),
                'width' => $width,
                'height' => $height,
                'is_active' => true,
                'metadata' => json_encode([]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_events');
        Schema::dropIfExists('ad_assignments');
        Schema::dropIfExists('ad_creatives');
        Schema::dropIfExists('ad_placements');
        Schema::dropIfExists('ad_campaigns');
        Schema::dropIfExists('media_chapters');
        Schema::dropIfExists('media_editions');
        Schema::dropIfExists('rights_contracts');

        Schema::table('books', function (Blueprint $table): void {
            $table->dropForeign(['imprint_id']);
            $table->dropForeign(['publishing_house_id']);
            $table->dropColumn(['imprint_id', 'publishing_house_id']);
        });

        Schema::dropIfExists('publishing_house_members');
        Schema::dropIfExists('publishing_imprints');
        Schema::dropIfExists('publishing_houses');

        Schema::table('author_profiles', function (Blueprint $table): void {
            $table->dropColumn([
                'country_code', 'catalog_origin', 'rights_status', 'is_reference_profile',
                'reference_source_url', 'rights_notes',
            ]);
        });

        Schema::table('categories', function (Blueprint $table): void {
            $table->dropForeign(['parent_id']);
            $table->dropColumn([
                'parent_id', 'description', 'icon', 'color', 'sort_order',
                'is_active', 'is_featured', 'content_types',
            ]);
        });
    }
};
