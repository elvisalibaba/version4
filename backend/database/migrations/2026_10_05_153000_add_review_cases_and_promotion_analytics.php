<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('publishing_review_cases', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('book_id')->constrained('books')->cascadeOnDelete();
            $table->foreignUuid('author_id')->nullable()->constrained('author_profiles')->nullOnDelete();
            $table->foreignUuid('opened_by')->nullable()->constrained('profiles')->nullOnDelete();
            $table->foreignUuid('assigned_to')->nullable()->constrained('profiles')->nullOnDelete();
            $table->string('case_number')->unique();
            $table->enum('case_type', ['metadata', 'rights', 'content', 'quality', 'payment', 'account', 'other']);
            $table->enum('severity', ['info', 'warning', 'blocking'])->default('warning');
            $table->enum('status', ['open', 'author_action', 'under_review', 'resolved', 'rejected', 'appealed'])->default('open')->index();
            $table->string('reason_code')->nullable()->index();
            $table->string('title');
            $table->text('explanation');
            $table->text('required_action')->nullable();
            $table->text('author_response')->nullable();
            $table->text('resolution_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['book_id', 'status']);
            $table->index(['author_id', 'status']);
        });

        Schema::create('promotion_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('promotion_campaign_id')->constrained('promotion_campaigns')->cascadeOnDelete();
            $table->foreignUuid('book_id')->nullable()->constrained('books')->nullOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('profiles')->nullOnDelete();
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->enum('event_type', ['impression', 'click', 'checkout', 'conversion']);
            $table->string('channel', 30)->nullable();
            $table->decimal('revenue_amount', 14, 2)->nullable();
            $table->string('currency_code', 3)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->useCurrent()->index();
            $table->timestamps();

            $table->index(
                ['promotion_campaign_id', 'event_type', 'occurred_at'],
                'promotion_events_campaign_type_time_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotion_events');
        Schema::dropIfExists('publishing_review_cases');
    }
};
