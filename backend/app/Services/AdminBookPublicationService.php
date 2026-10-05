<?php

namespace App\Services;

use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Throwable;

class AdminBookPublicationService
{
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
                DB::transaction(function () use ($book, $administrator): void {
                    $author = $book->author()->first();

                    if ($author?->catalog_origin === 'admin_import' && $author->is_reference_profile) {
                        $author->update([
                            'is_reference_profile' => false,
                            'rights_notes' => $author->rights_notes
                                ?: 'Auteur créé depuis un import administrateur. Les droits sont validés au niveau du livre.',
                        ]);
                    }

                    $book->forceFill([
                        'status' => 'published',
                        'review_status' => 'approved',
                        'copyright_status' => 'clear',
                        'published_at' => $book->published_at ?? now(),
                        'reviewed_at' => now(),
                        'reviewed_by' => $administrator->id,
                        'copyright_note' => $book->copyright_note
                            ?: 'Droits validés manuellement par un administrateur avant publication.',
                    ])->save();
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
