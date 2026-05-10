<?php

namespace Tests\Feature;

use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Integracao HTTP: POST /api/trade/buy passa pelo {@see \App\Http\Controllers\TradeController}
 * e delega ao {@see \App\Services\TradeService}.
 *
 * Garante que compra sem saldo BRL suficiente falha e que a atomicidade da transacao de banco
 * nao deixa wallet nem historico alterados quando a regra de negocio rejeita a operacao.
 */
class TradeTest extends TestCase
{
    use RefreshDatabase;

    private const BTC_PRICE = '250000.00000000';

    public function test_cenario_a_compra_sem_saldo_brl_retorna_422_e_nao_altera_wallet_nem_cria_transacao(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '100.00000000',
            'balance_btc' => '0.00000000',
        ]);

        Cache::put('btc_price', self::BTC_PRICE, now()->addMinute());
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/trade/buy', [
            'amount_brl' => '500.00000000',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['amount_brl']);

        $this->assertDatabaseHas('wallets', [
            'user_id' => $user->id,
            'balance_brl' => '100.00000000',
            'balance_btc' => '0.00000000',
        ]);
        $this->assertSame(0, Transaction::query()->where('user_id', $user->id)->count());
    }

    public function test_cenario_b_compra_com_sucesso_atualiza_wallet_e_cria_transacao(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '10000.00000000',
            'balance_btc' => '0.00000000',
        ]);

        Cache::put('btc_price', self::BTC_PRICE, now()->addMinute());
        Sanctum::actingAs($user);

        $this->postJson('/api/trade/buy', [
            'amount_brl' => '2500.00000000',
        ])->assertOk();

        // Commit unico: saldos e linha em transactions devem estar coerentes apos sucesso.
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
            'btc_price' => self::BTC_PRICE,
        ]);
    }

    public function test_cenario_c_segunda_compra_rapida_falha_apos_primeira_consumir_saldo(): void
    {
        $user = User::factory()->create();
        Wallet::create([
            'user_id' => $user->id,
            'balance_brl' => '1000.00000000',
            'balance_btc' => '0.00000000',
        ]);

        Cache::put('btc_price', self::BTC_PRICE, now()->addMinute());
        Sanctum::actingAs($user);

        $this->postJson('/api/trade/buy', [
            'amount_brl' => '600.00000000',
        ])->assertOk();

        $this->postJson('/api/trade/buy', [
            'amount_brl' => '600.00000000',
        ])->assertStatus(422)->assertJsonValidationErrors(['amount_brl']);

        $this->assertDatabaseHas('wallets', [
            'user_id' => $user->id,
            'balance_brl' => '400.00000000',
            'balance_btc' => '0.00240000',
        ]);
    }
}
