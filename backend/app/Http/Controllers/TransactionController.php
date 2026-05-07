<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
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
