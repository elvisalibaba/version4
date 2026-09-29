<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdPlacement extends Model
{
    use HasUuids;

    protected $fillable = [
        'code', 'name', 'channel', 'surface', 'position', 'allowed_creative_types',
        'width', 'height', 'is_active', 'metadata',
    ];

    protected function casts(): array
    {
        return ['allowed_creative_types' => 'array', 'is_active' => 'boolean', 'metadata' => 'array'];
    }

    public function assignments(): HasMany { return $this->hasMany(AdAssignment::class, 'placement_id'); }
}
