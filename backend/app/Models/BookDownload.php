<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookDownload extends Model
{
    /** @use HasFactory<\Database\Factories\BookDownloadFactory> */
    use HasFactory, HasUuids;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['checksum_verified' => 'boolean', 'started_at' => 'datetime', 'completed_at' => 'datetime', 'last_synced_at' => 'datetime', 'metadata' => 'array'];
    }
}
