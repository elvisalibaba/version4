<?php

return [
    'frontend_url' => rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/'),
    // Clé partagée avec le serveur Next (même valeur dans son .env), voir ResolveFrontendClientIp.
    'frontend_proxy_secret' => (string) env('FRONTEND_PROXY_SECRET', ''),
    'verification_ttl_minutes' => max(5, (int) env('EMAIL_VERIFICATION_TTL_MINUTES', 15)),
    'verification_max_attempts' => max(3, (int) env('EMAIL_VERIFICATION_MAX_ATTEMPTS', 5)),
    'support_email' => env('SUPPORT_EMAIL', env('MAIL_FROM_ADDRESS')),
    'api_version' => 'v1',
];
