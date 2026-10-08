<?php

namespace App\Http\Requests\Book;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexBookRequest extends FormRequest
{
    public const SORTS = ['newest', 'bestsellers', 'price_asc', 'price_desc', 'rating'];

    public const FORMATS = ['holistique_store', 'ebook', 'paperback', 'pocket', 'hardcover', 'audiobook'];

    public const DEFAULT_PER_PAGE = 24;

    public const MAX_PER_PAGE = 60;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'editorial_pole' => ['nullable', 'string', 'max:50'],
            'work_type' => ['nullable', 'string', 'max:50'],
            'education' => ['nullable', 'string', 'max:255'],
            'education_audience' => ['nullable', 'string', 'max:50'],
            'sort' => ['nullable', Rule::in(self::SORTS)],
            'format' => ['nullable', 'array', 'max:'.count(self::FORMATS)],
            'format.*' => ['string', Rule::in(self::FORMATS)],
            'language' => ['nullable', 'string', 'max:10'],
            'is_free' => ['nullable', 'boolean'],
            'subscription' => ['nullable', 'boolean'],
            'has_sample' => ['nullable', 'boolean'],
            'price_min' => ['nullable', 'numeric', 'min:0'],
            'price_max' => ['nullable', 'numeric', 'min:0', 'gte:price_min'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.self::MAX_PER_PAGE],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Accepte `format=ebook,audiobook` comme `format[]=ebook&format[]=audiobook`,
     * et `true` / `false` pour les drapeaux booléens de la query string.
     */
    protected function prepareForValidation(): void
    {
        $normalized = [];

        if (is_string($this->input('format'))) {
            $normalized['format'] = array_values(array_filter(
                array_map('trim', explode(',', $this->input('format'))),
                fn (string $format): bool => $format !== '',
            ));
        }

        foreach (['is_free', 'subscription', 'has_sample'] as $flag) {
            $value = $this->input($flag);

            if (is_string($value) && in_array(strtolower($value), ['true', 'false'], true)) {
                $normalized[$flag] = strtolower($value) === 'true';
            }
        }

        $this->merge($normalized);
    }

    /**
     * @return list<string>
     */
    public function formats(): array
    {
        return $this->validated('format') ?? [];
    }

    public function perPage(): int
    {
        return (int) ($this->validated('per_page') ?? self::DEFAULT_PER_PAGE);
    }
}
