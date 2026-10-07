<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\EasyPayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function initialize(Request $request, EasyPayService $payments): JsonResponse
    {
        $data = $request->validate([
            'book_id' => ['nullable', 'required_without:order_id', 'uuid', 'exists:books,id'],
            'order_id' => ['nullable', 'required_without:book_id', 'uuid', 'exists:orders,id'],
            'book_format' => ['nullable', Rule::in(['holistique_store', 'ebook', 'paperback', 'pocket', 'hardcover'])],
            'channel' => ['nullable', Rule::in(['ALL', 'MOBILE_MONEY', 'CREDIT_CARD'])],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'market_country_code' => ['nullable', 'string', 'size:2'],
            'idempotency_key' => ['nullable', 'string', 'max:255'],
            'customer' => ['required', 'array'],
            'customer.firstName' => ['nullable', 'required_without:customer.lastName', 'string', 'max:120'],
            'customer.lastName' => ['nullable', 'required_without:customer.firstName', 'string', 'max:120'],
            'customer.email' => ['nullable', 'email', 'max:255'],
        ]);

        $profile = $request->user()->profile;
        abort_unless($profile !== null, 403);

        return response()->json([
            'data' => $payments->initialize($profile, $data),
        ]);
    }

    public function reconcile(Request $request, Order $order, EasyPayService $payments): JsonResponse
    {
        $profile = $request->user()->profile;
        abort_unless($profile !== null, 403);

        return response()->json([
            'data' => $payments->reconcileOrder($profile, $order),
        ]);
    }

    public function notify(Request $request, EasyPayService $payments): JsonResponse
    {
        $payload = $request->all();
        $reference = $payments->extractReference($payload);

        if (! $reference) {
            return response()->json(['message' => 'Référence de paiement manquante.'], 422);
        }

        return response()->json([
            'ok' => true,
            'data' => $payments->reconcileReference($reference),
        ]);
    }
}
