<?php

namespace App\Console\Commands;

use App\Models\Book;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\RightsContract;
use App\Services\PdfPageImageRenderer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class HolisticHealthCheck extends Command
{
    protected $signature = 'holistic:health {--json : Sortie JSON}';

    protected $description = 'Vérifie les dépendances critiques du backend Holistique Books.';

    public function handle(PdfPageImageRenderer $pdfRenderer): int
    {
        $checks = [];

        $checks['application'] = [
            'ok' => filled(config('app.key'))
                && (! app()->environment('production') || config('app.debug') === false),
            'environment' => app()->environment(),
            'debug' => (bool) config('app.debug'),
            'reader_sessions_required' => (bool) config('reading.require_session', true),
        ];

        $rendererStatus = $pdfRenderer->status();

        $checks['protected_reader'] = [
            'ok' => config('reading.require_session', true) === true
                && $rendererStatus['available'],
            'renderer' => $rendererStatus['preferred_driver'],
            'pdftoppm' => $rendererStatus['pdftoppm'],
            'imagick' => $rendererStatus['imagick'],
            'page_size' => (int) config('books.pdf.reader_page_size', 1800),
        ];

        try {
            DB::select('select 1');
            $checks['database'] = ['ok' => true];
        } catch (Throwable $error) {
            $checks['database'] = ['ok' => false, 'message' => $error->getMessage()];
        }

        foreach (['books', 'public'] as $disk) {
            try {
                Storage::disk($disk)->directories('');
                $checks['disk_'.$disk] = [
                    'ok' => true,
                    'driver' => config("filesystems.disks.{$disk}.driver"),
                ];
            } catch (Throwable $error) {
                $checks['disk_'.$disk] = ['ok' => false, 'message' => $error->getMessage()];
            }
        }

        $checks['catalog'] = [
            'ok' => true,
            'published_books' => Book::query()->where('status', 'published')->count(),
            'rights_to_review' => Book::query()->where('copyright_status', 'review')->count(),
            'active_rights_contracts' => RightsContract::query()->where('status', 'active')->count(),
        ];

        $checks['payments'] = [
            'ok' => true,
            'pending_orders_24h' => Order::query()->where('payment_status', 'pending')->where('created_at', '<=', now()->subDay())->count(),
            'failed_attempts_24h' => PaymentAttempt::query()->where('status', 'failed')->where('created_at', '>=', now()->subDay())->count(),
        ];

        $ok = collect($checks)->every(fn (array $check): bool => (bool) ($check['ok'] ?? false));
        $payload = ['ok' => $ok, 'checked_at' => now()->toIso8601String(), 'checks' => $checks];

        if ($this->option('json')) {
            $this->line((string) json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        } else {
            foreach ($checks as $name => $check) {
                $this->line(($check['ok'] ? '[OK] ' : '[ERREUR] ').$name);
            }
        }

        return $ok ? self::SUCCESS : self::FAILURE;
    }
}
