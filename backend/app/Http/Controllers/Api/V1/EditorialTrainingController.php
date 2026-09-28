<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\EditorialTrainingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EditorialTrainingController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'organization_name' => ['nullable', 'string', 'max:255'],
            'profile_type' => ['required', 'in:author,aspiring_editor,publisher,entrepreneur,student,other'],
            'experience_level' => ['required', 'in:beginner,intermediate,advanced'],
            'project_stage' => ['required', 'in:idea,drafting,manuscript_ready,existing_catalog'],
            'preferred_format' => ['required', 'in:online,onsite,hybrid'],
            'objectives' => ['required', 'string'],
            'message' => ['nullable', 'string'],
            'consent_to_contact' => ['accepted'],
            'source' => ['nullable', 'string', 'max:255'],
        ]);

        $data['user_id'] = $request->user()?->id;
        $data['source'] ??= 'formation-editoriale';

        $record = EditorialTrainingRequest::query()->create($data);

        return response()->json(['data' => $record], 201);
    }
}
