<?php

return [
    'session_ttl_minutes' => (int) env('READER_SESSION_TTL_MINUTES', 10),
    'max_active_sessions_per_book' => (int) env('READER_MAX_ACTIVE_SESSIONS_PER_BOOK', 5),
    'require_session' => (bool) env('READER_REQUIRE_SESSION', true),
];
