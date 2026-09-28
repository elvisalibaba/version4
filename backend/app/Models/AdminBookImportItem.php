<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminBookImportItem extends Model
{
    /** @use HasFactory<\Database\Factories\AdminBookImportItemFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['batch_id', 'item_id', 'created_by', 'source_checksum_sha256', 'source_file_name', 'source_file_size_bytes', 'source_storage_path', 'cover_storage_path', 'status', 'attempt_count', 'rights_confirmed', 'book_id', 'error_message', 'completed_at'];

    protected function casts(): array
    {
        return ['rights_confirmed' => 'boolean', 'completed_at' => 'datetime'];
    }
}
