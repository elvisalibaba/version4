<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookMarketPrice extends Model
{
    use HasUuids;

    protected $fillable = [
        'book_id', 'country_code', 'currency_code', 'list_price', 'is_active',
        'starts_at', 'ends_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'list_price' => 'decimal:2',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}
