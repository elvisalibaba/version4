<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

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
            'payment_provider' => ['nullable', 'string', 'max:100'],
            'payment_channel' => ['nullable', 'string', 'max:100'],
        ];
    }
}
