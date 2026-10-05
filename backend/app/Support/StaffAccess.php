<?php

namespace App\Support;

final class StaffAccess
{
    private function __construct() {}

    public static function allows(string $permission): bool
    {
        return (bool) auth()->user()?->profile?->hasStaffPermission($permission);
    }
}
