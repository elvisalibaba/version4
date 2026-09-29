<?php

namespace App\Console\Commands;

use App\Services\AuthorRoyaltyService;
use Illuminate\Console\Command;

class ReleaseAuthorRoyalties extends Command
{
    protected $signature = 'royalties:release-payable';

    protected $description = 'Déplace les royalties arrivées à échéance vers le solde disponible des auteurs.';

    public function handle(AuthorRoyaltyService $royalties): int
    {
        $count = $royalties->releasePayable();

        $this->info("{$count} écriture(s) de royalty rendue(s) disponible(s).");

        return self::SUCCESS;
    }
}
