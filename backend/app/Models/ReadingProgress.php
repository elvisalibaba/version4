<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReadingProgress extends Model
{
    /** @use HasFactory<\Database\Factories\ReadingProgressFactory> */
    use HasFactory, HasUuids;

    protected $table = 'reading_progress';

    protected $fillable = ['user_id', 'book_id', 'format_id', 'locator', 'locator_type', 'progress_percent', 'device_id', 'device_name', 'device_record_id', 'sync_revision'];

    protected function casts(): array
    {
        return ['progress_percent' => 'decimal:2'];
    }
}
