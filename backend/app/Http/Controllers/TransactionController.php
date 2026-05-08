<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class TransactionController extends Controller
{
    #[OA\Get(
        path: '/api/transactions',
        summary: 'Lista historico de transacoes do usuario autenticado',
        security: [['bearerAuth' => []]],
        tags: ['Transactions']
    )]
    #[OA\Response(
        response: 200,
        description: 'Historico retornado com sucesso'
    )]
    #[OA\Response(
        response: 401,
        description: 'Nao autenticado'
    )]
    public function index(Request $request): JsonResponse
    {
        $transactions = $request->user()
            ->transactions()
            ->latest('created_at')
            ->get([
                'id',
                'type',
                'amount_brl',
                'amount_btc',
                'btc_price',
                'executed_at',
                'created_at',
            ]);

        return response()->json($transactions);
    }
}
