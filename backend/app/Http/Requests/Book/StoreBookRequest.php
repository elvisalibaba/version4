<?php

namespace App\Http\Requests\Book;

use App\Models\Book;
use Illuminate\Foundation\Http\FormRequest;

class StoreBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Book::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'author_id' => ['nullable', 'uuid', 'exists:author_profiles,id'],
            'author_display_name' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:draft,published,archived,coming_soon'],
            'language' => ['nullable', 'string', 'max:10'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'isbn' => ['nullable', 'string', 'max:32'],
            'publisher' => ['nullable', 'string', 'max:255'],
            'publication_date' => ['nullable', 'date'],
            'page_count' => ['nullable', 'integer', 'min:1'],
            'co_authors' => ['nullable', 'array'],
            'co_authors.*' => ['string', 'max:120'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['string', 'max:120'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:120'],
            'age_rating' => ['nullable', 'string', 'max:30'],
            'edition' => ['nullable', 'string', 'max:120'],
            'series_name' => ['nullable', 'string', 'max:255'],
            'series_position' => ['nullable', 'integer', 'min:1'],
            'cover_alt_text' => ['nullable', 'string', 'max:255'],
            'sample_pages' => ['nullable', 'integer', 'min:0'],
            'is_single_sale_enabled' => ['nullable', 'boolean'],
            'is_subscription_available' => ['nullable', 'boolean'],
            'subscription_plan_ids' => ['nullable', 'array'],
            'subscription_plan_ids.*' => ['uuid', 'exists:subscription_plans,id'],
            'file' => ['nullable', 'file', 'mimes:pdf,epub', 'max:204800'],
            'file_format' => ['nullable', 'in:pdf,epub'],
            'cover' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'sample' => ['nullable', 'file', 'mimes:pdf,epub', 'max:51200'],
        ];
    }
}
