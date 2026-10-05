<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table): void {
            $table->string('reading_access_mode', 30)->default('standard')->after('copyright_note')->index();
            $table->boolean('can_read_on_platform')->default(true)->after('reading_access_mode');
            $table->boolean('allow_download')->default(false)->after('can_read_on_platform');
            $table->boolean('allow_print')->default(true)->after('allow_download');
            $table->boolean('allow_copy')->default(true)->after('allow_print');
            $table->boolean('reader_watermark_enabled')->default(false)->after('allow_copy');
            $table->string('rights_agreement_reference')->nullable()->after('reader_watermark_enabled');
            $table->text('reader_rights_note')->nullable()->after('rights_agreement_reference');

            $table->string('writing_status', 30)->default('idea')->after('reader_rights_note')->index();
            $table->unsignedInteger('target_word_count')->nullable()->after('writing_status');
            $table->unsignedInteger('current_word_count')->nullable()->after('target_word_count');
            $table->text('next_author_action')->nullable()->after('current_word_count');
            $table->date('editorial_deadline')->nullable()->after('next_author_action');
            $table->longText('author_private_notes')->nullable()->after('editorial_deadline');
        });

        Schema::create('book_manuscript_versions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('book_id')->constrained('books')->cascadeOnDelete();
            $table->foreignUuid('created_by')->nullable()->constrained('profiles')->nullOnDelete();
            $table->unsignedInteger('version_number');
            $table->string('file_path');
            $table->string('file_format', 30)->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('status', 30)->default('author_draft')->index();
            $table->text('change_summary')->nullable();
            $table->timestamps();

            $table->unique(['book_id', 'version_number']);
            $table->index(['book_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('book_manuscript_versions');

        Schema::table('books', function (Blueprint $table): void {
            $table->dropColumn([
                'reading_access_mode',
                'can_read_on_platform',
                'allow_download',
                'allow_print',
                'allow_copy',
                'reader_watermark_enabled',
                'rights_agreement_reference',
                'reader_rights_note',
                'writing_status',
                'target_word_count',
                'current_word_count',
                'next_author_action',
                'editorial_deadline',
                'author_private_notes',
            ]);
        });
    }
};
