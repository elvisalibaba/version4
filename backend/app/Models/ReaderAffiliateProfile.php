<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReaderAffiliateProfile extends Model
{
    /** @use HasFactory<\Database\Factories\ReaderAffiliateProfileFactory> */
    use HasFactory;

    protected $table = 'reader_affiliate_profiles';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $keyType = 'string';
}
