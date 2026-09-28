<?php

namespace App\Http\Requests\Reader;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertReadingProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'format_id' => ['nullable', 'uuid', 'exists:book_formats,id'],
            'locator' => ['required', 'string', 'max:10000'],
            'locator_type' => ['required', Rule::in(['epub_cfi', 'pdf_page', 'pdf_locator', 'audio_position', 'custom'])],
            'progress_percent' => ['required', 'numeric', 'min:0', 'max:100'],
            'device_id' => ['nullable', 'string', 'max:255'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'device_record_id' => ['nullable', 'uuid', 'exists:user_devices,id'],
        ];
    }
}
