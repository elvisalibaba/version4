<?php

namespace Tests\Feature;

use App\Filament\Resources\Categories\CategoryResource;
use App\Filament\Resources\MobileAppVersions\MobileAppVersionResource;
use App\Filament\Resources\Profiles\ProfileResource;
use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductionHardeningTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_author_revision_of_a_published_book_goes_to_review_without_replacing_the_live_file(): void
    {
        Storage::fake('books');
        [$user, $profile] = $this->author();

        $book = Book::factory()->create([
            'author_id' => $profile->id,
            'status' => 'published',
            'copyright_status' => 'clear',
            'file_url' => 'catalog/validated.pdf',
            'editorial_stage' => 'published',
        ]);

        Sanctum::actingAs($user);

        $this->post("/api/v1/books/{$book->id}", [
            'file' => UploadedFile::fake()->create('revision.pdf', 64, 'application/pdf'),
            'editorial_stage' => 'intake',
            'status' => 'published',
        ], ['Accept' => 'application/json'])->assertOk();

        $fresh = $book->fresh();

        $this->assertSame('catalog/validated.pdf', $fresh->file_url);
        $this->assertSame('published', $fresh->status);
        $this->assertSame('published', $fresh->editorial_stage);
        $this->assertSame('submitted', $fresh->review_status);
        $this->assertDatabaseHas('book_manuscript_versions', [
            'book_id' => $book->id,
            'status' => 'pending_review',
        ]);
    }

    public function test_author_cannot_change_cover_of_a_published_book(): void
    {
        Storage::fake('public');
        [$user, $profile] = $this->author();
        $book = Book::factory()->create(['author_id' => $profile->id, 'status' => 'published']);

        Sanctum::actingAs($user);

        $this->post("/api/v1/books/{$book->id}", [
            'cover' => UploadedFile::fake()->image('cover.jpg'),
        ], ['Accept' => 'application/json'])->assertStatus(422);
    }

    public function test_duplicate_order_lines_return_a_validation_error_instead_of_a_sql_error(): void
    {
        $user = User::factory()->create();
        Profile::factory()->create(['id' => $user->id, 'email' => $user->email, 'role' => 'reader']);
        $book = Book::factory()->create();

        Sanctum::actingAs($user);

        $line = ['book_id' => $book->id, 'book_format' => 'ebook'];

        $this->postJson('/api/v1/orders', ['items' => [$line, $line]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('items');
    }

    public function test_registration_does_not_issue_a_token_before_email_verification(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'email' => 'nouveau@example.com',
            'password' => 'Secret123',
            'password_confirmation' => 'Secret123',
            'role' => 'reader',
        ])->assertCreated()
            ->assertJsonMissingPath('token');
    }

    public function test_client_ip_is_only_trusted_with_the_shared_frontend_key(): void
    {
        config(['holistic.frontend_proxy_secret' => 'shared-secret']);
        Route::get('/api/test-client-ip', fn () => response()->json(['ip' => request()->ip()]))->middleware('api');

        $this->getJson('/api/test-client-ip', [
            'X-Holistique-Proxy-Key' => 'shared-secret',
            'X-Holistique-Client-Ip' => '203.0.113.7',
        ])->assertJsonPath('ip', '203.0.113.7');

        $this->getJson('/api/test-client-ip', [
            'X-Holistique-Proxy-Key' => 'wrong',
            'X-Holistique-Client-Ip' => '203.0.113.7',
        ])->assertJsonPath('ip', '127.0.0.1');
    }

    public function test_staff_without_permission_cannot_manage_unprotected_resources(): void
    {
        $support = $this->staff('support');
        $this->actingAs($support);

        $this->assertTrue(CategoryResource::canViewAny()); // catalog.view
        $this->assertFalse(CategoryResource::canCreate());
        $this->assertFalse(MobileAppVersionResource::canViewAny());

        $this->actingAs($this->staff('super_admin'));
        $this->assertTrue(CategoryResource::canCreate());
        $this->assertTrue(MobileAppVersionResource::canViewAny());
    }

    public function test_users_manager_cannot_edit_staff_accounts_or_grant_roles(): void
    {
        $manager = $this->staff('support', ['users.manage']);
        $this->actingAs($manager);

        $reader = Profile::factory()->create(['role' => 'reader']);
        $otherAdmin = Profile::factory()->admin()->create(['staff_role' => 'finance']);

        $this->assertTrue(ProfileResource::canEdit($reader));
        $this->assertFalse(ProfileResource::canEdit($otherAdmin));
        $this->assertFalse(ProfileResource::currentUserIsSuperAdmin());
    }

    public function test_make_admin_from_file_creates_a_verified_super_admin_and_deletes_the_file(): void
    {
        $path = storage_path('framework/testing/make-admin.txt');
        @mkdir(dirname($path), 0777, true);
        file_put_contents($path, "Boss@Example.com\nSuperSecret123\nDirection\n");

        $this->artisan('holistic:make-admin', ['--from-file' => $path])->assertSuccessful();

        $this->assertFileDoesNotExist($path);

        $user = User::query()->where('email', 'boss@example.com')->firstOrFail();
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue($user->profile->isSuperAdmin());
    }

    /**
     * @return array{0: User, 1: Profile}
     */
    private function author(): array
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->author()->create(['id' => $user->id, 'email' => $user->email]);

        AuthorProfile::query()->create([
            'id' => $profile->id,
            'display_name' => $profile->name,
            'social_links' => [],
            'genres' => [],
            'press_mentions' => [],
        ]);

        return [$user, $profile];
    }

    private function staff(string $staffRole, array $extraPermissions = []): User
    {
        $user = User::factory()->create();
        Profile::factory()->admin()->create([
            'id' => $user->id,
            'email' => $user->email,
            'staff_role' => $staffRole,
            'staff_permissions' => $extraPermissions,
        ]);

        return $user;
    }
}
