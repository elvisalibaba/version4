<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookEditorialEvent extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'book_id',
        'actor_id',
        'event_type',
        'from_stage',
        'to_stage',
        'notes',
        'payload',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'actor_id');
    }
}
