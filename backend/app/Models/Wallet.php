<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wallet extends Model
{
    protected $fillable = [
        'user_id',
        'balance_brl',
        'balance_btc',
    ];

    protected function casts(): array
    {
        return [
            'balance_brl' => 'decimal:8',
            'balance_btc' => 'decimal:8',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
