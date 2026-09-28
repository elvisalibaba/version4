<?php

namespace App\Http\Requests\Book;

use App\Models\Book;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Book::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'author_id' => ['nullable', 'uuid', 'exists:author_profiles,id'],
            'status' => ['nullable', 'in:draft,published,archived,coming_soon'],
            'language' => ['nullable', 'string', 'max:10'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['string', 'max:120'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:120'],
            'is_single_sale_enabled' => ['nullable', 'boolean'],
            'is_subscription_available' => ['nullable', 'boolean'],
            'file' => ['nullable', 'file', 'mimes:pdf,epub', 'max:204800'],
            'file_format' => ['nullable', 'in:pdf,epub'],
            'cover' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
