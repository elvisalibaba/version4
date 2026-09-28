<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Library extends Model
{
    /** @use HasFactory<\Database\Factories\LibraryFactory> */
    use HasFactory, HasUuids;

    protected $table = 'library';

    public $timestamps = false;

    protected $fillable = ['user_id', 'book_id', 'purchased_at', 'access_type', 'subscription_id', 'status', 'granted_by_order_id', 'granted_by_plan_id', 'granted_by_format_id', 'expires_at', 'last_opened_at', 'last_synced_at'];

    protected function casts(): array
    {
        return ['purchased_at' => 'datetime', 'expires_at' => 'datetime', 'last_opened_at' => 'datetime', 'last_synced_at' => 'datetime'];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
