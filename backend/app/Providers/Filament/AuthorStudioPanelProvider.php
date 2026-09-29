<?php

namespace App\Providers\Filament;

use App\Filament\Author\Pages\Dashboard;
use App\Filament\Author\Widgets\AuthorStudioStatsOverview;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Support\Enums\Width;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AuthorStudioPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->id('studio')
            ->path('studio')
            ->login()
            ->brandName('HolisticBooks Author Studio')
            ->brandLogo(asset('images/holisticbooks-mark.svg'))
            ->brandLogoHeight('2.35rem')
            ->favicon(asset('images/holisticbooks-mark.svg'))
            ->colors([
                'primary' => Color::Emerald,
                'warning' => Color::Amber,
            ])
            ->maxContentWidth(Width::Full)
            ->sidebarCollapsibleOnDesktop()
            ->spa()
            ->unsavedChangesAlerts()
            ->databaseTransactions()
            ->discoverResources(
                in: app_path('Filament/Author/Resources'),
                for: 'App\\Filament\\Author\\Resources',
            )
            ->pages([
                Dashboard::class,
            ])
            ->discoverWidgets(
                in: app_path('Filament/Author/Widgets'),
                for: 'App\\Filament\\Author\\Widgets',
            )
            ->widgets([
                AuthorStudioStatsOverview::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}
