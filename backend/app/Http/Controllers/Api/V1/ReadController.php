<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ReadController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'message' => 'Le transfert du fichier complet est désactivé. Utilisez le lecteur protégé page par page.',
        ], 410);
    }

    public function free(): JsonResponse
    {
        return response()->json([
            'message' => 'Le transfert public du fichier est désactivé. Utilisez l’aperçu protégé page par page.',
        ], 410);
    }
}
