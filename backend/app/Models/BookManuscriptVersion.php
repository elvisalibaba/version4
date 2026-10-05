<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookManuscriptVersion extends Model
{
    use HasUuids;

    protected $fillable = [
        'book_id',
        'created_by',
        'version_number',
        'file_path',
        'file_format',
        'file_size',
        'status',
        'change_summary',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'created_by');
    }
}
