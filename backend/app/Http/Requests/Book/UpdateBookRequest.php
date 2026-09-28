<?php

namespace App\Http\Requests\Book;

use App\Models\Book;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        $book = $this->route('book');

        return $book instanceof Book && ($this->user()?->can('update', $book) ?? false);
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'subtitle' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'author_id' => ['sometimes', 'uuid', 'exists:author_profiles,id'],
            'author_display_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:draft,published,archived,coming_soon'],
            'language' => ['sometimes', 'string', 'max:10'],
            'currency_code' => ['sometimes', 'string', 'size:3'],
            'isbn' => ['sometimes', 'nullable', 'string', 'max:32'],
            'publisher' => ['sometimes', 'nullable', 'string', 'max:255'],
            'publication_date' => ['sometimes', 'nullable', 'date'],
            'page_count' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'co_authors' => ['sometimes', 'array'],
            'co_authors.*' => ['string', 'max:120'],
            'categories' => ['sometimes', 'array'],
            'categories.*' => ['string', 'max:120'],
            'tags' => ['sometimes', 'array'],
            'tags.*' => ['string', 'max:120'],
            'age_rating' => ['sometimes', 'nullable', 'string', 'max:30'],
            'edition' => ['sometimes', 'nullable', 'string', 'max:120'],
            'series_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'series_position' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'cover_alt_text' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sample_pages' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_single_sale_enabled' => ['sometimes', 'boolean'],
            'is_subscription_available' => ['sometimes', 'boolean'],
            'subscription_plan_ids' => ['sometimes', 'array'],
            'subscription_plan_ids.*' => ['uuid', 'exists:subscription_plans,id'],
            'file' => ['sometimes', 'file', 'mimes:pdf,epub', 'max:204800'],
            'file_format' => ['sometimes', 'in:pdf,epub'],
            'cover' => ['sometimes', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'sample' => ['sometimes', 'file', 'mimes:pdf,epub', 'max:51200'],
        ];
    }
}
