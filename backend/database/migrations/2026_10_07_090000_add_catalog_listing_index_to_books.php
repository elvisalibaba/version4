<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Le catalogue public filtre sur status + copyright_status et trie par
     * published_at : sans cet index, chaque page du catalogue trie toute la table.
     */
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            $table->index(['status', 'copyright_status', 'published_at'], 'books_public_catalog_index');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            $table->dropIndex('books_public_catalog_index');
        });
    }
};
