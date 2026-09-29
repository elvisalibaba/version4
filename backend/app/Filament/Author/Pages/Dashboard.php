<?php

namespace App\Filament\Author\Pages;

use Filament\Pages\Dashboard as BaseDashboard;

class Dashboard extends BaseDashboard
{
    protected static ?string $title = 'Mon studio auteur';

    public function getSubheading(): ?string
    {
        return 'Publiez, suivez vos ventes et pilotez vos revenus depuis votre espace HolisticBooks.';
    }
}
