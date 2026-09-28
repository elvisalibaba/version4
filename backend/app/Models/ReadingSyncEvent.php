<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReadingSyncEvent extends Model
{
    /** @use HasFactory<\Database\Factories\ReadingSyncEventFactory> */
    use HasFactory, HasUuids;

    protected $table = 'reading_sync_queue';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['payload' => 'array', 'device_created_at' => 'datetime', 'processed_at' => 'datetime'];
    }
}
