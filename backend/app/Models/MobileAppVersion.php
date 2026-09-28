<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MobileAppVersion extends Model
{
    /** @use HasFactory<\Database\Factories\MobileAppVersionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['platform', 'version_name', 'version_code', 'minimum_supported_version_code', 'package_name', 'storage_path', 'file_name', 'mime_type', 'file_size_bytes', 'checksum_sha256', 'release_notes', 'is_mandatory', 'is_published', 'published_at', 'download_count', 'created_by'];

    protected function casts(): array
    {
        return ['is_mandatory' => 'boolean', 'is_published' => 'boolean', 'published_at' => 'datetime'];
    }
}
