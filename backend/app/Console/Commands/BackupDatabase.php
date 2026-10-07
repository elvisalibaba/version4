<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;

/**
 * Sauvegarde MySQL compressée dans storage/app/backups (hors web).
 * Lancée automatiquement par cpanel-cron.sh avant chaque migration.
 * Ce n'est pas un backup hors site : téléchargez aussi ces fichiers.
 */
class BackupDatabase extends Command
{
    protected $signature = 'holistic:backup-db {--keep=10 : Nombre de sauvegardes conservées}';

    protected $description = 'Sauvegarde la base MySQL (mysqldump) dans storage/app/backups.';

    public function handle(): int
    {
        $connection = config('database.connections.'.config('database.default'));

        if (! in_array($connection['driver'] ?? null, ['mysql', 'mariadb'], true)) {
            $this->warn('Sauvegarde ignorée : la base n’est pas MySQL/MariaDB.');

            return self::SUCCESS;
        }

        $binary = (new ExecutableFinder)->find('mysqldump') ?? (new ExecutableFinder)->find('mariadb-dump');

        if ($binary === null) {
            $this->warn('mysqldump introuvable sur ce serveur : utilisez la sauvegarde cPanel (Backup Wizard).');

            return self::SUCCESS;
        }

        $directory = storage_path('app/backups');
        File::ensureDirectoryExists($directory, 0700);

        $sqlPath = $directory.'/'.$connection['database'].'-'.now()->format('Ymd-His').'.sql';

        $command = [
            $binary,
            '--host='.$connection['host'],
            '--port='.$connection['port'],
            '--user='.$connection['username'],
            '--single-transaction',
            '--quick',
            '--routines',
            '--no-tablespaces',
            '--default-character-set=utf8mb4',
            '--result-file='.$sqlPath,
            $connection['database'],
        ];

        $process = new Process($command, null, ['MYSQL_PWD' => (string) $connection['password']]);
        $process->setTimeout(600);
        $process->run();

        if (! $process->isSuccessful()) {
            File::delete($sqlPath);
            $this->error('Échec mysqldump : '.trim($process->getErrorOutput()));

            return self::FAILURE;
        }

        $gzPath = $sqlPath.'.gz';
        $in = fopen($sqlPath, 'rb');
        $out = gzopen($gzPath, 'wb6');

        while (! feof($in)) {
            gzwrite($out, (string) fread($in, 1024 * 1024));
        }

        fclose($in);
        gzclose($out);
        File::delete($sqlPath);
        chmod($gzPath, 0600);

        $backups = collect(File::glob($directory.'/*.sql.gz'))->sort()->values();
        $backups->slice(0, max(0, $backups->count() - max(1, (int) $this->option('keep'))))
            ->each(fn (string $path) => File::delete($path));

        $this->info('Sauvegarde créée : '.basename($gzPath));

        return self::SUCCESS;
    }
}
