<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class UserComplianceTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_table_has_accepted_terms_at_column(): void
    {
        $this->assertTrue(Schema::hasColumn('users', 'accepted_terms_at'));
    }

    public function test_user_factory_sets_accepted_terms_timestamp(): void
    {
        $user = User::factory()->create();

        $this->assertNotNull($user->accepted_terms_at);
    }
}
