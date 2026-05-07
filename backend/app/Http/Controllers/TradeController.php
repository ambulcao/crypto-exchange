<?php

namespace App\Http\Controllers;

use App\Services\TradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TradeController extends Controller
{
    public function __construct(private readonly TradeService $tradeService)
    {
    }

    /**
     * @throws ValidationException
     */
    public function buy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'amount_brl' => ['required', 'string', 'regex:/^\d+(\.\d{1,8})?$/'],
        ]);

        $result = $this->tradeService->buy($request->user(), $data['amount_brl']);

        return response()->json([
            'message' => 'Compra realizada com sucesso.',
            'price' => $result['price'],
            'transaction' => $result['transaction'],
            'wallet' => $result['wallet'],
        ]);
    }

    /**
     * @throws ValidationException
     */
    public function sell(Request $request): JsonResponse
    {
        $data = $request->validate([
            'amount_btc' => ['required', 'string', 'regex:/^\d+(\.\d{1,8})?$/'],
        ]);

        $result = $this->tradeService->sell($request->user(), $data['amount_btc']);

        return response()->json([
            'message' => 'Venda realizada com sucesso.',
            'price' => $result['price'],
            'transaction' => $result['transaction'],
            'wallet' => $result['wallet'],
        ]);
    }
}
