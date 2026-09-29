<?php

return [
    'engagement_deduplication_hours' => (int) env('BOOK_ENGAGEMENT_DEDUPLICATION_HOURS', 24),

    'pdf' => [
        'pdfinfo_binary' => env('BOOK_PDFINFO_BINARY', 'pdfinfo'),
        'pdftoppm_binary' => env('BOOK_PDFTOPPM_BINARY', 'pdftoppm'),
        'cover_size' => (int) env('BOOK_COVER_SIZE', 1600),
        'process_timeout' => (int) env('BOOK_PDF_PROCESS_TIMEOUT', 30),
    ],
];
