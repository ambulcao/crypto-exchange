<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_requires_accepted_terms(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'accepted_terms' => false,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('accepted_terms');
    }

    public function test_register_creates_user_wallet_and_token(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'accepted_terms' => true,
        ]);

        $response->assertCreated()->assertJsonStructure([
            'token',
            'token_type',
            'user' => ['id', 'name', 'email', 'accepted_terms_at'],
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'alice@example.com',
        ]);

        $this->assertDatabaseHas('wallets', [
            'balance_brl' => '10000.00000000',
            'balance_btc' => '0.00000000',
        ]);
    }

    public function test_login_returns_token_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'alice@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertOk()->assertJsonStructure([
            'token',
            'token_type',
            'user' => ['id', 'name', 'email'],
        ]);
    }

    public function test_login_rejects_unknown_or_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'alice@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'naoexiste@example.com',
            'password' => 'qualquersenha',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Usuario inexistente, faca seu registro.')
            ->assertJsonValidationErrors('email');
    }

    public function test_login_rejects_wrong_password_for_existing_user(): void
    {
        User::factory()->create([
            'email' => 'alice@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'alice@example.com',
            'password' => 'senhaerrada',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Credenciais invalidas.')
            ->assertJsonValidationErrors('password');
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/me');

        $response->assertOk()->assertJson([
            'id' => $user->id,
            'email' => $user->email,
        ]);
    }
}
