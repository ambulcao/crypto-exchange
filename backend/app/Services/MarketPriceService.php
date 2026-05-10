<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cotacao BTC em BRL via CoinGecko (agregado); fallback configuravel se a API falhar.
 */
class MarketPriceService
{
    private const CACHE_KEY = 'market:btc_brl_price';

    private const COINGECKO_SIMPLE_PRICE = 'https://api.coingecko.com/api/v3/simple/price';

    public function currentBtcPrice(): string
    {
        return Cache::remember(self::CACHE_KEY, now()->addSeconds(45), function (): string {
            try {
                $response = Http::timeout(12)
                    ->acceptJson()
                    ->get(self::COINGECKO_SIMPLE_PRICE, [
                        'ids' => 'bitcoin',
                        'vs_currencies' => 'brl',
                    ]);

                if ($response->successful()) {
                    $brl = data_get($response->json(), 'bitcoin.brl');
                    if (is_numeric($brl) && (float) $brl > 0) {
                        return number_format((float) $brl, 8, '.', '');
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('btc_brl_price_fetch_failed', ['message' => $e->getMessage()]);
            }

            $fallback = (float) config('services.btc.brl_fallback', 400_000);

            return number_format($fallback, 8, '.', '');
        });
    }
}
