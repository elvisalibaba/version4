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

            'price' => ['nullable', 'numeric', 'min:0'],
            'currency_code' => ['nullable', 'string', 'size:3'],

            'author_id' => ['nullable', 'uuid', 'exists:author_profiles,id'],
            'authorship_type' => ['nullable', 'in:named,collective,institutional,anonymous,traditional,sacred_text'],
            'author_credit' => ['nullable', 'string', 'max:255'],
            'author_display_name' => ['nullable', 'string', 'max:255'],

            'status' => ['nullable', 'in:draft,published,archived,coming_soon'],
            'editorial_pole' => ['nullable', 'in:general,ecclesial,institutional,entrepreneurial'],
            'work_type' => ['nullable', 'in:book,bible,theology,devotional,sermon,prayer,hymnal,study_guide,academic,manual,essay,novel,biography,magazine,report,other'],
            'editorial_stage' => ['nullable', 'in:'.implode(',', BookEditorialWorkflow::STAGES)],
            'spiritual_metadata' => ['nullable', 'array'],
            'ingestion_metadata' => ['nullable', 'array'],

            'language' => ['nullable', 'string', 'max:10'],
            'isbn' => ['nullable', 'string', 'max:50'],
            'publisher' => ['nullable', 'string', 'max:255'],
            'publication_date' => ['nullable', 'date'],
            'page_count' => ['nullable', 'integer', 'min:1'],
            'edition' => ['nullable', 'string', 'max:255'],
            'series_name' => ['nullable', 'string', 'max:255'],
            'series_position' => ['nullable', 'integer', 'min:1'],

            'co_authors' => ['nullable', 'array'],
            'co_authors.*' => ['string', 'max:255'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['string', 'max:120'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:120'],
            'age_rating' => ['nullable', 'string', 'max:30'],

            'cover_alt_text' => ['nullable', 'string', 'max:255'],
            'sample_pages' => ['nullable', 'integer', 'min:0'],
            'is_single_sale_enabled' => ['nullable', 'boolean'],
            'is_subscription_available' => ['nullable', 'boolean'],
            'subscription_plan_ids' => ['nullable', 'array'],
            'subscription_plan_ids.*' => ['uuid', 'exists:subscription_plans,id'],

            // Catalogue ingestion is deliberately permissive. Unsupported source
            // formats may be stored for the editorial team and converted later.
            'file' => ['nullable', 'file', 'max:460800'],
            'file_format' => ['nullable', 'string', 'max:30'],
            'cover' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp,gif,avif', 'max:20480'],
            'sample' => ['nullable', 'file', 'max:102400'],
        ];
    }
}
