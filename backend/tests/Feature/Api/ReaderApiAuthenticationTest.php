<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Str;
use Tests\TestCase;

class ReaderApiAuthenticationTest extends TestCase
{
    public function test_reader_progress_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/books/'.Str::uuid().'/progress')
            ->assertUnauthorized();
    }

    public function test_highlights_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/books/'.Str::uuid().'/highlights')
            ->assertUnauthorized();
    }
}
