<?php

namespace Tests\Feature;

use App\Models\AuthorProfile;
use App\Models\Profile;
use App\Models\User;
use App\Support\UploadLimit;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schedule as ScheduleFacade;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Réglages propres à l'hébergement sur le VPS (Docker) : limite d'envoi de
 * 50 Mo alignée sur nginx, et worker de file d'attente dédié.
 */
class VpsHostingConfigTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_upload_limit_defaults_to_fifty_megabytes(): void
    {
        $this->assertSame(51200, UploadLimit::kilobytes());
        $this->assertSame(50, UploadLimit::megabytes());
        $this->assertSame('max:51200', UploadLimit::rule());
        $this->assertStringContainsString('50 Mo', UploadLimit::message());
    }

    public function test_upload_limit_follows_configuration(): void
    {
        config(['holistic.upload_max_kilobytes' => 102400]);

        $this->assertSame(100, UploadLimit::megabytes());
        $this->assertStringContainsString('100 Mo', UploadLimit::message());
    }

    public function test_book_file_above_the_limit_is_rejected_with_a_clear_message(): void
    {
        Storage::fake('books');
        Storage::fake('public');
        $user = $this->author();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/books', [
            'title' => 'Livre trop lourd',
            'file' => UploadedFile::fake()->create('livre.pdf', 51201, 'application/pdf'),
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('errors.file.0', UploadLimit::message());
    }

    public function test_scheduled_queue_worker_is_registered_by_default_for_cpanel(): void
    {
        $this->assertTrue($this->scheduledCommands(true)->contains(fn (string $command) => str_contains($command, 'queue:work')));
    }

    public function test_scheduled_queue_worker_can_be_disabled_when_a_dedicated_worker_runs(): void
    {
        $commands = $this->scheduledCommands(false);

        $this->assertFalse($commands->contains(fn (string $command) => str_contains($command, 'queue:work')));
        // Les autres tâches planifiées restent en place.
        $this->assertTrue($commands->contains(fn (string $command) => str_contains($command, 'reader-sessions:cleanup')));
    }

    /**
     * Recharge routes/console.php dans un planificateur neuf.
     *
     * @return Collection<int, string>
     */
    private function scheduledCommands(bool $scheduledWorker)
    {
        config(['queue.scheduled_worker' => $scheduledWorker]);

        $schedule = new Schedule;
        $this->app->instance(Schedule::class, $schedule);
        ScheduleFacade::swap($schedule);

        require base_path('routes/console.php');

        return collect($schedule->events())->map(fn ($event) => (string) $event->command);
    }

    private function author(): User
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->author()->create(['id' => $user->id, 'email' => $user->email]);

        AuthorProfile::query()->create([
            'id' => $profile->id,
            'display_name' => $profile->name,
            'social_links' => [],
            'genres' => [],
            'press_mentions' => [],
        ]);

        return $user;
    }
}
