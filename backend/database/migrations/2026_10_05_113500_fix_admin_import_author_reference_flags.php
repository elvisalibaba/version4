<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('author_profiles')
            ->where('catalog_origin', 'admin_import')
            ->where('is_reference_profile', true)
            ->update([
                'is_reference_profile' => false,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Intentionally left empty: an administrator import author should not
        // be reclassified as an international reference profile on rollback.
    }
};
