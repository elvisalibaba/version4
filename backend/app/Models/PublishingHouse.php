<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PublishingHouse extends Model
{
    use HasUuids;

    protected $fillable = [
        'name', 'legal_name', 'slug', 'description', 'status', 'email', 'phone', 'website',
        'country_code', 'city', 'address', 'logo_url', 'primary_currency', 'brand_settings', 'metadata',
    ];

    protected function casts(): array
    {
        return ['brand_settings' => 'array', 'metadata' => 'array'];
    }

    public function imprints(): HasMany { return $this->hasMany(PublishingImprint::class); }
    public function members(): HasMany { return $this->hasMany(PublishingHouseMember::class); }
    public function books(): HasMany { return $this->hasMany(Book::class); }
    public function rightsContracts(): HasMany { return $this->hasMany(RightsContract::class); }
}
