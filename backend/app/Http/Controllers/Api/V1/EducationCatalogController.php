<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AcademicTaxonomy;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class EducationCatalogController extends Controller
{
    public function index(): JsonResponse
    {
        $nodes = AcademicTaxonomy::query()
            ->where('is_active', true)
            ->withCount([
                'books as public_books_count' => fn ($query) => $query
                    ->whereIn('status', ['published', 'coming_soon'])
                    ->where('copyright_status', 'clear'),
            ])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $byParent = $nodes->groupBy(fn (AcademicTaxonomy $node) => $node->parent_id ?? 'root');

        return response()->json([
            'data' => $this->tree($byParent),
            'meta' => [
                'school_nodes' => $nodes->where('audience', 'school')->count(),
                'university_nodes' => $nodes->where('audience', 'university')->count(),
                'official_nodes' => $nodes->where('is_official', true)->count(),
            ],
        ]);
    }

    private function tree(Collection $byParent, ?string $parentId = null): array
    {
        return $byParent->get($parentId ?? 'root', collect())
            ->map(fn (AcademicTaxonomy $node): array => [
                'id' => $node->id,
                'parent_id' => $node->parent_id,
                'audience' => $node->audience,
                'kind' => $node->kind,
                'code' => $node->code,
                'name' => $node->name,
                'slug' => $node->slug,
                'description' => $node->description,
                'sort_order' => $node->sort_order,
                'is_official' => $node->is_official,
                'source_url' => $node->source_url,
                'metadata' => $node->metadata,
                'books_count' => $node->public_books_count,
                'children' => $this->tree($byParent, $node->id),
            ])
            ->values()
            ->all();
    }
}
