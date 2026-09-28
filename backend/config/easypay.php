<?php

return [
    'base_url' => rtrim((string) env('EASYPAY_BASE_URL', 'https://www.e-com-easypay.com'), '/'),
    'mode' => env('EASYPAY_MODE', 'sandbox'),
    'correlation_id' => env('EASYPAY_CORRELATION_ID'),
    'publishable_key' => env('EASYPAY_PUBLISHABLE_KEY'),
    'frontend_url' => rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/'),
];
