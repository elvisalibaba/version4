<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookFormat extends Model
{
    /** @use HasFactory<\Database\Factories\BookFormatFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['book_id', 'format', 'price', 'file_url', 'stock_quantity', 'file_size_mb', 'downloadable', 'is_published', 'currency_code', 'printing_cost'];

    protected function casts(): array
    {
        return ['price' => 'decimal:2', 'printing_cost' => 'decimal:2', 'downloadable' => 'boolean', 'is_published' => 'boolean'];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function assets(): HasMany
    {
        return $this->hasMany(BookAsset::class, 'format_id');
    }
}
