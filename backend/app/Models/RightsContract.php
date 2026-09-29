<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RightsContract extends Model
{
    use HasUuids;

    protected $fillable = [
        'book_id', 'publishing_house_id', 'contract_number', 'rights_holder_name', 'licensor_name',
        'status', 'territories', 'languages', 'permitted_media', 'exclusive', 'starts_at', 'ends_at',
        'royalty_terms', 'proof_path', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'territories' => 'array', 'languages' => 'array', 'permitted_media' => 'array',
            'royalty_terms' => 'array', 'exclusive' => 'boolean', 'starts_at' => 'date', 'ends_at' => 'date',
        ];
    }

    public function book(): BelongsTo { return $this->belongsTo(Book::class); }
    public function publishingHouse(): BelongsTo { return $this->belongsTo(PublishingHouse::class); }

    public function isCurrentlyActive(): bool
    {
        return $this->status === 'active'
            && ($this->starts_at === null || $this->starts_at->isPast() || $this->starts_at->isToday())
            && ($this->ends_at === null || $this->ends_at->isFuture() || $this->ends_at->isToday());
    }
}
