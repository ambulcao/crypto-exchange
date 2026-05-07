<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class MarketPriceService
{
    public function currentBtcPrice(): string
    {
        return Cache::remember('market:btc:price', now()->addSeconds(5), function (): string {
            return random_int(200000, 300000).'.00000000';
        });
    }
}
