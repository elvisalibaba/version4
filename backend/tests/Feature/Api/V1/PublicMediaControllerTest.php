<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicMediaControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_public_cover_can_be_served_without_storage_symlink(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('covers/test-cover.jpg', 'fake-image');

        $this->get('/api/v1/media/covers/test-cover.jpg')
            ->assertOk()
            ->assertHeader('cache-control');
    }

    public function test_path_traversal_is_rejected(): void
    {
        Storage::fake('public');

        $this->get('/api/v1/media/../.env')->assertNotFound();
    }
}
