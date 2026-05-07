<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TradeService
{
    public function __construct(private readonly MarketPriceService $marketPriceService)
    {
    }

    /**
     * @return array{wallet: Wallet, transaction: Transaction, price: string}
     * @throws ValidationException
     */
    public function buy(User $user, string $amountBrl): array
    {
        $this->assertPositiveDecimal($amountBrl, 'amount_brl');
        $price = $this->marketPriceService->currentBtcPrice();

        return DB::transaction(function () use ($user, $amountBrl, $price): array {
            $wallet = Wallet::query()
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (bccomp($wallet->balance_brl, $amountBrl, 8) < 0) {
                throw ValidationException::withMessages([
                    'amount_brl' => ['Saldo BRL insuficiente para compra.'],
                ]);
            }

            $amountBtc = bcdiv($amountBrl, $price, 8);

            $wallet->balance_brl = bcsub($wallet->balance_brl, $amountBrl, 8);
            $wallet->balance_btc = bcadd($wallet->balance_btc, $amountBtc, 8);
            $wallet->save();

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'type' => 'buy',
                'amount_brl' => $amountBrl,
                'amount_btc' => $amountBtc,
                'btc_price' => $price,
                'executed_at' => now(),
            ]);

            return [
                'wallet' => $wallet->fresh(),
                'transaction' => $transaction,
                'price' => $price,
            ];
        });
    }

    /**
     * @return array{wallet: Wallet, transaction: Transaction, price: string}
     * @throws ValidationException
     */
    public function sell(User $user, string $amountBtc): array
    {
        $this->assertPositiveDecimal($amountBtc, 'amount_btc');
        $price = $this->marketPriceService->currentBtcPrice();

        return DB::transaction(function () use ($user, $amountBtc, $price): array {
            $wallet = Wallet::query()
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (bccomp($wallet->balance_btc, $amountBtc, 8) < 0) {
                throw ValidationException::withMessages([
                    'amount_btc' => ['Saldo BTC insuficiente para venda.'],
                ]);
            }

            $amountBrl = bcmul($amountBtc, $price, 8);

            $wallet->balance_btc = bcsub($wallet->balance_btc, $amountBtc, 8);
            $wallet->balance_brl = bcadd($wallet->balance_brl, $amountBrl, 8);
            $wallet->save();

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'type' => 'sell',
                'amount_brl' => $amountBrl,
                'amount_btc' => $amountBtc,
                'btc_price' => $price,
                'executed_at' => now(),
            ]);

            return [
                'wallet' => $wallet->fresh(),
                'transaction' => $transaction,
                'price' => $price,
            ];
        });
    }

    /**
     * @throws ValidationException
     */
    private function assertPositiveDecimal(string $value, string $field): void
    {
        if (bccomp($value, '0', 8) <= 0) {
            throw ValidationException::withMessages([
                $field => ['O valor informado deve ser maior que zero.'],
            ]);
        }
    }
}
