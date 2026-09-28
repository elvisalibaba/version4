<?php

namespace App\Http\Requests\Book;

use App\Models\Book;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBookRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $book = $this->route('book');

        return $book instanceof Book && ($this->user()?->can('update', $book) ?? false);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'author_id' => ['sometimes', 'uuid', 'exists:author_profiles,id'],
            'status' => ['sometimes', 'in:draft,published,archived,coming_soon'],
            'language' => ['sometimes', 'string', 'max:10'],
            'currency_code' => ['sometimes', 'string', 'size:3'],
            'categories' => ['sometimes', 'array'],
            'categories.*' => ['string', 'max:120'],
            'tags' => ['sometimes', 'array'],
            'tags.*' => ['string', 'max:120'],
            'is_single_sale_enabled' => ['sometimes', 'boolean'],
            'is_subscription_available' => ['sometimes', 'boolean'],
            'file' => ['sometimes', 'file', 'mimes:pdf,epub', 'max:204800'],
            'file_format' => ['sometimes', 'in:pdf,epub'],
            'cover' => ['sometimes', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
