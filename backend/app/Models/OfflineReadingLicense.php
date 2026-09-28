<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfflineReadingLicense extends Model
{
    /** @use HasFactory<\Database\Factories\OfflineReadingLicenseFactory> */
    use HasFactory, HasUuids;

    protected $guarded = ['id'];

    protected $hidden = ['license_token_hash'];

    protected function casts(): array
    {
        return ['issued_at' => 'datetime', 'valid_until' => 'datetime', 'last_verified_at' => 'datetime', 'revoked_at' => 'datetime', 'metadata' => 'array'];
    }
}
