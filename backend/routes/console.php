<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('royalties:release-payable')
    ->dailyAt('02:00')
    ->withoutOverlapping();

Schedule::command('rights:expire-contracts')
    ->dailyAt('01:30')
    ->withoutOverlapping();

Schedule::command('reader-sessions:cleanup')
    ->hourly()
    ->withoutOverlapping();

// cPanel sans SSH : pas de worker permanent possible. La file d'attente
// (e-mails de bienvenue, reçus de paiement…) est vidée chaque minute par le
// cron unique `cpanel-cron.sh` → schedule:run.
Schedule::command('queue:work --stop-when-empty --max-time=50 --tries=3 --backoff=30')
    ->everyMinute()
    ->withoutOverlapping(5)
    // En arrière-plan : schedule:run rend la main tout de suite au cron.
    ->runInBackground();

Schedule::command('sanctum:prune-expired --hours=24')
    ->daily();

Schedule::command('queue:prune-failed --hours=720')
    ->weekly();
