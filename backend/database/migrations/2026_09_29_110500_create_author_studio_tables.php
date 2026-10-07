<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('book_distribution_settings', function (Blueprint $table) {
            $table->foreignUuid('book_id')->primary()->constrained('books')->cascadeOnDelete();
            $table->string('primary_market', 2)->default('CD');
            $table->enum('territory_mode', ['worldwide', 'selected'])->default('worldwide');
            $table->json('territories');
            $table->json('sales_channels');
            $table->string('local_currency', 3)->default('USD');
            $table->decimal('royalty_rate', 6, 4)->nullable();
            $table->boolean('preorder_enabled')->default(false);
            $table->date('launch_date')->nullable();
            $table->boolean('print_on_demand_enabled')->default(false);
            $table->boolean('local_print_enabled')->default(false);
            $table->boolean('institutional_sales_enabled')->default(false);
            $table->boolean('bookstore_distribution_enabled')->default(false);
            $table->text('distribution_notes')->nullable();
            $table->timestamps();
        });

        // Un portefeuille par auteur ET par devise : une vente en CDF crédite
        // le portefeuille CDF, une vente en USD le portefeuille USD.
        Schema::create('author_royalty_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->string('currency_code', 3)->default('USD');
            $table->unique(['user_id', 'currency_code']);
            $table->decimal('pending_balance', 14, 2)->default(0);
            $table->decimal('available_balance', 14, 2)->default(0);
            $table->decimal('lifetime_earnings', 14, 2)->default(0);
            $table->decimal('lifetime_paid', 14, 2)->default(0);
            $table->decimal('minimum_payout', 14, 2)->default(10);
            $table->enum('status', ['active', 'review', 'suspended'])->default('active');
            $table->timestamps();
        });

        Schema::create('author_royalty_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('book_id')->constrained('books')->cascadeOnDelete();
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignUuid('order_item_id')->nullable()->unique()->constrained('order_items')->nullOnDelete();
            $table->enum('source', ['ebook', 'print', 'subscription', 'institutional', 'other']);
            $table->decimal('gross_amount', 14, 2);
            $table->decimal('printing_cost', 14, 2)->default(0);
            $table->decimal('platform_fee', 14, 2)->default(0);
            $table->decimal('tax_withholding', 14, 2)->default(0);
            $table->decimal('royalty_rate', 6, 4);
            $table->decimal('net_royalty', 14, 2);
            $table->string('currency_code', 3)->default('USD');
            $table->enum('status', ['pending', 'payable', 'paid', 'reversed'])->default('pending');
            $table->timestamp('earned_at')->useCurrent();
            $table->timestamp('payable_at')->nullable()->index();
            $table->timestamp('paid_at')->nullable();
            $table->json('metadata');
            $table->timestamps();

            $table->index(['user_id', 'status', 'earned_at']);
            $table->index(['book_id', 'earned_at']);
        });

        Schema::create('author_payout_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->enum('method', ['bank_transfer', 'mobile_money']);
            $table->string('provider')->nullable();
            $table->string('country_code', 2);
            $table->string('currency_code', 3)->default('USD');
            $table->string('account_name');
            $table->text('account_identifier');
            $table->boolean('is_default')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_default']);
        });

        Schema::create('author_payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('payout_account_id')->nullable()->constrained('author_payout_accounts')->nullOnDelete();
            $table->decimal('amount', 14, 2);
            $table->string('currency_code', 3)->default('USD');
            $table->enum('status', ['requested', 'approved', 'processing', 'paid', 'failed', 'rejected', 'cancelled'])->default('requested');
            $table->string('provider_reference')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'requested_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('author_payouts');
        Schema::dropIfExists('author_payout_accounts');
        Schema::dropIfExists('author_royalty_transactions');
        Schema::dropIfExists('author_royalty_accounts');
        Schema::dropIfExists('book_distribution_settings');
    }
};
