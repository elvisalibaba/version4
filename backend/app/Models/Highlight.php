<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Highlight extends Model
{
    /** @use HasFactory<\Database\Factories\HighlightFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['user_id', 'book_id', 'page', 'text', 'note', 'color', 'locator', 'locator_type', 'selected_text', 'chapter_label', 'progress_percent', 'device_record_id', 'client_highlight_id'];

    protected function casts(): array
    {
        return ['progress_percent' => 'decimal:2'];
    }
}
