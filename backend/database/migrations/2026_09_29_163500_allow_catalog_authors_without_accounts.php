<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('author_profiles', function (Blueprint $table): void {
            // A publishing house must be able to create catalogue authors
            // before those authors have a HolisticBooks user account.
            $table->dropForeign(['id']);
        });
    }

    public function down(): void
    {
        // Intentionally not re-adding the foreign key automatically:
        // catalogue-only authors may legitimately have no profile account.
    }
};
