<?php

namespace Database\Factories;

use App\Models\OrderItem;
use App\Models\Book;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'book_id' => Book::factory(),
            'price' => 9.99,
            'currency_code' => 'USD',
            'book_format' => 'ebook',
            'quantity' => 1,
        ];
    }
}
