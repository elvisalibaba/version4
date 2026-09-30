<?php

namespace App\Policies;

use App\Models\Rating;
use App\Models\User;

class RatingPolicy
{
    public function update(User $user, Rating $rating): bool
    {
        $profile = $user->profile;

        return $profile !== null
            && ($profile->role === 'admin' || $rating->user_id === $profile->id);
    }

    public function delete(User $user, Rating $rating): bool
    {
        return $user->profile?->id === $rating->user_id;
    }
}
