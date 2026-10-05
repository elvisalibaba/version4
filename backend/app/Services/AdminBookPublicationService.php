<?php

namespace App\Services;

use App\Models\Book;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Throwable;

class AdminBookPublicationService
{
    public function __construct(private BookDocumentMetadataService $metadata) {}

    /**
     * @param Collection<int, Book> $books
     * @return array{published:int, failed:int}
     */
    public function publish(Collection $books, Profile $administrator, bool $rightsConfirmed): array
    {
        if ($administrator->role !== 'admin') {
            throw new InvalidArgumentException('Seul un administrateur peut publier des livres en masse.');
        }

        if (! $rightsConfirmed) {
            throw new InvalidArgumentException('La confirmation des droits est obligatoire.');
        }

        $published = 0;
        $failed = 0;

        foreach ($books as $book) {
            try {
                // A catalogue item must always leave publication with a usable cover.
                $book = $this->metadata->enrich($book);

                DB::transaction(function () use ($book, $administrator): void {
                    $author = $book->author()->first();

                    if ($author?->catalog_origin === 'admin_import' && $author->is_reference_profile) {
                        $author->update([
                            'is_reference_profile' => false,
                            'rights_notes' => $author->rights_notes
                                ?: 'Auteur créé depuis un import administrateur. Les droits sont validés au niveau du livre.',
                        ]);
                    }

                    $fromStage = $book->editorial_stage;

                    $book->forceFill([
                        'status' => 'published',
                        'review_status' => 'approved',
                        'copyright_status' => 'clear',
                        'editorial_stage' => 'published',
                        'published_at' => $book->published_at ?? now(),
                        'reviewed_at' => now(),
                        'reviewed_by' => $administrator->id,
                        'copyright_note' => $book->copyright_note
                            ?: 'Droits validés manuellement par un administrateur avant publication.',
                    ])->save();

                    $book->editorialEvents()->create([
                        'actor_id' => $administrator->id,
                        'event_type' => 'published',
                        'from_stage' => $fromStage,
                        'to_stage' => 'published',
                        'notes' => 'Livre validé et publié par un administrateur.',
                    ]);
                });

                $published++;
            } catch (Throwable) {
                $failed++;
            }
        }

        return compact('published', 'failed');
    }

    /**
     * @return array{published:int, failed:int}
     */
    public function publishAllImported(Profile $administrator, bool $rightsConfirmed): array
    {
        /** @var Collection<int, Book> $books */
        $books = Book::query()
            ->whereNotNull('admin_import_batch_id')
            ->where(function ($query): void {
                $query->where('status', '!=', 'published')
                    ->orWhere('review_status', '!=', 'approved')
                    ->orWhere('copyright_status', '!=', 'clear');
            })
            ->get();

        return $this->publish($books, $administrator, $rightsConfirmed);
    }
}
