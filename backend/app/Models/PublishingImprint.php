<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PublishingImprint extends Model
{
    use HasUuids;

    protected $fillable = ['publishing_house_id', 'name', 'slug', 'description', 'logo_url', 'is_active'];

    protected function casts(): array { return ['is_active' => 'boolean']; }

    public function publishingHouse(): BelongsTo { return $this->belongsTo(PublishingHouse::class); }
    public function books(): HasMany { return $this->hasMany(Book::class, 'imprint_id'); }
}
