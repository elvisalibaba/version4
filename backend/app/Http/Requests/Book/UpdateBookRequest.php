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

            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'currency_code' => ['sometimes', 'string', 'size:3'],

            'author_id' => ['sometimes', 'nullable', 'uuid', 'exists:author_profiles,id'],
            'authorship_type' => ['sometimes', 'in:named,collective,institutional,anonymous,traditional,sacred_text'],
            'author_credit' => ['sometimes', 'nullable', 'string', 'max:255'],
            'author_display_name' => ['sometimes', 'nullable', 'string', 'max:255'],

            'status' => ['sometimes', 'in:draft,published,archived,coming_soon'],
            'editorial_pole' => ['sometimes', 'in:general,ecclesial,institutional,entrepreneurial'],
            'work_type' => ['sometimes', 'in:book,bible,theology,devotional,sermon,prayer,hymnal,study_guide,academic,manual,essay,novel,biography,magazine,report,other'],
            'editorial_stage' => ['sometimes', 'in:'.implode(',', BookEditorialWorkflow::STAGES)],
            'spiritual_metadata' => ['sometimes', 'nullable', 'array'],
            'ingestion_metadata' => ['sometimes', 'nullable', 'array'],

            'language' => ['sometimes', 'nullable', 'string', 'max:10'],
            'isbn' => ['sometimes', 'nullable', 'string', 'max:50'],
            'publisher' => ['sometimes', 'nullable', 'string', 'max:255'],
            'publication_date' => ['sometimes', 'nullable', 'date'],
            'page_count' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'edition' => ['sometimes', 'nullable', 'string', 'max:255'],
            'series_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'series_position' => ['sometimes', 'nullable', 'integer', 'min:1'],

            'co_authors' => ['sometimes', 'array'],
            'co_authors.*' => ['string', 'max:255'],
            'categories' => ['sometimes', 'array'],
            'categories.*' => ['string', 'max:120'],
            'tags' => ['sometimes', 'array'],
            'tags.*' => ['string', 'max:120'],
            'age_rating' => ['sometimes', 'nullable', 'string', 'max:30'],

            'cover_alt_text' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sample_pages' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_single_sale_enabled' => ['sometimes', 'boolean'],
            'is_subscription_available' => ['sometimes', 'boolean'],
            'subscription_plan_ids' => ['sometimes', 'array'],
            'subscription_plan_ids.*' => ['uuid', 'exists:subscription_plans,id'],

            'file' => ['sometimes', 'nullable', 'file', 'max:460800'],
            'file_format' => ['sometimes', 'nullable', 'string', 'max:30'],
            'cover' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif,avif', 'max:20480'],
            'sample' => ['sometimes', 'nullable', 'file', 'max:102400'],
        ];
    }
}
