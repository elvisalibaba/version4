<?php

namespace App\Console\Commands;

use App\Models\BookReaderSession;
use Illuminate\Console\Command;

class CleanupReaderSessions extends Command
{
    protected $signature = 'reader-sessions:cleanup {--days=7 : Supprimer aussi les sessions révoquées plus anciennes que N jours}';
    protected $description = 'Nettoie les sessions de lecture expirées et révoquées.';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));

        $expired = BookReaderSession::query()
            ->where('expires_at', '<=', now())
            ->delete();

        $revoked = BookReaderSession::query()
            ->whereNotNull('revoked_at')
            ->where('revoked_at', '<=', now()->subDays($days))
            ->delete();

        $this->info("Sessions expirées supprimées: {$expired}; sessions révoquées archivées: {$revoked}.");

        return self::SUCCESS;
    }
}
