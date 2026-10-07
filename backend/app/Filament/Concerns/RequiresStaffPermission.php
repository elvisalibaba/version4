<?php

namespace App\Filament\Concerns;

use App\Support\StaffAccess;
use Illuminate\Database\Eloquent\Model;

/**
 * Restreint une ressource du back-office aux membres du staff qui détiennent
 * la permission déclarée par la ressource :
 *
 *   protected static string $staffManagePermission = 'catalog.manage';
 *   protected static ?string $staffViewPermission = 'catalog.view'; // optionnel
 *
 * Sans cela, tout compte `admin` (support, analyste, marketing…) pouvait
 * créer, modifier et supprimer les enregistrements de la ressource.
 */
trait RequiresStaffPermission
{
    public static function canViewAny(): bool
    {
        return static::staffCanManage() || static::staffCanView();
    }

    public static function canView(Model $record): bool
    {
        return static::staffCanManage() || static::staffCanView();
    }

    public static function canCreate(): bool
    {
        return static::staffCanManage();
    }

    public static function canEdit(Model $record): bool
    {
        return static::staffCanManage();
    }

    public static function canDelete(Model $record): bool
    {
        return static::staffCanManage();
    }

    public static function canDeleteAny(): bool
    {
        return static::staffCanManage();
    }

    protected static function staffCanManage(): bool
    {
        return StaffAccess::allows(static::$staffManagePermission);
    }

    protected static function staffCanView(): bool
    {
        $permission = static::$staffViewPermission ?? null;

        return is_string($permission) && StaffAccess::allows($permission);
    }
}
