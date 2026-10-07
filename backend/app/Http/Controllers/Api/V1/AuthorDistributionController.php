<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookDistributionSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AuthorDistributionController extends Controller
{
    public function show(Request $request, Book $book): JsonResponse
    {
        $this->assertOwnsBook($request, $book);

        return response()->json([
            'data' => $book->distributionSetting,
        ]);
    }

    public function upsert(Request $request, Book $book): JsonResponse
    {
        $this->assertOwnsBook($request, $book);

        $data = $request->validate([
            'primary_market' => ['required', 'string', 'size:2'],
            'territory_mode' => ['required', Rule::in(['worldwide', 'selected'])],
            'territories' => ['nullable', 'array'],
            'territories.*' => ['string', 'size:2'],
            'sales_channels' => ['nullable', 'array'],
            'sales_channels.*' => ['string', 'max:50'],
            'local_currency' => ['required', 'string', 'size:3'],
            'royalty_rate' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'preorder_enabled' => ['nullable', 'boolean'],
            'launch_date' => ['nullable', 'date'],
            'print_on_demand_enabled' => ['nullable', 'boolean'],
            'local_print_enabled' => ['nullable', 'boolean'],
            'institutional_sales_enabled' => ['nullable', 'boolean'],
            'bookstore_distribution_enabled' => ['nullable', 'boolean'],
            'distribution_notes' => ['nullable', 'string', 'max:5000'],
        ]);

        // Le taux de royalties est une condition contractuelle : seul le staff
        // finance peut le fixer. Un auteur qui l'envoie est simplement ignoré.
        if (! $request->user()->profile->hasStaffPermission('finance.manage')) {
            unset($data['royalty_rate']);
        }

        $data['territories'] = $data['territories'] ?? [];
        $data['sales_channels'] = $data['sales_channels'] ?? ['web_store', 'mobile_app'];

        $settings = BookDistributionSetting::query()->updateOrCreate(
            ['book_id' => $book->id],
            $data,
        );

        return response()->json(['data' => $settings]);
    }

    private function assertOwnsBook(Request $request, Book $book): void
    {
        $profile = $request->user()->profile;
        abort_unless($profile && in_array($profile->role, ['author', 'admin'], true), 403);
        abort_unless($profile->role === 'admin' || $book->author_id === $profile->id, 404);
    }
}
