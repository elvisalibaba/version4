<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaChapter extends Model
{
    use HasUuids;

    protected $fillable = [
        'media_edition_id', 'position', 'title', 'starts_at_second', 'ends_at_second',
        'storage_path', 'streaming_url', 'is_preview',
    ];

    protected function casts(): array { return ['is_preview' => 'boolean']; }
    public function mediaEdition(): BelongsTo { return $this->belongsTo(MediaEdition::class); }
}
