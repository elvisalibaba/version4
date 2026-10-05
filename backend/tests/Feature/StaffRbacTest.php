<?php

namespace Tests\Feature;

use App\Models\Profile;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class StaffRbacTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_legacy_admin_without_staff_role_keeps_super_admin_access(): void
    {
        $profile = Profile::factory()->admin()->create([
            'staff_role' => null,
            'staff_permissions' => null,
        ]);

        $this->assertTrue($profile->isSuperAdmin());
        $this->assertTrue($profile->hasStaffPermission('catalog.publish'));
        $this->assertTrue($profile->hasStaffPermission('finance.manage'));
        $this->assertTrue($profile->hasStaffPermission('rights.manage'));
    }

    public function test_finance_role_cannot_publish_or_manage_rights(): void
    {
        $profile = Profile::factory()->admin()->create([
            'staff_role' => 'finance',
            'staff_permissions' => [],
        ]);

        $this->assertTrue($profile->hasStaffPermission('finance.manage'));
        $this->assertTrue($profile->hasStaffPermission('commerce.manage'));
        $this->assertFalse($profile->hasStaffPermission('catalog.publish'));
        $this->assertFalse($profile->hasStaffPermission('rights.manage'));
        $this->assertFalse($profile->hasStaffPermission('marketing.manage'));
    }

    public function test_marketing_role_cannot_manage_finance_or_rights(): void
    {
        $profile = Profile::factory()->admin()->create([
            'staff_role' => 'marketing',
            'staff_permissions' => [],
        ]);

        $this->assertTrue($profile->hasStaffPermission('marketing.manage'));
        $this->assertTrue($profile->hasStaffPermission('pricing.manage'));
        $this->assertFalse($profile->hasStaffPermission('finance.manage'));
        $this->assertFalse($profile->hasStaffPermission('rights.manage'));
    }

    public function test_explicit_extra_permission_extends_role_without_becoming_super_admin(): void
    {
        $profile = Profile::factory()->admin()->create([
            'staff_role' => 'editor',
            'staff_permissions' => ['marketing.manage'],
        ]);

        $this->assertFalse($profile->isSuperAdmin());
        $this->assertTrue($profile->hasStaffPermission('catalog.manage'));
        $this->assertTrue($profile->hasStaffPermission('marketing.manage'));
        $this->assertFalse($profile->hasStaffPermission('finance.manage'));
    }

    public function test_non_admin_never_receives_staff_permissions(): void
    {
        $profile = Profile::factory()->author()->create([
            'staff_role' => 'super_admin',
            'staff_permissions' => ['*'],
        ]);

        $this->assertFalse($profile->hasStaffPermission('finance.manage'));
        $this->assertFalse($profile->isSuperAdmin());
    }
}
