<?php

namespace Tests\Feature;

use App\Filament\Author\Resources\Books\Pages\CreateBook;
use App\Models\Profile;
use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Livewire\Livewire;
use Tests\TestCase;

class AuthorStudioBookTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_admin_without_author_profile_can_create_a_book_in_the_studio(): void
    {
        Storage::fake('books');
        Storage::fake('public');

        $admin = User::factory()->create();
        Profile::factory()->admin()->create([
            'id' => $admin->id,
            'email' => $admin->email,
            'name' => $admin->name,
        ]);

        $this->actingAs($admin);
        Filament::setCurrentPanel('studio');

        Livewire::test(CreateBook::class)
            ->fillForm([
                'title' => 'Livre du Studio',
                'description' => 'Description du livre.',
                'language' => 'fr',
                'categories' => ['Roman'],
                'tags' => ['Test'],
                'cover_url' => UploadedFile::fake()->image('cover.jpg'),
                'file_url' => UploadedFile::fake()->create('manuscrit.pdf', 100, 'application/pdf'),
                'price' => 10,
                'currency_code' => 'USD',
                'is_single_sale_enabled' => true,
                'is_subscription_available' => false,
            ])
            ->call('create')
            ->assertHasNoFormErrors();

        $this->assertDatabaseHas('author_profiles', [
            'id' => $admin->id,
            'display_name' => $admin->name,
        ]);
        $this->assertDatabaseHas('books', [
            'title' => 'Livre du Studio',
            'author_id' => $admin->id,
            'status' => 'draft',
        ]);
    }
}
