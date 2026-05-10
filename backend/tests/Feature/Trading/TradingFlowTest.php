<?php

namespace Tests\Feature\Trading;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TradingFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        Http::fake([
            'api.coingecko.com/*' => Http::response(['bitcoin' => ['brl' => 250_000]], 200),
        ]);
    }

    public function test_can_get_wallet_balance(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '10000.00000000',
            'balance_btc' => '0.00000000',
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/wallet')
            ->assertOk()
            ->assertJson([
                'balance_brl' => '10000.00000000',
                'balance_btc' => '0.00000000',
            ]);
    }

    public function test_market_endpoint_returns_price_from_coingecko(): void
    {
        Cache::flush();
        Http::fake([
            'api.coingecko.com/*' => Http::response(['bitcoin' => ['brl' => 398_123.45]], 200),
        ]);

        $response = $this->getJson('/api/market/btc')
            ->assertOk()
            ->json();

        $this->assertSame('398123.45000000', $response['price']);
        $this->assertSame('BTCBRL', $response['symbol']);
    }

    public function test_buy_fails_when_brl_balance_is_insufficient(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '100.00000000',
            'balance_btc' => '0.00000000',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/trade/buy', [
            'amount_brl' => '1000.00000000',
        ])->assertStatus(422);
    }

    public function test_buy_updates_wallet_and_creates_transaction(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '10000.00000000',
            'balance_btc' => '0.00000000',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/trade/buy', [
            'amount_brl' => '2500.00000000',
        ])->assertOk();

        $this->assertDatabaseHas('wallets', [
            'user_id' => $user->id,
            'balance_brl' => '7500.00000000',
            'balance_btc' => '0.01000000',
        ]);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'type' => 'buy',
            'amount_brl' => '2500.00000000',
            'amount_btc' => '0.01000000',
            'btc_price' => '250000.00000000',
        ]);
    }

    public function test_sell_updates_wallet_and_creates_transaction(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '5000.00000000',
            'balance_btc' => '0.02000000',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/trade/sell', [
            'amount_btc' => '0.01000000',
        ])->assertOk();

        $this->assertDatabaseHas('wallets', [
            'user_id' => $user->id,
            'balance_brl' => '7500.00000000',
            'balance_btc' => '0.01000000',
        ]);

        $this->assertDatabaseHas('transactions', [
            'user_id' => $user->id,
            'type' => 'sell',
            'amount_brl' => '2500.00000000',
            'amount_btc' => '0.01000000',
            'btc_price' => '250000.00000000',
        ]);
    }

    public function test_sell_fails_when_btc_balance_is_insufficient(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '10000.00000000',
            'balance_btc' => '0.00100000',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/trade/sell', [
            'amount_btc' => '0.01000000',
        ])->assertStatus(422);
    }

    public function test_transactions_endpoint_lists_user_history(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '10000.00000000',
            'balance_btc' => '0.00000000',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/trade/buy', [
            'amount_brl' => '2500.00000000',
        ])->assertOk();

        $this->getJson('/api/transactions')
            ->assertOk()
            ->assertJsonFragment([
                'type' => 'buy',
                'amount_brl' => '2500.00000000',
            ]);
    }
}
