<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class DiagnoseAdminCatalogue extends Command
{
    protected $signature = 'holistic:diagnose-admin';

    protected $description = 'Check database schema and public file storage used by the admin catalogue.';

    public function handle(): int
    {
        $this->info('HolisticBooks admin catalogue diagnostics');

        try {
            DB::connection()->getPdo();
            $this->line('DB_CONNECTION: OK');
        } catch (Throwable $e) {
            $this->error('DB_CONNECTION: ERROR - '.$e->getMessage());
            return self::FAILURE;
        }

        foreach (['users', 'profiles', 'author_profiles', 'books'] as $table) {
            $exists = DB::getSchemaBuilder()->hasTable($table);
            $this->line("TABLE {$table}: ".($exists ? 'OK' : 'MISSING'));
        }

        foreach ([
            'books' => ['id', 'title', 'author_id', 'co_authors', 'categories', 'tags', 'cover_url'],
            'author_profiles' => ['id', 'display_name', 'social_links', 'genres', 'press_mentions'],
        ] as $table => $columns) {
            foreach ($columns as $column) {
                $exists = DB::getSchemaBuilder()->hasColumn($table, $column);
                $this->line("COLUMN {$table}.{$column}: ".($exists ? 'OK' : 'MISSING'));
            }
        }

        try {
            $foreignKeys = DB::select(
                "SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME
                 FROM information_schema.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'author_profiles'
                   AND COLUMN_NAME = 'id'
                   AND REFERENCED_TABLE_NAME IS NOT NULL"
            );

            $this->line('AUTHOR_PROFILE_ACCOUNT_FK: '.($foreignKeys === [] ? 'DETACHED_OK' : 'STILL_LINKED'));
        } catch (Throwable $e) {
            $this->warn('AUTHOR_PROFILE_ACCOUNT_FK: CHECK_SKIPPED - '.$e->getMessage());
        }

        $disk = Storage::disk('public');
        $probe = 'diagnostics/write-test-'.now()->format('YmdHis').'.txt';

        try {
            $disk->put($probe, 'ok');
            $exists = $disk->exists($probe);
            $url = $disk->url($probe);
            $this->line('PUBLIC_STORAGE_WRITE: '.($exists ? 'OK' : 'FAILED'));
            $this->line('PUBLIC_STORAGE_URL: '.$url);
            $disk->delete($probe);
        } catch (Throwable $e) {
            $this->error('PUBLIC_STORAGE_WRITE: ERROR - '.$e->getMessage());
            return self::FAILURE;
        }

        $this->info('Diagnostics completed.');

        return self::SUCCESS;
    }
}
