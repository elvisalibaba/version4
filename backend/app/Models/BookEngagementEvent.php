<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookEngagementEvent extends Model
{
    /** @use HasFactory<\Database\Factories\BookEngagementEventFactory> */
    use HasFactory, HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = ['book_id', 'user_id', 'event_type', 'source', 'user_role', 'is_authenticated', 'metadata', 'deduplication_key'];

    protected function casts(): array
    {
        return ['is_authenticated' => 'boolean', 'metadata' => 'array'];
    }
}
