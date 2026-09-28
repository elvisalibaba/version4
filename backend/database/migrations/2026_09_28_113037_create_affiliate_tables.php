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
        Schema::create('reader_affiliate_profiles', function (Blueprint $table) {
            $table->foreignUuid('user_id')->primary()->constrained('profiles')->cascadeOnDelete();
            $table->string('affiliate_code')->unique();
            $table->decimal('commission_rate', 6, 4)->default(0.0200);
            $table->decimal('wallet_balance', 12, 2)->default(0);
            $table->decimal('lifetime_credited', 12, 2)->default(0);
            $table->string('currency_code', 3)->default('USD');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('affiliate_wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('affiliate_user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('referred_user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('subscription_id')->unique()->constrained('user_subscriptions')->cascadeOnDelete();
            $table->foreignUuid('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->enum('source_type', ['book', 'plan']);
            $table->foreignUuid('source_book_id')->nullable()->constrained('books')->nullOnDelete();
            $table->foreignUuid('source_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->decimal('commission_rate', 6, 4)->default(0.0200);
            $table->decimal('subscription_amount', 12, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->string('currency_code', 3)->default('USD');
            $table->enum('status', ['pending', 'credited', 'reversed'])->default('credited');
            $table->timestamp('created_at')->useCurrent();
            $table->index(['affiliate_user_id', 'status']);
        });

        Schema::create('affiliate_order_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('affiliate_user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('referred_user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignUuid('purchased_book_id')->constrained('books')->restrictOnDelete();
            $table->enum('referral_source_type', ['book', 'plan'])->nullable();
            $table->foreignUuid('referral_source_book_id')->nullable()->constrained('books')->nullOnDelete();
            $table->foreignUuid('referral_source_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->decimal('commission_rate', 6, 4)->default(0.0200);
            $table->decimal('order_amount', 12, 2);
            $table->decimal('commission_amount', 12, 2);
            $table->string('currency_code', 3)->default('USD');
            $table->enum('status', ['pending', 'credited', 'reversed'])->default('credited');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('affiliate_payout_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->string('provider');
            $table->string('account_name')->nullable();
            $table->text('account_number');
            $table->string('currency_code', 3)->default('USD');
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });

        Schema::create('affiliate_withdrawals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('payout_account_id')->nullable()->constrained('affiliate_payout_accounts')->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency_code', 3)->default('USD');
            $table->enum('status', ['pending', 'approved', 'processing', 'paid', 'rejected', 'cancelled'])->default('pending');
            $table->string('provider_reference')->nullable();
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('affiliate_withdrawals');
        Schema::dropIfExists('affiliate_payout_accounts');
        Schema::dropIfExists('affiliate_order_transactions');
        Schema::dropIfExists('affiliate_wallet_transactions');
        Schema::dropIfExists('reader_affiliate_profiles');
    }
};
