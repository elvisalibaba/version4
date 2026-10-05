<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class DiagnoseAdminCatalogue extends Command
{
    protected $signature = 'holistic:diagnose-admin';

    protected $description = 'Check database schema, PHP upload limits, and file storage used by the admin catalogue.';

    public function handle(): int
    {
        $this->info('HolisticBooks admin catalogue diagnostics');
        $this->line('PHP_VERSION: '.PHP_VERSION);
        $this->line('PHP_FILE_UPLOADS: '.(filter_var(ini_get('file_uploads'), FILTER_VALIDATE_BOOL) ? 'ON' : 'OFF'));
        $this->line('PHP_UPLOAD_MAX_FILESIZE: '.ini_get('upload_max_filesize'));
        $this->line('PHP_POST_MAX_SIZE: '.ini_get('post_max_size'));
        $this->line('PHP_MEMORY_LIMIT: '.ini_get('memory_limit'));
        $this->line('PHP_MAX_EXECUTION_TIME: '.ini_get('max_execution_time'));
        $this->line('PHP_MAX_FILE_UPLOADS: '.ini_get('max_file_uploads'));
        $this->line('PHP_UPLOAD_TMP_DIR: '.(ini_get('upload_tmp_dir') ?: '[system default]'));
        $this->line('SYSTEM_TEMP_DIR: '.sys_get_temp_dir());
        $this->line('SYSTEM_TEMP_WRITABLE: '.(is_writable(sys_get_temp_dir()) ? 'OK' : 'NOT_WRITABLE'));
        $this->line('LIVEWIRE_TEMP_RULES: '.(string) config('livewire.temporary_file_upload.rules'));
        $this->line('LIVEWIRE_TEMP_DIRECTORY: '.(string) config('livewire.temporary_file_upload.directory'));

        foreach ([
            storage_path() => 'STORAGE_ROOT_WRITABLE',
            storage_path('app/private') => 'PRIVATE_STORAGE_WRITABLE',
            storage_path('framework') => 'FRAMEWORK_STORAGE_WRITABLE',
            storage_path('logs') => 'LOG_STORAGE_WRITABLE',
            base_path('bootstrap/cache') => 'BOOTSTRAP_CACHE_WRITABLE',
        ] as $path => $label) {
            $this->line($label.': '.(is_dir($path) && is_writable($path) ? 'OK' : 'NOT_WRITABLE').' - '.$path);
        }

        try {
            DB::connection()->getPdo();
            $this->line('DB_CONNECTION: OK');
        } catch (Throwable $e) {
            $this->error('DB_CONNECTION: ERROR - '.$e->getMessage());
            return self::FAILURE;
        }

        foreach (['users', 'profiles', 'author_profiles', 'books', 'categories', 'academic_taxonomies', 'book_academic_taxonomy', 'subscription_plans', 'publishing_houses', 'publishing_house_members', 'rights_acquisition_targets', 'ad_placements', 'media_editions'] as $table) {
            $exists = DB::getSchemaBuilder()->hasTable($table);
            $this->line("TABLE {$table}: ".($exists ? 'OK' : 'MISSING'));
        }

        foreach ([
            'books' => ['id', 'title', 'author_id', 'co_authors', 'categories', 'tags', 'cover_url'],
            'author_profiles' => ['id', 'display_name', 'social_links', 'genres', 'press_mentions', 'country_code', 'catalog_origin', 'rights_status'],
            'categories' => ['id', 'name', 'slug', 'parent_id', 'sort_order', 'is_active', 'is_featured', 'content_types'],
            'academic_taxonomies' => ['id', 'parent_id', 'audience', 'kind', 'code', 'name', 'slug', 'sort_order', 'is_active', 'is_official', 'source_url', 'metadata'],
            'subscription_plans' => ['id', 'name', 'slug', 'monthly_price', 'currency_code', 'max_devices', 'offline_days', 'downloads_enabled', 'is_active'],
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

        foreach ([
            'local' => 'diagnostics/private-write-test-',
            'books' => 'diagnostics/books-write-test-',
        ] as $diskName => $prefix) {
            try {
                $probe = $prefix.now()->format('YmdHis').'.txt';
                $disk = Storage::disk($diskName);
                $disk->put($probe, 'ok');
                $this->line(strtoupper($diskName).'_STORAGE_WRITE: '.($disk->exists($probe) ? 'OK' : 'FAILED'));
                $disk->delete($probe);
            } catch (Throwable $e) {
                $this->error(strtoupper($diskName).'_STORAGE_WRITE: ERROR - '.$e->getMessage());
                return self::FAILURE;
            }
        }

        try {
            $disk = Storage::disk('public');
            $probe = 'diagnostics/public-write-test-'.now()->format('YmdHis').'.txt';
            $disk->put($probe, 'ok');
            $exists = $disk->exists($probe);
            $url = $disk->url($probe);
            $this->line('PUBLIC_STORAGE_ROOT: '.config('filesystems.disks.public.root'));
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
