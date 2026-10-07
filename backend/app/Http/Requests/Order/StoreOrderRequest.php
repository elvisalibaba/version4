<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.book_id' => ['required', 'uuid', 'exists:books,id'],
            'items.*.format_id' => ['nullable', 'uuid', 'exists:book_formats,id'],
            'items.*.book_format' => ['required', 'in:holistique_store,ebook,paperback,pocket,hardcover,audiobook'],
            'items.*.quantity' => ['nullable', 'integer', 'min:1', 'max:100'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'market_country_code' => ['nullable', 'string', 'size:2'],
            'payment_provider' => ['nullable', 'string', 'max:100'],
            'payment_channel' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * Un même livre dans un même format ne peut figurer qu'une fois
     * (contrainte UNIQUE order_id/book_id/book_format) : on renvoie une
     * erreur 422 lisible au lieu d'une erreur SQL.
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $keys = collect($this->input('items', []))
                    ->filter(fn ($item): bool => is_array($item))
                    ->map(fn (array $item): string => ($item['book_id'] ?? '').'|'.($item['book_format'] ?? ''));

                if ($keys->count() !== $keys->unique()->count()) {
                    $validator->errors()->add('items', 'Un même livre ne peut apparaître qu’une fois par format : ajustez plutôt la quantité.');
                }
            },
        ];
    }
}
