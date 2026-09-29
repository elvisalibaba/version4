<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdCampaign extends Model
{
    use HasUuids;

    protected $fillable = [
        'advertiser_name', 'advertiser_email', 'name', 'objective', 'status', 'channels',
        'budget', 'spent', 'currency_code', 'starts_at', 'ends_at', 'targeting', 'frequency_cap', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'channels' => 'array', 'targeting' => 'array', 'budget' => 'decimal:2', 'spent' => 'decimal:2',
            'starts_at' => 'datetime', 'ends_at' => 'datetime',
        ];
    }

    public function creatives(): HasMany { return $this->hasMany(AdCreative::class, 'campaign_id'); }
    public function assignments(): HasMany { return $this->hasMany(AdAssignment::class, 'campaign_id'); }
}
