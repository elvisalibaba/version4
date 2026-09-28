<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    /** @use HasFactory<\Database\Factories\BlogPostFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['slug', 'title', 'excerpt', 'tag', 'author', 'read_time', 'cover_label', 'cover_image_url', 'cover_image_alt', 'published_at', 'content_blocks'];

    protected function casts(): array
    {
        return ['published_at' => 'date', 'content_blocks' => 'array'];
    }
}
