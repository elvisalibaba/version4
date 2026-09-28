<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class HealthApiTest extends TestCase
{
    public function test_health_endpoint_is_public_and_returns_service_status(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertExactJson([
                'status' => 'ok',
                'service' => 'HolisticBooks API',
            ]);
    }
}
