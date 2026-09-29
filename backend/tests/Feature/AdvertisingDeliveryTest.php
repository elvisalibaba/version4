<?php

namespace Tests\Feature;

use App\Models\AdAssignment;
use App\Models\AdCampaign;
use App\Models\AdCreative;
use App\Models\AdPlacement;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class AdvertisingDeliveryTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_active_ad_can_be_served_and_impression_is_recorded(): void
    {
        $campaign = AdCampaign::query()->create([
            'advertiser_name' => 'Annonceur Test',
            'name' => 'Campagne Test',
            'objective' => 'awareness',
            'status' => 'active',
            'channels' => ['web', 'mobile'],
            'budget' => 500,
            'spent' => 0,
            'currency_code' => 'USD',
            'starts_at' => now()->subMinute(),
            'ends_at' => now()->addDay(),
        ]);

        $placement = AdPlacement::query()->create([
            'code' => 'test.web.banner',
            'name' => 'Test banner',
            'channel' => 'web',
            'surface' => 'test',
            'position' => 'inline',
            'allowed_creative_types' => ['banner'],
            'is_active' => true,
        ]);

        $creative = AdCreative::query()->create([
            'campaign_id' => $campaign->id,
            'title' => 'Creative Test',
            'creative_type' => 'banner',
            'headline' => 'Découvrez notre annonceur',
            'click_url' => 'https://example.org',
            'is_active' => true,
        ]);

        $assignment = AdAssignment::query()->create([
            'campaign_id' => $campaign->id,
            'creative_id' => $creative->id,
            'placement_id' => $placement->id,
            'status' => 'active',
            'weight' => 100,
        ]);

        $this->getJson('/api/v1/ads/test.web.banner?channel=web')
            ->assertOk()
            ->assertJsonPath('data.assignment_id', $assignment->id)
            ->assertJsonPath('data.creative.headline', 'Découvrez notre annonceur');

        $this->postJson("/api/v1/ads/{$assignment->id}/events", [
            'event_type' => 'impression',
            'session' => 'test-session',
            'context' => ['channel' => 'web'],
        ])->assertCreated();

        $this->assertDatabaseHas('ad_events', [
            'assignment_id' => $assignment->id,
            'event_type' => 'impression',
        ]);
    }

    public function test_campaign_is_not_served_on_unapproved_channel(): void
    {
        $campaign = AdCampaign::query()->create([
            'advertiser_name' => 'Annonceur Web',
            'name' => 'Web only',
            'objective' => 'traffic',
            'status' => 'active',
            'channels' => ['web'],
            'budget' => 100,
            'spent' => 0,
            'currency_code' => 'USD',
        ]);

        $placement = AdPlacement::query()->create([
            'code' => 'test.mobile.banner',
            'name' => 'Mobile banner',
            'channel' => 'mobile',
            'surface' => 'home',
            'allowed_creative_types' => ['banner'],
            'is_active' => true,
        ]);

        $creative = AdCreative::query()->create([
            'campaign_id' => $campaign->id,
            'title' => 'Web creative',
            'creative_type' => 'banner',
            'is_active' => true,
        ]);

        AdAssignment::query()->create([
            'campaign_id' => $campaign->id,
            'creative_id' => $creative->id,
            'placement_id' => $placement->id,
            'status' => 'active',
            'weight' => 100,
        ]);

        $this->getJson('/api/v1/ads/test.mobile.banner?channel=mobile')
            ->assertOk()
            ->assertJsonPath('data', null);
    }
}
