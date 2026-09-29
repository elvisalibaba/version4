<?php

namespace App\Filament\Pages;

use Filament\Pages\Dashboard as BaseDashboard;

class Dashboard extends BaseDashboard
{
    protected static ?string $title = 'Direction éditoriale';

    public function getSubheading(): ?string
    {
        return 'Pilotez la maison d’édition : catalogue, acquisitions de droits, auteurs, audio & vidéo, publicité, ventes, paiements et opérations depuis un seul centre de contrôle.';
    }

    public function getColumns(): int|array
    {
        return [
            'default' => 1,
            'md' => 2,
            'xl' => 4,
        ];
    }
}
