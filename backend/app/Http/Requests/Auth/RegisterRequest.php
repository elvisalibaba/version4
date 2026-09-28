<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'role' => ['required', 'in:reader,author'],
            'name' => ['nullable', 'string', 'max:255'],
            'first_name' => ['nullable', 'string', 'max:120'],
            'last_name' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'preferred_language' => ['nullable', 'string', 'max:10'],
            'favorite_categories' => ['nullable', 'array'],
            'favorite_categories.*' => ['string', 'max:120'],
            'marketing_opt_in' => ['nullable', 'boolean'],
            'display_name' => ['required_if:role,author', 'nullable', 'string', 'max:255'],
            'professional_headline' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:5000'],
            'website' => ['nullable', 'url', 'max:2048'],
            'location' => ['nullable', 'string', 'max:255'],
            'genres' => ['nullable', 'array', 'max:12'],
            'genres.*' => ['string', 'max:80'],
            'publishing_goals' => ['nullable', 'string', 'max:5000'],
            'social_links' => ['nullable', 'array'],
            'social_links.*' => ['nullable', 'url', 'max:2048'],
            'referred_by_affiliate_code' => ['nullable', 'string', 'max:100'],
            'affiliate_source_type' => ['nullable', 'in:book,plan'],
            'affiliate_source_book_id' => ['nullable', 'uuid', 'exists:books,id'],
            'affiliate_source_plan_id' => ['nullable', 'uuid', 'exists:subscription_plans,id'],
        ];
    }
}
