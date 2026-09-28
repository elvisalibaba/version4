<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Highlight extends Model
{
    /** @use HasFactory<\Database\Factories\HighlightFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id', 'book_id', 'page', 'text', 'note', 'color', 'locator', 'locator_type',
        'selected_text', 'chapter_label', 'progress_percent', 'device_record_id', 'client_highlight_id',
    ];

    protected function casts(): array
    {
        return ['progress_percent' => 'decimal:2'];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(UserDevice::class, 'device_record_id');
    }
}
