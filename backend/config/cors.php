<?php

$frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/');

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique([
        $frontendUrl,
        'http://localhost:3000',
        'https://holistique-books.com',
        'https://www.holistique-books.com',
    ])),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'Origin', 'X-Requested-With'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
