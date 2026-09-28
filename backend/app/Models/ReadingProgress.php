<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReadingProgress extends Model
{
    /** @use HasFactory<\Database\Factories\ReadingProgressFactory> */
    use HasFactory, HasUuids;

    protected $table = 'reading_progress';

    protected $fillable = [
        'user_id', 'book_id', 'format_id', 'locator', 'locator_type', 'progress_percent',
        'device_id', 'device_name', 'device_record_id', 'sync_revision',
    ];

    protected function casts(): array
    {
        return [
            'progress_percent' => 'decimal:2',
            'sync_revision' => 'integer',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function format(): BelongsTo
    {
        return $this->belongsTo(BookFormat::class, 'format_id');
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(UserDevice::class, 'device_record_id');
    }
}
