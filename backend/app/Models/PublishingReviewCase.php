<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PublishingReviewCase extends Model
{
    use HasUuids;

    protected $fillable = [
        'book_id', 'author_id', 'opened_by', 'assigned_to', 'case_number', 'case_type',
        'severity', 'status', 'reason_code', 'title', 'explanation', 'required_action',
        'author_response', 'resolution_note', 'resolved_at',
    ];

    protected function casts(): array
    {
        return ['resolved_at' => 'datetime'];
    }

    public function book(): BelongsTo { return $this->belongsTo(Book::class); }
    public function author(): BelongsTo { return $this->belongsTo(AuthorProfile::class, 'author_id'); }
    public function assignee(): BelongsTo { return $this->belongsTo(Profile::class, 'assigned_to'); }
}
