<?php

namespace App\Console\Commands;

use App\Models\RightsContract;
use Illuminate\Console\Command;

class ExpireRightsContracts extends Command
{
    protected $signature = 'rights:expire-contracts';
    protected $description = 'Marque comme expirés les contrats de droits actifs arrivés à échéance.';

    public function handle(): int
    {
        $count = RightsContract::query()
            ->where('status', 'active')
            ->whereNotNull('ends_at')
            ->whereDate('ends_at', '<', today())
            ->update(['status' => 'expired']);

        $this->info("Contrats arrivés à échéance: {$count}.");

        return self::SUCCESS;
    }
}
