<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaEdition extends Model
{
    use HasUuids;

    protected $fillable = [
        'book_id', 'media_type', 'title', 'language', 'duration_seconds', 'narrator', 'presenter',
        'provider', 'storage_path', 'streaming_url', 'preview_url', 'mime_type', 'file_size_bytes',
        'drm_scheme', 'metadata', 'status', 'published_at',
    ];

    protected function casts(): array
    {
        return ['metadata' => 'array', 'published_at' => 'datetime'];
    }

    public function book(): BelongsTo { return $this->belongsTo(Book::class); }
    public function chapters(): HasMany { return $this->hasMany(MediaChapter::class)->orderBy('position'); }
}
