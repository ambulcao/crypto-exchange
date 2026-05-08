<?php

namespace App\Http\Controllers;

use App\Services\TradeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class TradeController extends Controller
{
    public function __construct(private readonly TradeService $tradeService)
    {
    }

    /**
     * @throws ValidationException
     */
    #[OA\Post(
        path: '/api/trade/buy',
        summary: 'Compra BTC usando saldo BRL',
        security: [['bearerAuth' => []]],
        tags: ['Trade']
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['amount_brl'],
            properties: [
                new OA\Property(property: 'amount_brl', type: 'string', example: '2500.00000000'),
            ]
        )
    )]
    #[OA\Response(response: 200, description: 'Compra realizada com sucesso')]
    #[OA\Response(response: 422, description: 'Erro de validacao ou saldo insuficiente')]
    #[OA\Response(response: 401, description: 'Nao autenticado')]
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
    #[OA\Post(
        path: '/api/trade/sell',
        summary: 'Vende BTC e converte para BRL',
        security: [['bearerAuth' => []]],
        tags: ['Trade']
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ['amount_btc'],
            properties: [
                new OA\Property(property: 'amount_btc', type: 'string', example: '0.01000000'),
            ]
        )
    )]
    #[OA\Response(response: 200, description: 'Venda realizada com sucesso')]
    #[OA\Response(response: 422, description: 'Erro de validacao ou saldo insuficiente')]
    #[OA\Response(response: 401, description: 'Nao autenticado')]
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
