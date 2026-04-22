<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePortalSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'portal_name' => ['required', 'string', 'max:255'],
            'portal_subtitle' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'instagram_url' => ['nullable', 'url', 'max:255'],
            'footer_text' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
