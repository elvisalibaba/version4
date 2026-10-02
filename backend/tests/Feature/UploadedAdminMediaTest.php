<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\Book;
use App\Models\MediaEdition;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UploadedAdminMediaTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_uploaded_profile_avatar_is_exposed_as_public_media_url(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['email_verified_at' => now()]);
        Profile::factory()->create([
            'id' => $user->id,
            'email' => $user->email,
            'role' => 'admin',
            'avatar_url' => 'avatars/profiles/admin.webp',
        ]);

        Storage::disk('public')->put('avatars/profiles/admin.webp', 'image');

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath(
                'data.profile.avatar_url',
                Storage::disk('public')->url('avatars/profiles/admin.webp'),
            );
    }

    public function test_blog_uploaded_images_are_resolved_to_public_urls(): void
    {
        Storage::fake('public');

        Storage::disk('public')->put('blog/covers/article.webp', 'cover');
        Storage::disk('public')->put('blog/content/inside.webp', 'inside');

        BlogPost::query()->create([
            'slug' => 'article-upload',
            'title' => 'Article Upload',
            'excerpt' => 'Résumé',
            'tag' => 'Culture',
            'author' => 'HolisticBooks',
            'read_time' => '5 min',
            'cover_label' => 'Magazine',
            'cover_image_url' => 'blog/covers/article.webp',
            'cover_image_alt' => 'Couverture',
            'published_at' => now()->toDateString(),
            'content_blocks' => [
                [
                    'type' => 'image',
                    'url' => 'blog/content/inside.webp',
                    'alt' => 'Illustration',
                    'caption' => 'Légende',
                ],
            ],
        ]);

        $this->getJson('/api/v1/blog/article-upload')
            ->assertOk()
            ->assertJsonPath(
                'data.cover_image_url',
                Storage::disk('public')->url('blog/covers/article.webp'),
            )
            ->assertJsonPath(
                'data.content_blocks.0.url',
                Storage::disk('public')->url('blog/content/inside.webp'),
            );
    }

    public function test_uploaded_media_preview_is_exposed_through_signed_stream(): void
    {
        Storage::fake('books');

        $book = Book::factory()->create([
            'status' => 'published',
            'copyright_status' => 'clear',
        ]);

        $edition = MediaEdition::query()->create([
            'book_id' => $book->id,
            'media_type' => 'audiobook',
            'title' => 'Édition audio',
            'language' => 'fr',
            'preview_url' => 'media/previews/extrait.mp3',
            'status' => 'published',
            'published_at' => now(),
        ]);

        Storage::disk('books')->put('media/previews/extrait.mp3', 'audio-bytes');

        $this->getJson("/api/v1/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('data.media_editions.0.id', $edition->id)
            ->assertJsonPath('data.media_editions.0.preview_url', fn ($value) =>
                is_string($value)
                && str_contains($value, "/api/v1/media-editions/{$edition->id}/preview")
                && str_contains($value, 'signature=')
            );

        $signedUrl = URL::temporarySignedRoute(
            'api.v1.media-editions.preview',
            now()->addMinutes(5),
            ['mediaEdition' => $edition->id],
        );

        $this->get($signedUrl)
            ->assertOk()
            ->assertStreamed()
            ->assertHeader('Accept-Ranges', 'bytes');
    }
}
