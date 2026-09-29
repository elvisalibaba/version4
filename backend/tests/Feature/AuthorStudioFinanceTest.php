<?php

namespace Tests\Feature;

use App\Models\AuthorPayoutAccount;
use App\Models\AuthorProfile;
use App\Models\AuthorRoyaltyAccount;
use App\Models\AuthorRoyaltyTransaction;
use App\Models\Book;
use App\Models\BookFormat;
use App\Models\Order;
use App\Models\Profile;
use App\Models\User;
use App\Services\AuthorRoyaltyService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class AuthorStudioFinanceTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_paid_order_can_accrue_author_royalty(): void
    {
        [$authorUser] = $this->author();

        $book = Book::factory()->create([
            'author_id' => $authorUser->id,
            'price' => 10,
            'currency_code' => 'USD',
        ]);

        $format = BookFormat::factory()->create([
            'book_id' => $book->id,
            'format' => 'ebook',
            'price' => 10,
            'currency_code' => 'USD',
            'printing_cost' => null,
        ]);

        $buyer = User::factory()->create();
        Profile::factory()->create([
            'id' => $buyer->id,
            'email' => $buyer->email,
            'role' => 'reader',
        ]);

        $order = Order::query()->create([
            'user_id' => $buyer->id,
            'total_price' => 10,
            'currency_code' => 'USD',
            'payment_status' => 'paid',
            'payment_provider' => 'easypay',
            'payment_transaction_id' => 'ROYALTY-TEST-1',
        ]);

        $item = $order->items()->create([
            'book_id' => $book->id,
            'format_id' => $format->id,
            'book_format' => 'ebook',
            'quantity' => 1,
            'price' => 10,
            'currency_code' => 'USD',
        ]);

        app(AuthorRoyaltyService::class)->accrueOrder($order);

        $this->assertDatabaseHas('author_royalty_transactions', [
            'user_id' => $authorUser->id,
            'book_id' => $book->id,
            'order_item_id' => $item->id,
            'gross_amount' => 10,
            'status' => 'pending',
        ]);

        $account = AuthorRoyaltyAccount::query()->findOrFail($authorUser->id);

        $this->assertEquals(7.00, (float) $account->pending_balance);
        $this->assertEquals(7.00, (float) $account->lifetime_earnings);
    }

    public function test_payable_royalty_moves_to_available_balance(): void
    {
        [$authorUser] = $this->author();

        AuthorRoyaltyAccount::query()->create([
            'user_id' => $authorUser->id,
            'currency_code' => 'USD',
            'pending_balance' => 14,
            'available_balance' => 0,
            'lifetime_earnings' => 14,
            'minimum_payout' => 10,
            'status' => 'active',
        ]);

        $book = Book::factory()->create(['author_id' => $authorUser->id]);

        AuthorRoyaltyTransaction::query()->create([
            'user_id' => $authorUser->id,
            'book_id' => $book->id,
            'source' => 'ebook',
            'gross_amount' => 20,
            'printing_cost' => 0,
            'platform_fee' => 6,
            'tax_withholding' => 0,
            'royalty_rate' => 0.70,
            'net_royalty' => 14,
            'currency_code' => 'USD',
            'status' => 'pending',
            'earned_at' => now()->subDays(40),
            'payable_at' => now()->subMinute(),
            'metadata' => [],
        ]);

        $released = app(AuthorRoyaltyService::class)->releasePayable();

        $this->assertSame(1, $released);

        $account = AuthorRoyaltyAccount::query()->findOrFail($authorUser->id);

        $this->assertEquals(0.00, (float) $account->pending_balance);
        $this->assertEquals(14.00, (float) $account->available_balance);
        $this->assertDatabaseHas('author_royalty_transactions', [
            'user_id' => $authorUser->id,
            'status' => 'payable',
        ]);
    }

    public function test_author_can_request_payout_on_verified_account(): void
    {
        [$authorUser] = $this->author();

        AuthorRoyaltyAccount::query()->create([
            'user_id' => $authorUser->id,
            'currency_code' => 'USD',
            'pending_balance' => 0,
            'available_balance' => 50,
            'lifetime_earnings' => 50,
            'minimum_payout' => 10,
            'status' => 'active',
        ]);

        $payoutAccount = AuthorPayoutAccount::query()->create([
            'user_id' => $authorUser->id,
            'method' => 'mobile_money',
            'provider' => 'Airtel Money',
            'country_code' => 'CD',
            'currency_code' => 'USD',
            'account_name' => 'Auteur Test',
            'account_identifier' => '+243000000000',
            'is_default' => true,
            'is_verified' => true,
            'verified_at' => now(),
        ]);

        $payout = app(AuthorRoyaltyService::class)->requestPayout(
            $authorUser->id,
            $payoutAccount,
            20,
        );

        $this->assertSame('requested', $payout->status);
        $this->assertEquals(20.00, (float) $payout->amount);

        $account = AuthorRoyaltyAccount::query()->findOrFail($authorUser->id);
        $this->assertEquals(30.00, (float) $account->available_balance);
    }

    /**
     * @return array{0: User, 1: Profile}
     */
    private function author(): array
    {
        $user = User::factory()->create(['email' => 'author@example.com']);

        $profile = Profile::factory()->create([
            'id' => $user->id,
            'email' => $user->email,
            'role' => 'author',
        ]);

        AuthorProfile::query()->create([
            'id' => $user->id,
            'display_name' => 'Auteur Test',
            'genres' => [],
            'social_links' => [],
            'press_mentions' => [],
        ]);

        return [$user, $profile];
    }
}
