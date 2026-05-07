<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_root_endpoint_is_available(): void
    {
        $this->get('/')->assertOk();
    }

    public function test_up_endpoint_is_available(): void
    {
        $this->get('/up')->assertOk();
    }
}
