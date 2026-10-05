<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('books')->update(['allow_download' => false]);
        DB::table('book_formats')->update(['downloadable' => false]);
        DB::table('subscription_plans')->update(['downloads_enabled' => false]);
    }

    public function down(): void
    {
        // Intentionally no-op: restoring download permissions globally would violate
        // the platform content-protection policy and cannot be inferred safely.
    }
};
