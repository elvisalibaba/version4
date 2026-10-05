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
