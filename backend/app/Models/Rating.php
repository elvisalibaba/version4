<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Rating extends Model
{
    /** @use HasFactory<\Database\Factories\RatingFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['user_id', 'book_id', 'rating'];

    protected function casts(): array
    {
        return ['rating' => 'decimal:1'];
    }
}
