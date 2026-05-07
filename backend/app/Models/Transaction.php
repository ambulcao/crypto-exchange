<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'amount_brl',
        'amount_btc',
        'btc_price',
        'executed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_brl' => 'decimal:8',
            'amount_btc' => 'decimal:8',
            'btc_price' => 'decimal:8',
            'executed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
