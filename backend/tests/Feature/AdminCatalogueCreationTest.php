<?php

namespace Tests\Feature;

use App\Filament\Resources\Authors\Pages\CreateAuthorProfile;
use App\Filament\Resources\Books\Pages\CreateBook;
use App\Models\AuthorProfile;
use App\Models\Profile;
use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Livewire\Livewire;
use Tests\TestCase;

class AdminCatalogueCreationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_admin_can_create_catalogue_author_without_user_account(): void
    {
        $admin = User::factory()->create();
        Profile::factory()->admin()->create([
            'id' => $admin->id,
            'email' => $admin->email,
            'name' => $admin->name,
        ]);

        $this->actingAs($admin);
        Filament::setCurrentPanel('admin');

        Livewire::test(CreateAuthorProfile::class)
            ->fillForm([
                'display_name' => 'Auteur Catalogue',
                'genres' => ['Roman'],
                'bio' => 'Auteur géré directement par la maison d’édition.',
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        $author = AuthorProfile::query()->where('display_name', 'Auteur Catalogue')->firstOrFail();

        $this->assertDatabaseMissing('profiles', ['id' => $author->id]);
    }

    public function test_admin_can_create_book_with_catalogue_author_and_cover(): void
    {
        Storage::fake('public');
        Storage::fake('books');

        $admin = User::factory()->create();
        Profile::factory()->admin()->create([
            'id' => $admin->id,
            'email' => $admin->email,
            'name' => $admin->name,
        ]);

        $author = AuthorProfile::query()->create([
            'display_name' => 'Auteur Maison',
        ]);

        $this->actingAs($admin);
        Filament::setCurrentPanel('admin');

        Livewire::test(CreateBook::class)
            ->fillForm([
                'title' => 'Livre Maison',
                'author_id' => $author->id,
                'cover_url' => UploadedFile::fake()->image('cover.jpg'),
                'price' => 12,
                'currency_code' => 'USD',
                'status' => 'draft',
                'review_status' => 'draft',
                'copyright_status' => 'review',
                'is_single_sale_enabled' => true,
                'is_subscription_available' => false,
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        $this->assertDatabaseHas('books', [
            'title' => 'Livre Maison',
            'author_id' => $author->id,
            'author_display_name' => 'Auteur Maison',
        ]);

        $book = \App\Models\Book::query()->where('title', 'Livre Maison')->firstOrFail();

        $this->assertSame([], $book->co_authors);
        $this->assertSame([], $book->categories);
        $this->assertSame([], $book->tags);
        $this->assertNotNull($book->cover_url);
        Storage::disk('public')->assertExists($book->cover_url);
    }
}
