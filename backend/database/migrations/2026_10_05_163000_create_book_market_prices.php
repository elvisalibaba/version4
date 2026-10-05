<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_market_prices', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('book_id')->constrained('books')->cascadeOnDelete();
            $table->string('country_code', 2)->index();
            $table->string('currency_code', 3)->index();
            $table->decimal('list_price', 12, 2);
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('starts_at')->nullable()->index();
            $table->timestamp('ends_at')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['book_id', 'country_code', 'currency_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_market_prices');
    }
};
