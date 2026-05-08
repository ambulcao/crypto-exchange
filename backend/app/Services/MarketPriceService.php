<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class MarketPriceService
{
    public function currentBtcPrice(): string
    {
        $cachedPrice = Cache::get('btc_price');
        if (is_string($cachedPrice) && $cachedPrice !== '') {
            return $cachedPrice;
        }

        $price = random_int(200000, 300000).'.00000000';
        Cache::put('btc_price', $price, now()->addSeconds(10));

        return $price;
    }
}
