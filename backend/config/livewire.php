<?php

return [
    'temporary_file_upload' => [
        'disk' => env('LIVEWIRE_TEMPORARY_FILE_UPLOAD_DISK'),
        'rules' => 'file|max:460800',
        'directory' => env('LIVEWIRE_TEMPORARY_FILE_UPLOAD_DIRECTORY', 'livewire-tmp'),
        'middleware' => 'throttle:20,1',
    ],
];
