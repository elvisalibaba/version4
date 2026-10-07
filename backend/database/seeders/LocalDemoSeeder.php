<?php

namespace Database\Seeders;

use App\Models\AuthorProfile;
use App\Models\Book;
use App\Models\Category;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Données de démonstration pour tester le site en local (jamais en production).
 *
 * Crée un catalogue, des comptes de test et de vrais PDF lisibles, afin que
 * la lecture gratuite sans compte (10 pages) fonctionne de bout en bout.
 *
 *   php artisan db:seed --class=LocalDemoSeeder
 */
class LocalDemoSeeder extends Seeder
{
    public const PASSWORD = 'Demo12345';

    private const CATEGORIES = ['Roman', 'Spiritualité', 'Business', 'Éducation', 'Droit', 'Histoire', 'Développement personnel', 'Jeunesse'];

    /** @var array<int, array{string, string, string, float}> titre, auteur, catégorie, prix (0 = gratuit) */
    private const BOOKS = [
        ['Les Racines du Fleuve', 'Mireille Kabongo', 'Roman', 0],
        ['Kinshasa, nuit blanche', 'Patrick Mbuyi', 'Roman', 7.5],
        ['L’Économie du Bassin du Congo', 'Dr Aimé Lukusa', 'Business', 12],
        ['Prier sans cesse', 'Pasteur J. Ilunga', 'Spiritualité', 0],
        ['Entreprendre à Lubumbashi', 'Grace Mwamba', 'Business', 9.99],
        ['Le Chant des collines', 'Sarah Nzuzi', 'Roman', 0],
        ['Mathématiques, 4e humanités', 'Collectif Holistique', 'Éducation', 0],
        ['Le droit OHADA expliqué', 'Me Didier Kalala', 'Droit', 14.5],
        ['Mémoires d’un instituteur', 'Joseph Tshibangu', 'Histoire', 6],
        ['Leadership et foi', 'Esther Mukendi', 'Spiritualité', 0],
        ['Contes du Kasaï', 'Collectif Holistique', 'Jeunesse', 0],
        ['Diriger avec vision', 'Gode Muala', 'Développement personnel', 9.99],
    ];

    private const PAGE_COUNT = 24;

    private const SAMPLE_PAGES = 10;

    public function run(): void
    {
        if (app()->isProduction()) {
            throw new RuntimeException('LocalDemoSeeder ne doit jamais tourner en production.');
        }

        foreach (self::CATEGORIES as $name) {
            Category::query()->firstOrCreate(['name' => $name]);
        }

        $reader = $this->account('lecteur@demo.local', 'Grace', 'Mwamba', 'reader');
        $author = $this->account('auteur@demo.local', 'Patrick', 'Mbuyi', 'author');
        $this->account('admin@demo.local', 'Admin', 'Démo', 'admin');

        $authorProfile = AuthorProfile::query()->firstOrCreate(
            ['id' => $author->id],
            ['display_name' => 'Patrick Mbuyi', 'social_links' => [], 'genres' => [], 'press_mentions' => []],
        );

        $disk = Storage::disk('books');

        foreach (self::BOOKS as $index => [$title, $authorName, $category, $price]) {
            $book = Book::query()->firstOrNew(['title' => $title]);
            $book->forceFill([
                'author_id' => $authorProfile->id,
                'description' => "{$title} — un ouvrage de {$authorName}, publié par Holistique Books.\n\nTexte de démonstration utilisé pour tester la lecture, l’achat et la bibliothèque en local.",
                'author_display_name' => $authorName,
                'author_credit' => $authorName,
                'price' => $price,
                'currency_code' => 'USD',
                'status' => 'published',
                'review_status' => 'approved',
                'copyright_status' => 'clear',
                'is_single_sale_enabled' => true,
                'is_subscription_available' => false,
                'can_read_on_platform' => true,
                'language' => 'fr',
                'categories' => [$category],
                'tags' => [],
                'co_authors' => [],
                'page_count' => self::PAGE_COUNT,
                'sample_pages' => self::SAMPLE_PAGES,
                'file_format' => 'pdf',
                'views_count' => 200 - $index * 11,
                'purchases_count' => 60 - $index * 4,
                'published_at' => now()->subDays($index),
            ])->save();

            $full = "demo/{$book->id}.pdf";
            $sample = "demo/{$book->id}-extrait.pdf";
            $disk->put($full, $this->pdf($title, $authorName, self::PAGE_COUNT));
            $disk->put($sample, $this->pdf($title, $authorName, self::SAMPLE_PAGES));

            $book->forceFill(['file_url' => $full, 'sample_url' => $sample, 'file_size' => $disk->size($full)])->save();
        }

        $this->command?->info(sprintf('%d livres de démo. Comptes (mot de passe %s) : lecteur@demo.local, auteur@demo.local, admin@demo.local', count(self::BOOKS), self::PASSWORD));
        unset($reader);
    }

    private function account(string $email, string $firstName, string $lastName, string $role): User
    {
        $user = User::query()->firstOrCreate(['email' => $email], ['name' => "{$firstName} {$lastName}", 'password' => self::PASSWORD]);
        $user->forceFill(['email_verified_at' => now()])->save();

        Profile::query()->updateOrCreate(['id' => $user->id], [
            'email' => $email,
            'name' => "{$firstName} {$lastName}",
            'first_name' => $firstName,
            'last_name' => $lastName,
            'role' => $role,
            'preferred_language' => 'fr',
            'favorite_categories' => [],
            'marketing_opt_in' => false,
        ]);

        return $user;
    }

    /** PDF minimal mais valide (texte Helvetica), sans dépendance externe. */
    private function pdf(string $title, string $author, int $pages): string
    {
        $latin = fn (string $text): string => strtr(
            (string) iconv('UTF-8', 'Windows-1252//TRANSLIT', $text),
            ['\\' => '\\\\', '(' => '\\(', ')' => '\\)'],
        );

        $objects = [];
        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>';
        $kids = [];
        $next = 5;

        for ($page = 1; $page <= $pages; $page++) {
            $lines = $page === 1
                ? ["BT /F1 26 Tf 60 640 Td ({$latin($title)}) Tj ET", "BT /F2 16 Tf 60 600 Td ({$latin($author)}) Tj ET", 'BT /F2 11 Tf 60 120 Td (Holistique Books - edition de demonstration) Tj ET']
                : ["BT /F1 14 Tf 60 740 Td ({$latin("Chapitre {$page}")}) Tj ET"];

            if ($page > 1) {
                for ($line = 0; $line < 26; $line++) {
                    $y = 700 - $line * 22;
                    $lines[] = "BT /F2 12 Tf 60 {$y} Td (".$latin('Texte de démonstration pour tester le lecteur protégé, page par page.').') Tj ET';
                }
            }
            $lines[] = "BT /F2 10 Tf 290 40 Td ({$page}) Tj ET";

            $stream = implode("\n", $lines);
            $contentId = $next++;
            $pageId = $next++;
            $objects[$contentId] = '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream";
            $objects[$pageId] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {$contentId} 0 R >>";
            $kids[] = "{$pageId} 0 R";
        }

        $objects[2] = '<< /Type /Pages /Kids ['.implode(' ', $kids).'] /Count '.count($kids).' >>';
        ksort($objects);

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $id => $body) {
            $offsets[$id] = strlen($pdf);
            $pdf .= "{$id} 0 obj\n{$body}\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= 'xref
0 '.(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf.'trailer
<< /Size '.(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }
}
