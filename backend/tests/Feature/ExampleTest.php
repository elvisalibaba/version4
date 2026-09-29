<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_backend_root_displays_the_publishing_portal(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertSee('HolisticBooks Publishing Platform')
            ->assertSee('Author Studio')
            ->assertSee('Control Center');
    }
}
