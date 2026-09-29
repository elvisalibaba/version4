<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_verification_codes', function (Blueprint $table): void {
            $table->foreignUuid('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $table->string('code_hash');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamp('expires_at')->index();
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->timestamp('payment_receipt_sent_at')->nullable()->after('payment_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn('payment_receipt_sent_at');
        });

        Schema::dropIfExists('email_verification_codes');
    }
};
