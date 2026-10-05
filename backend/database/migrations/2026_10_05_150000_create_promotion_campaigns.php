<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotion_campaigns', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('internal_code')->unique();
            $table->string('headline')->nullable();
            $table->text('description')->nullable();
            $table->enum('discount_type', ['percentage', 'fixed']);
            $table->decimal('discount_value', 12, 2);
            $table->string('currency_code', 3)->nullable();
            $table->json('selected_book_ids')->nullable();
            $table->json('channels')->nullable();
            $table->boolean('is_active')->default(false)->index();
            $table->unsignedInteger('priority')->default(100)->index();
            $table->timestamp('starts_at')->nullable()->index();
            $table->timestamp('ends_at')->nullable()->index();
            $table->foreignUuid('created_by')->nullable()->constrained('profiles')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('order_items', function (Blueprint $table): void {
            $table->decimal('original_price', 12, 2)->nullable()->after('price');
            $table->foreignUuid('promotion_campaign_id')->nullable()->after('original_price')
                ->constrained('promotion_campaigns')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table): void {
            $table->dropForeign(['promotion_campaign_id']);
            $table->dropColumn(['original_price', 'promotion_campaign_id']);
        });

        Schema::dropIfExists('promotion_campaigns');
    }
};
