<?php

namespace App\Filament\Resources\AuditEvents\Pages;

use App\Filament\Resources\AuditEvents\PlatformAuditEventResource;
use Filament\Resources\Pages\ListRecords;

class ListPlatformAuditEvents extends ListRecords
{
    protected static string $resource = PlatformAuditEventResource::class;
}
