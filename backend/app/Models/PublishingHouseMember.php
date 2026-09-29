<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublishingHouseMember extends Model
{
    use HasUuids;

    protected $fillable = [
        'publishing_house_id', 'profile_id', 'role', 'title', 'is_active', 'joined_at',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'joined_at' => 'datetime'];
    }

    public function publishingHouse(): BelongsTo { return $this->belongsTo(PublishingHouse::class); }
    public function profile(): BelongsTo { return $this->belongsTo(Profile::class); }
}
