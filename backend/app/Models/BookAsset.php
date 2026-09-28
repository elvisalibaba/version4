<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookAsset extends Model
{
    /** @use HasFactory<\Database\Factories\BookAssetFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['book_id', 'format_id', 'asset_type', 'delivery_format', 'storage_path', 'mime_type', 'file_size_bytes', 'checksum', 'is_encrypted', 'is_published', 'encryption_scheme', 'encryption_key_version'];

    protected function casts(): array
    {
        return ['is_encrypted' => 'boolean', 'is_published' => 'boolean'];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function format(): BelongsTo
    {
        return $this->belongsTo(BookFormat::class, 'format_id');
    }
}
