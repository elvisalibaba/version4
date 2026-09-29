<?php

namespace Tests\Feature\Api\V1;

use App\Models\Book;
use App\Models\BookFormat;
use App\Models\Profile;
use App\Models\User;
use App\Notifications\PaymentReceiptNotification;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('easypay.base_url', 'https://payments.test');
        config()->set('easypay.mode', 'sandbox');
        config()->set('easypay.correlation_id', 'test-cid');
        config()->set('easypay.token', 'test-token');
        config()->set('easypay.frontend_url', 'https://holistique-books.test');
    }

    public function test_reader_can_initialize_an_easypay_checkout_through_laravel(): void
    {
        [$user, $profile] = $this->reader();
        Sanctum::actingAs($user);

        $book = Book::factory()->create([
            'title' => 'Livre paiement',
            'price' => 12.50,
            'currency_code' => 'USD',
            'is_single_sale_enabled' => true,
        ]);

        BookFormat::factory()->create([
            'book_id' => $book->id,
            'format' => 'ebook',
            'price' => 12.50,
            'currency_code' => 'USD',
            'is_published' => true,
        ]);

        Http::fake([
            '*payment/initialization*' => Http::response([
                'code' => 1,
                'reference' => 'EP-TEST-001',
                'message' => 'OK',
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/payments/easypay/init', [
            'book_id' => $book->id,
            'book_format' => 'ebook',
            'channel' => 'MOBILE_MONEY',
            'customer' => [
                'firstName' => 'Elvis',
                'lastName' => 'Makasi',
                'email' => 'reader@example.com',
            ],
        ]);

        Http::assertSent(function ($request): bool {
            $payload = $request->data();
            $orderRef = (string) ($payload['order_ref'] ?? '');

            return str_contains($request->url(), '/sandbox/payment/initialization')
                && str_contains($request->url(), 'cid=test-cid')
                && str_contains($request->url(), 'token=test-token')
                && preg_match('/^[A-Z0-9]{6,16}$/', $orderRef) === 1
                && ($payload['currency'] ?? null) === 'USD'
                && ($payload['channels'] ?? null) === [['channel' => 'MOBILE MONEY']]
                && ($payload['customer_name'] ?? null) === 'Elvis Makasi';
        });

        $response->assertOk()
            ->assertJsonPath('data.transactionId', 'EP-TEST-001')
            ->assertJsonPath('data.paymentUrl', 'https://payments.test/sandbox/payment/initialization?reference=EP-TEST-001');

        $orderId = $response->json('data.orderId');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'user_id' => $profile->id,
            'payment_status' => 'pending',
            'payment_provider' => 'easypay',
            'payment_transaction_id' => 'EP-TEST-001',
        ]);

        $this->assertDatabaseHas('payment_attempts', [
            'order_id' => $orderId,
            'user_id' => $profile->id,
            'provider' => 'easypay',
            'provider_reference' => 'EP-TEST-001',
            'status' => 'pending',
        ]);
    }

    public function test_reader_can_initialize_cdf_easypay_checkout(): void
    {
        [$user] = $this->reader();
        Sanctum::actingAs($user);

        $book = Book::factory()->create([
            'title' => 'Livre CDF',
            'price' => 25000,
            'currency_code' => 'CDF',
            'is_single_sale_enabled' => true,
        ]);

        BookFormat::factory()->create([
            'book_id' => $book->id,
            'format' => 'ebook',
            'price' => 25000,
            'currency_code' => 'CDF',
            'is_published' => true,
        ]);

        Http::fake([
            '*payment/initialization*' => Http::response([
                'code' => 1,
                'reference' => 'EP-CDF-001',
            ], 200),
        ]);

        $this->postJson('/api/v1/payments/easypay/init', [
            'book_id' => $book->id,
            'book_format' => 'ebook',
            'channel' => 'ALL',
            'customer' => [
                'firstName' => 'Elvis',
                'lastName' => 'Makasi',
            ],
        ])->assertOk();

        Http::assertSent(function ($request): bool {
            $payload = $request->data();

            return ($payload['currency'] ?? null) === 'CDF'
                && (float) ($payload['amount'] ?? 0) === 25000.0
                && ($payload['channels'] ?? null) === [
                    ['channel' => 'CREDIT CARD'],
                    ['channel' => 'MOBILE MONEY'],
                ];
        });
    }

    public function test_verified_successful_payment_grants_digital_library_access(): void
    {
        Notification::fake();
        [$user] = $this->reader();
        Sanctum::actingAs($user);

        $book = Book::factory()->create([
            'price' => 8,
            'currency_code' => 'USD',
            'is_single_sale_enabled' => true,
        ]);

        BookFormat::factory()->create([
            'book_id' => $book->id,
            'format' => 'ebook',
            'price' => 8,
            'currency_code' => 'USD',
            'is_published' => true,
        ]);

        Http::fake([
            '*payment/initialization*' => Http::response([
                'code' => 1,
                'reference' => 'EP-TEST-PAID',
            ], 200),
            '*checking-status*' => Http::response([
                'transaction' => ['reference' => 'EP-TEST-PAID'],
                'payment' => ['status' => 'SUCCESS', 'channel' => 'MOBILE MONEY'],
            ], 200),
        ]);

        $init = $this->postJson('/api/v1/payments/easypay/init', [
            'book_id' => $book->id,
            'book_format' => 'ebook',
            'channel' => 'MOBILE_MONEY',
            'customer' => ['firstName' => 'Lecteur', 'lastName' => 'Test', 'email' => 'reader@example.com'],
        ])->assertOk();

        $orderId = $init->json('data.orderId');

        $this->postJson("/api/v1/payments/easypay/orders/{$orderId}/reconcile")
            ->assertOk()
            ->assertJsonPath('data.paymentStatus', 'paid');

        $this->assertDatabaseHas('orders', [
            'id' => $orderId,
            'payment_status' => 'paid',
            'payment_provider_status' => 'SUCCESS',
        ]);

        $this->assertDatabaseHas('library', [
            'user_id' => $user->id,
            'book_id' => $book->id,
            'access_type' => 'purchase',
            'status' => 'active',
        ]);

        Notification::assertSentTo($user, PaymentReceiptNotification::class);
        $this->assertNotNull(\App\Models\Order::query()->findOrFail($orderId)->payment_receipt_sent_at);
    }

    public function test_unauthenticated_checkout_is_rejected(): void
    {
        $this->postJson('/api/v1/payments/easypay/init', [])
            ->assertUnauthorized();
    }

    /**
     * @return array{0: User, 1: Profile}
     */
    private function reader(): array
    {
        $user = User::factory()->create(['email' => 'reader@example.com', 'email_verified_at' => now()]);
        $profile = Profile::factory()->create([
            'id' => $user->id,
            'email' => $user->email,
            'role' => 'reader',
        ]);

        return [$user, $profile];
    }
}
