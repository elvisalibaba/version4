<?php

namespace App\Services;

use App\Models\Book;
use App\Models\BookFormat;
use App\Models\Library;
use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\Profile;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class EasyPayService
{
    public function initialize(Profile $profile, array $data): array
    {
        $order = isset($data['order_id'])
            ? $this->loadPendingOrder($profile, $data['order_id'])
            : $this->createSingleBookOrder($profile, $data);

        if ($order->currency_code !== 'USD') {
            throw ValidationException::withMessages([
                'currency_code' => 'EasyPay est actuellement configuré pour les commandes en USD.',
            ]);
        }

        $channel = $data['channel'] ?? 'ALL';
        $idempotencyKey = (string) ($data['idempotency_key'] ?? 'checkout:'.$profile->id.':'.$order->id);

        $existing = PaymentAttempt::query()
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existing && in_array($existing->status, ['pending', 'processing', 'paid'], true) && $existing->provider_reference) {
            return [
                'orderId' => $order->id,
                'transactionId' => $existing->provider_reference,
                'paymentUrl' => $this->paymentUrl($existing->provider_reference),
                'reused' => true,
            ];
        }

        $attempt = $existing ?? PaymentAttempt::query()->create([
            'user_id' => $profile->id,
            'order_id' => $order->id,
            'provider' => 'easypay',
            'payment_channel' => $channel,
            'idempotency_key' => $idempotencyKey,
            'amount' => $order->total_price,
            'currency_code' => $order->currency_code,
            'status' => 'created',
            'request_payload' => [],
            'response_payload' => [],
        ]);

        $customer = $data['customer'] ?? [];
        $requestPayload = [
            'order_ref' => $order->id,
            'currency' => $order->currency_code,
            'amount' => (float) $order->total_price,
            'description' => $this->description($order),
            'success_url' => $this->frontendUrl('/payment/return?orderId='.$order->id),
            'cancel_url' => $this->frontendUrl('/payment/return?orderId='.$order->id),
            'error_url' => $this->frontendUrl('/payment/return?orderId='.$order->id),
            'language' => 'FR',
            'channels' => $this->channels($channel),
            'customer_name' => trim(($customer['firstName'] ?? '').' '.($customer['lastName'] ?? '')) ?: ($customer['email'] ?? 'Client HolistiqueBooks'),
        ];

        if (! empty($customer['email'])) {
            $requestPayload['customer_email'] = $customer['email'];
        }

        $attempt->update([
            'status' => 'processing',
            'request_payload' => $requestPayload,
        ]);

        try {
            $response = $this->http()->post($this->initializationUrl(), $requestPayload);
            $payload = $response->json();

            if (! $response->successful()) {
                throw new RuntimeException('La passerelle EasyPay est temporairement indisponible.');
            }

            $reference = data_get($payload, 'reference') ?: data_get($payload, 'transaction.reference');
            $code = data_get($payload, 'code');

            if (! $reference || ($code !== null && (string) $code !== '1')) {
                throw new RuntimeException((string) (data_get($payload, 'message') ?: 'EasyPay n’a pas pu initialiser la transaction.'));
            }

            DB::transaction(function () use ($attempt, $order, $reference, $payload, $channel): void {
                $attempt->update([
                    'provider_reference' => $reference,
                    'status' => 'pending',
                    'response_payload' => is_array($payload) ? $payload : [],
                ]);

                $order->update([
                    'payment_status' => 'pending',
                    'payment_provider' => 'easypay',
                    'payment_transaction_id' => $reference,
                    'payment_channel' => $channel,
                    'payment_provider_status' => 'INITIATED',
                    'payment_metadata' => array_merge($order->payment_metadata ?? [], [
                        'payment_attempt_id' => $attempt->id,
                        'provider_reference' => $reference,
                    ]),
                ]);
            });

            return [
                'orderId' => $order->id,
                'transactionId' => $reference,
                'paymentUrl' => $this->paymentUrl($reference),
                'reused' => false,
            ];
        } catch (Throwable $error) {
            $attempt->update([
                'status' => 'failed',
                'failed_at' => now(),
                'failure_reason' => $error->getMessage(),
            ]);

            $order->update([
                'payment_status' => 'failed',
                'payment_provider' => 'easypay',
                'payment_provider_status' => 'INIT_FAILED',
            ]);

            throw $error;
        }
    }

    public function reconcileOrder(Profile $profile, Order $order): array
    {
        abort_unless($order->user_id === $profile->id || $profile->role === 'admin', 404);

        if (! $order->payment_transaction_id) {
            throw ValidationException::withMessages(['order' => 'Cette commande ne possède aucune référence de paiement.']);
        }

        return $this->reconcileReference($order->payment_transaction_id);
    }

    public function reconcileReference(string $reference): array
    {
        $order = Order::query()
            ->where('payment_transaction_id', $reference)
            ->with(['items.book', 'items.format'])
            ->firstOrFail();

        $attempt = PaymentAttempt::query()
            ->where('provider', 'easypay')
            ->where('provider_reference', $reference)
            ->latest()
            ->first();

        $result = $this->verify($reference);
        $providerStatus = strtoupper((string) data_get($result, 'payment.status', 'UNKNOWN'));

        $status = match ($providerStatus) {
            'SUCCESS' => 'paid',
            'CANCELED', 'CANCELLED', 'DECLINED', 'FAILED' => 'failed',
            default => 'pending',
        };

        DB::transaction(function () use ($order, $attempt, $result, $providerStatus, $status): void {
            if ($order->payment_status !== 'paid') {
                $order->payment_status = $status;
            }

            $order->payment_provider = 'easypay';
            $order->payment_provider_status = $providerStatus;
            $order->payment_verified_at = now();
            $order->payment_metadata = array_merge($order->payment_metadata ?? [], [
                'last_verification_at' => now()->toIso8601String(),
                'last_verification' => $result,
            ]);
            $order->save();

            if ($attempt) {
                $attempt->update([
                    'status' => $status,
                    'response_payload' => $result,
                    'verified_at' => now(),
                    'failed_at' => $status === 'failed' ? now() : null,
                ]);
            }

            if ($status === 'paid') {
                $this->grantDigitalPurchases($order);
            }
        });

        return [
            'orderId' => $order->id,
            'paymentStatus' => $order->fresh()->payment_status,
            'providerStatus' => $providerStatus,
            'transactionId' => $reference,
        ];
    }

    public function extractReference(array $payload): ?string
    {
        foreach (['reference', 'cpm_trans_id', 'transaction_id', 'trans_id'] as $key) {
            if (filled($payload[$key] ?? null)) {
                return trim((string) $payload[$key]);
            }
        }

        return data_get($payload, 'transaction.reference') ?: data_get($payload, 'payment.reference');
    }

    private function createSingleBookOrder(Profile $profile, array $data): Order
    {
        $book = Book::query()
            ->where('status', 'published')
            ->where('copyright_status', 'clear')
            ->findOrFail($data['book_id']);

        if (! $book->is_single_sale_enabled) {
            throw ValidationException::withMessages(['book_id' => 'La vente unitaire n’est pas activée pour ce livre.']);
        }

        $requestedFormat = $data['book_format'] ?? null;
        $format = BookFormat::query()
            ->where('book_id', $book->id)
            ->where('is_published', true)
            ->when($requestedFormat, fn ($query) => $query->where('format', $requestedFormat))
            ->whereIn('format', ['holistique_store', 'ebook', 'paperback', 'pocket', 'hardcover'])
            ->orderByRaw("CASE format WHEN 'holistique_store' THEN 1 WHEN 'ebook' THEN 2 WHEN 'paperback' THEN 3 WHEN 'pocket' THEN 4 WHEN 'hardcover' THEN 5 ELSE 99 END")
            ->first();

        if ($requestedFormat && ! $format) {
            throw ValidationException::withMessages(['book_format' => 'Le format sélectionné n’est pas disponible.']);
        }

        $bookFormat = $format?->format ?? 'ebook';

        if (in_array($bookFormat, ['holistique_store', 'ebook'], true)) {
            $alreadyPurchased = Library::query()
                ->where('user_id', $profile->id)
                ->where('book_id', $book->id)
                ->where('access_type', 'purchase')
                ->where('status', 'active')
                ->exists();

            if ($alreadyPurchased) {
                throw ValidationException::withMessages(['book_id' => 'Ce livre a déjà été acheté sur ce compte.']);
            }
        }

        $price = (float) ($format?->price ?? $book->price);
        $currency = $format?->currency_code ?? $book->currency_code;

        return DB::transaction(function () use ($profile, $book, $format, $bookFormat, $price, $currency): Order {
            $order = Order::query()->create([
                'user_id' => $profile->id,
                'total_price' => $price,
                'payment_status' => 'pending',
                'currency_code' => $currency,
                'payment_provider' => 'easypay',
                'payment_metadata' => ['order_source' => 'single_book_checkout'],
            ]);

            $order->items()->create([
                'book_id' => $book->id,
                'format_id' => $format?->id,
                'book_format' => $bookFormat,
                'quantity' => 1,
                'price' => $price,
                'currency_code' => $currency,
            ]);

            return $order->load(['items.book', 'items.format']);
        });
    }

    private function loadPendingOrder(Profile $profile, string $orderId): Order
    {
        $order = Order::query()
            ->where('id', $orderId)
            ->where('user_id', $profile->id)
            ->with(['items.book', 'items.format'])
            ->firstOrFail();

        if ($order->payment_status === 'paid') {
            throw ValidationException::withMessages(['order_id' => 'Cette commande est déjà payée.']);
        }

        if ($order->items->isEmpty()) {
            throw ValidationException::withMessages(['order_id' => 'Cette commande ne contient aucun article.']);
        }

        return $order;
    }

    private function grantDigitalPurchases(Order $order): void
    {
        foreach ($order->items as $item) {
            if (! in_array($item->book_format, ['holistique_store', 'ebook'], true)) {
                continue;
            }

            Library::query()->updateOrCreate(
                ['user_id' => $order->user_id, 'book_id' => $item->book_id],
                [
                    'access_type' => 'purchase',
                    'status' => 'active',
                    'subscription_id' => null,
                    'granted_by_order_id' => $order->id,
                    'granted_by_format_id' => $item->format_id,
                    'expires_at' => null,
                    'purchased_at' => now(),
                    'last_synced_at' => now(),
                ],
            );
        }
    }

    private function verify(string $reference): array
    {
        $lastError = null;

        foreach (['checking-status', 'checking-payment'] as $endpoint) {
            try {
                $response = $this->http()->post($this->baseUrl().'/payment/'.urlencode($reference).'/'.$endpoint, []);
                if ($response->successful() && is_array($response->json())) {
                    return $response->json();
                }
                $lastError = new RuntimeException('EasyPay verification failed with HTTP '.$response->status());
            } catch (Throwable $error) {
                $lastError = $error;
            }
        }

        throw $lastError ?? new RuntimeException('Vérification EasyPay indisponible.');
    }

    private function description(Order $order): string
    {
        $titles = $order->items->pluck('book.title')->filter()->map(
            fn ($title) => trim(str_replace(['#', '
        );

        return $titles->count() === 1
            ? 'Achat livre HolistiqueBooks - '.$titles->first()
            : 'Achat HolistiqueBooks - '.$titles->count().' livres';
    }

    private function channels(string $channel): array
    {
        return match ($channel) {
            'MOBILE_MONEY' => [['channel' => 'MOBILE MONEY']],
            'CREDIT_CARD' => [['channel' => 'CREDIT CARD']],
            default => [['channel' => 'CREDIT CARD'], ['channel' => 'MOBILE MONEY']],
        };
    }

    private function initializationUrl(): string
    {
        $correlationId = config('easypay.correlation_id');
        $publishableKey = config('easypay.publishable_key');

        if (! $correlationId || ! $publishableKey) {
            throw new RuntimeException('Configuration EasyPay incomplète côté Laravel.');
        }

        return $this->baseUrl().'/payment/initialization?cid='.urlencode($correlationId).'&token='.urlencode($publishableKey);
    }

    private function paymentUrl(string $reference): string
    {
        return $this->baseUrl().'/payment/initialization?reference='.urlencode($reference);
    }

    private function frontendUrl(string $path): string
    {
        return config('easypay.frontend_url').$path;
    }

    private function baseUrl(): string
    {
        $mode = config('easypay.mode', 'sandbox');

        if (! in_array($mode, ['sandbox', 'v1'], true)) {
            throw new RuntimeException("EASYPAY_MODE doit être 'sandbox' ou 'v1'.");
        }

        return rtrim(config('easypay.base_url'), '/').'/'.$mode;
    }

    private function http(): PendingRequest
    {
        return Http::acceptJson()
            ->asJson()
            ->connectTimeout(10)
            ->timeout(30)
            ->retry(2, 300, throw: false);
    }
}
, '\\', '/', '_', '&'], ' ', (string) $title))
        );

        return $titles->count() === 1
            ? 'Achat livre HolistiqueBooks - '.$titles->first()
            : 'Achat HolistiqueBooks - '.$titles->count().' livres';
    }

    private function channels(string $channel): array
    {
        return match ($channel) {
            'MOBILE_MONEY' => [['channel' => 'MOBILE MONEY']],
            'CREDIT_CARD' => [['channel' => 'CREDIT CARD']],
            default => [['channel' => 'CREDIT CARD'], ['channel' => 'MOBILE MONEY']],
        };
    }

    private function initializationUrl(): string
    {
        $correlationId = config('easypay.correlation_id');
        $publishableKey = config('easypay.publishable_key');

        if (! $correlationId || ! $publishableKey) {
            throw new RuntimeException('Configuration EasyPay incomplète côté Laravel.');
        }

        return $this->baseUrl().'/payment/initialization?cid='.urlencode($correlationId).'&token='.urlencode($publishableKey);
    }

    private function paymentUrl(string $reference): string
    {
        return $this->baseUrl().'/payment/initialization?reference='.urlencode($reference);
    }

    private function frontendUrl(string $path): string
    {
        return config('easypay.frontend_url').$path;
    }

    private function baseUrl(): string
    {
        $mode = config('easypay.mode', 'sandbox');

        if (! in_array($mode, ['sandbox', 'v1'], true)) {
            throw new RuntimeException("EASYPAY_MODE doit être 'sandbox' ou 'v1'.");
        }

        return rtrim(config('easypay.base_url'), '/').'/'.$mode;
    }

    private function http(): PendingRequest
    {
        return Http::acceptJson()
            ->asJson()
            ->connectTimeout(10)
            ->timeout(30)
            ->retry(2, 300, throw: false);
    }
}
