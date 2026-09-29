<?php

use App\Providers\AppServiceProvider;
use App\Providers\Filament\AdminPanelProvider;
use App\Providers\Filament\AuthorStudioPanelProvider;

return [
    AppServiceProvider::class,
    AdminPanelProvider::class,
    AuthorStudioPanelProvider::class,
];
