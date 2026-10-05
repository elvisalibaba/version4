<?php

namespace App\Support;

final class BookEditorialWorkflow
{
    public const STAGES = [
        'intake',
        'brief',
        'contract',
        'planning',
        'writing',
        'correction_1',
        'correction_2',
        'layout',
        'design',
        'bat',
        'production',
        'distribution',
        'published',
    ];

    private function __construct() {}
}
