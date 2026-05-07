<?php

namespace Tests\Feature\Database;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TradingSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_wallets_table_exists_with_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('wallets'));
        $this->assertTrue(Schema::hasColumns('wallets', [
            'user_id',
            'balance_brl',
            'balance_btc',
        ]));
    }

    public function test_transactions_table_exists_with_expected_columns(): void
    {
        $this->assertTrue(Schema::hasTable('transactions'));
        $this->assertTrue(Schema::hasColumns('transactions', [
            'user_id',
            'type',
            'amount_brl',
            'amount_btc',
            'btc_price',
            'executed_at',
        ]));
    }
}
