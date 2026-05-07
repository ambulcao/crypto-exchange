<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;

class ProtectedEndpointTest extends TestCase
{
    public function test_guest_cannot_access_api_user_endpoint(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }
}
