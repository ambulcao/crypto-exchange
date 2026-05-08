<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TradeTest extends TestCase
{
    use RefreshDatabase;

    public function test_compra_sem_saldo_deve_falhar(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '100.00000000',
            'balance_btc' => '0.00000000',
        ]);

        Cache::put('btc_price', '250000.00000000', now()->addSeconds(10));
        Sanctum::actingAs($user);

        $this->postJson('/api/trade/buy', [
            'amount_brl' => '500.00000000',
        ])->assertStatus(422);
    }

    public function test_compra_com_saldo_deve_reduzir_brl_e_aumentar_btc(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '10000.00000000',
            'balance_btc' => '0.00000000',
        ]);

        Cache::put('btc_price', '250000.00000000', now()->addSeconds(10));
        Sanctum::actingAs($user);

        $this->postJson('/api/trade/buy', [
            'amount_brl' => '2500.00000000',
        ])->assertOk();

        $this->assertDatabaseHas('wallets', [
            'user_id' => $user->id,
            'balance_brl' => '7500.00000000',
            'balance_btc' => '0.01000000',
        ]);
    }
}
