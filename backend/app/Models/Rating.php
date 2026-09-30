<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rating extends Model
{
    /** @use HasFactory<\Database\Factories\RatingFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'book_id',
        'rating',
        'review_text',
        'helpful_count',
        'is_hidden',
        'hidden_at',
        'hidden_by',
        'moderation_note',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'decimal:1',
            'helpful_count' => 'integer',
            'is_hidden' => 'boolean',
            'hidden_at' => 'datetime',
        ];
    }

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('is_hidden', false);
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function hiddenBy(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'hidden_by');
    }
}
