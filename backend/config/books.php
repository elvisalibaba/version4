<?php

return [
    'engagement_deduplication_hours' => (int) env('BOOK_ENGAGEMENT_DEDUPLICATION_HOURS', 24),

    'pdf' => [
        'pdfinfo_binary' => env('BOOK_PDFINFO_BINARY', 'pdfinfo'),
        'pdftoppm_binary' => env('BOOK_PDFTOPPM_BINARY', 'pdftoppm'),
        'imagick_enabled' => (bool) env('BOOK_PDF_IMAGICK_ENABLED', true),
        'cover_size' => (int) env('BOOK_COVER_SIZE', 1600),
        'reader_page_size' => (int) env('BOOK_READER_PAGE_SIZE', 1800),
        'process_timeout' => (int) env('BOOK_PDF_PROCESS_TIMEOUT', 30),
        'max_concurrent_renders' => (int) env('BOOK_PDF_MAX_CONCURRENT_RENDERS', 3),
    ],
];
