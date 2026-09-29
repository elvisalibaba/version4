<?php

namespace App\Filament\Pages;

use Filament\Pages\Dashboard as BaseDashboard;

class Dashboard extends BaseDashboard
{
    protected static ?string $title = 'Centre de pilotage';

    public function getSubheading(): ?string
    {
        return 'Catalogue, ventes, auteurs, paiements et opérations éditoriales en un seul endroit.';
    }
}
