<?php

namespace App\Http\Controllers;

use App\Services\MarketPriceService;
use Illuminate\Http\JsonResponse;

class MarketController extends Controller
{
    public function __construct(private readonly MarketPriceService $marketPriceService)
    {
    }

    public function btc(): JsonResponse
    {
        return response()->json([
            'symbol' => 'BTCBRL',
            'price' => $this->marketPriceService->currentBtcPrice(),
            'currency' => 'BRL',
        ]);
    }
}
