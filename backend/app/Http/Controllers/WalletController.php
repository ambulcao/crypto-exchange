<?php

namespace App\Http\Controllers;

use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $wallet = Wallet::query()->firstOrCreate(
            ['user_id' => $request->user()->id],
            ['balance_brl' => '10000.00000000', 'balance_btc' => '0.00000000']
        );

        return response()->json([
            'balance_brl' => $wallet->balance_brl,
            'balance_btc' => $wallet->balance_btc,
        ]);
    }
}
