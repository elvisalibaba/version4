<?php

return [
    'temporary_file_upload' => [
        'disk' => env('LIVEWIRE_TEMPORARY_FILE_UPLOAD_DISK'),
        'rules' => 'file|max:'.(int) env('UPLOAD_MAX_KILOBYTES', 51200), // aligné sur App\Support\UploadLimit
        'directory' => env('LIVEWIRE_TEMPORARY_FILE_UPLOAD_DIRECTORY', 'livewire-tmp'),
        'middleware' => 'throttle:20,1',
    ],
];
