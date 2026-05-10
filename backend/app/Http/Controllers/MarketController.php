<?php

namespace App\Http\Controllers;

use App\Services\MarketPriceService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class MarketController extends Controller
{
    public function __construct(private readonly MarketPriceService $marketPriceService)
    {
    }

    #[OA\Get(
        path: '/api/market/btc',
        summary: 'Preco BTC em BRL (CoinGecko; fallback BTC_FALLBACK_PRICE_BRL)',
        tags: ['Market']
    )]
    #[OA\Response(
        response: 200,
        description: 'Preco atual retornado com sucesso'
    )]
    public function btc(): JsonResponse
    {
        return response()->json([
            'symbol' => 'BTCBRL',
            'price' => $this->marketPriceService->currentBtcPrice(),
            'currency' => 'BRL',
        ]);
    }
}
