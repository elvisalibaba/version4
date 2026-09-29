<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name', 'slug', 'parent_id', 'description', 'icon', 'color', 'sort_order',
        'is_active', 'is_featured', 'content_types',
    ];

    protected function casts(): array
    {
        return ['is_active'=>'boolean','is_featured'=>'boolean','content_types'=>'array'];
    }

    public function parent(): BelongsTo { return $this->belongsTo(Category::class, 'parent_id'); }
    public function children(): HasMany { return $this->hasMany(Category::class, 'parent_id')->orderBy('sort_order'); }
    public function books(): BelongsToMany { return $this->belongsToMany(Book::class, 'book_categories'); }
}
