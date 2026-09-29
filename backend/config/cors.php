<?php

$frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');
$isProduction = env('APP_ENV', 'production') === 'production';

$allowedOrigins = [
    $frontendUrl,
    'https://holistique-books.com',
    'https://www.holistique-books.com',
];

if (! $isProduction) {
    $allowedOrigins[] = 'http://localhost:3000';
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique($allowedOrigins)),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'Origin', 'X-Requested-With', 'Idempotency-Key'],
    'exposed_headers' => [],
    'max_age' => 600,
    'supports_credentials' => true,
];
