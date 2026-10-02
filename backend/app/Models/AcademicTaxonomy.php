<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AcademicTaxonomy extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'parent_id',
        'audience',
        'kind',
        'code',
        'name',
        'slug',
        'description',
        'sort_order',
        'is_active',
        'is_official',
        'source_url',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'is_official' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name');
    }

    public function books(): BelongsToMany
    {
        return $this->belongsToMany(Book::class, 'book_academic_taxonomy', 'academic_taxonomy_id', 'book_id')
            ->withTimestamps();
    }
}
