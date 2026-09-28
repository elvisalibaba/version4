<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EditorialTrainingRequest extends Model
{
    /** @use HasFactory<\Database\Factories\EditorialTrainingRequestFactory> */
    use HasFactory, HasUuids;

    protected $fillable = ['user_id', 'first_name', 'last_name', 'email', 'phone', 'country', 'city', 'organization_name', 'profile_type', 'experience_level', 'project_stage', 'preferred_format', 'objectives', 'message', 'consent_to_contact', 'source'];

    protected function casts(): array
    {
        return ['consent_to_contact' => 'boolean'];
    }
}
