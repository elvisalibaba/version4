<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminBookImportBatch extends Model
{
    /** @use HasFactory<\Database\Factories\AdminBookImportBatchFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['created_by', 'status', 'total_items', 'completed_items', 'failed_items', 'completed_at'];

    protected function casts(): array
    {
        return ['completed_at' => 'datetime'];
    }
}
