<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('monthly_price', 12, 2)->default(0);
            $table->string('currency_code', 3)->default('USD');
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedTinyInteger('max_devices')->default(2);
            $table->unsignedTinyInteger('offline_days')->default(7);
            $table->boolean('downloads_enabled')->default(true);
            $table->timestamps();
        });

        Schema::create('subscription_plan_books', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('plan_id')->constrained('subscription_plans')->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['plan_id', 'book_id']);
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->decimal('total_price', 12, 2)->default(0);
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->string('currency_code', 3)->default('USD');
            $table->string('payment_provider')->nullable();
            $table->string('payment_transaction_id')->nullable()->index();
            $table->string('payment_channel')->nullable();
            $table->string('payment_provider_status')->nullable();
            $table->timestamp('payment_verified_at')->nullable();
            $table->json('payment_metadata');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['payment_status', 'created_at']);
        });

        Schema::create('user_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->enum('status', ['active', 'cancelled', 'expired', 'past_due'])->index();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('expires_at')->nullable()->index();
            $table->foreignUuid('affiliate_user_id')->nullable()->constrained('profiles')->nullOnDelete();
            $table->string('affiliate_code_used')->nullable();
            $table->enum('affiliate_source_type', ['book', 'plan'])->nullable();
            $table->foreignUuid('affiliate_source_book_id')->nullable()->constrained('books')->nullOnDelete();
            $table->foreignUuid('affiliate_source_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->decimal('affiliate_commission_rate', 6, 4)->default(0.0200);
            $table->decimal('affiliate_commission_amount', 12, 2)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'expires_at']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained()->restrictOnDelete();
            $table->decimal('price', 12, 2);
            $table->string('currency_code', 3)->default('USD');
            $table->enum('book_format', ['holistique_store', 'ebook', 'paperback', 'pocket', 'hardcover', 'audiobook'])->default('ebook');
            $table->unsignedInteger('quantity')->default(1);
            $table->foreignUuid('format_id')->nullable()->constrained('book_formats')->nullOnDelete();
            $table->unique(['order_id', 'book_id', 'book_format']);
        });

        Schema::create('library', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained()->cascadeOnDelete();
            $table->timestamp('purchased_at')->useCurrent();
            $table->enum('access_type', ['purchase', 'subscription', 'free'])->default('purchase');
            $table->foreignUuid('subscription_id')->nullable()->constrained('user_subscriptions')->nullOnDelete();
            $table->enum('status', ['active', 'expired', 'revoked'])->default('active');
            $table->foreignUuid('granted_by_order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignUuid('granted_by_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->foreignUuid('granted_by_format_id')->nullable()->constrained('book_formats')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_opened_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();

            $table->unique(['user_id', 'book_id']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider');
            $table->string('payment_channel')->nullable();
            $table->string('provider_reference')->nullable()->index();
            $table->string('idempotency_key')->unique();
            $table->decimal('amount', 12, 2);
            $table->string('currency_code', 3)->default('USD');
            $table->enum('status', ['created', 'pending', 'processing', 'paid', 'failed', 'cancelled', 'expired', 'refunded'])->default('created');
            $table->json('request_payload');
            $table->json('response_payload');
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_attempts');
        Schema::dropIfExists('library');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('user_subscriptions');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('subscription_plan_books');
        Schema::dropIfExists('subscription_plans');
    }
};
