<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MobileAppConfig extends Model
{
    /** @use HasFactory<\Database\Factories\MobileAppConfigFactory> */
    use HasFactory;

    protected $primaryKey = 'scope';

    public $incrementing = false;

    protected $keyType = 'string';

    public const CREATED_AT = null;

    protected $guarded = ['scope'];

    protected function casts(): array
    {
        return ['is_public' => 'boolean', 'trial_enabled' => 'boolean'];
    }
}
