<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookDistributionSetting extends Model
{
    use HasFactory;

    protected $primaryKey = 'book_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'book_id', 'primary_market', 'territory_mode', 'territories', 'sales_channels',
        'local_currency', 'royalty_rate', 'preorder_enabled', 'launch_date',
        'print_on_demand_enabled', 'local_print_enabled', 'institutional_sales_enabled',
        'bookstore_distribution_enabled', 'distribution_notes',
    ];

    protected function casts(): array
    {
        return [
            'territories' => 'array',
            'sales_channels' => 'array',
            'royalty_rate' => 'decimal:4',
            'preorder_enabled' => 'boolean',
            'launch_date' => 'date',
            'print_on_demand_enabled' => 'boolean',
            'local_print_enabled' => 'boolean',
            'institutional_sales_enabled' => 'boolean',
            'bookstore_distribution_enabled' => 'boolean',
        ];
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }
}
