<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RightsAcquisitionTarget extends Model
{
    use HasUuids;

    protected $fillable = [
        'author_profile_id', 'title', 'original_publisher', 'isbn', 'status', 'priority',
        'territories', 'languages', 'desired_media', 'estimated_budget', 'currency_code',
        'contact_name', 'contact_email', 'source_url', 'next_action_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'territories' => 'array',
            'languages' => 'array',
            'desired_media' => 'array',
            'estimated_budget' => 'decimal:2',
            'next_action_at' => 'datetime',
        ];
    }

    public function authorProfile(): BelongsTo
    {
        return $this->belongsTo(AuthorProfile::class);
    }
}
