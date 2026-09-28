<?php

namespace App\Http\Requests\Reader;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreHighlightRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'text' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:30'],
            'locator' => ['nullable', 'string', 'max:10000'],
            'locator_type' => ['nullable', Rule::in(['epub_cfi', 'pdf_page', 'pdf_locator', 'custom'])],
            'selected_text' => ['nullable', 'string'],
            'chapter_label' => ['nullable', 'string', 'max:255'],
            'progress_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'device_record_id' => ['nullable', 'uuid', 'exists:user_devices,id'],
            'client_highlight_id' => ['nullable', 'string', 'max:255'],
        ];
    }
}
