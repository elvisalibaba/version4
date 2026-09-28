<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HomeFeaturedConfig extends Model
{
    /** @use HasFactory<\Database\Factories\HomeFeaturedConfigFactory> */
    use HasFactory;

    protected $primaryKey = 'scope';

    public $incrementing = false;

    protected $keyType = 'string';

    public const CREATED_AT = null;

    protected $fillable = ['scope', 'selected_book_ids'];

    protected function casts(): array
    {
        return ['selected_book_ids' => 'array'];
    }
}
