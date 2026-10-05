<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use Throwable;

class BookDocumentMetadataService
{
    public function enrich(Book $book): Book
    {
        $path = $book->file_url;
        $updates = [];

        if (is_string($path) && $path !== '' && Storage::disk('books')->exists($path)) {
            $extension = mb_strtolower(pathinfo($path, PATHINFO_EXTENSION));
            $updates['file_format'] = $extension;
            $updates['file_size'] = Storage::disk('books')->size($path);

            if ($extension === 'pdf') {
                [$absolutePath, $temporaryPath] = $this->materialize($path);

                try {
                    if ($pageCount = $this->pageCount($absolutePath)) {
                        $updates['page_count'] = $pageCount;
                    }

                    if (! $this->hasUsableCover($book)) {
                        $coverPath = $this->generateDocumentCover($absolutePath, $book->id);

                        if ($coverPath !== null) {
                            $updates['cover_url'] = $coverPath;
                            $updates['cover_thumbnail_url'] = $coverPath;
                            $updates['cover_source'] = 'first_page';
                        }
                    }
                } catch (Throwable $exception) {
                    Log::warning('Impossible d’extraire toutes les métadonnées du livre.', [
                        'book_id' => $book->id,
                        'exception' => $exception,
                    ]);
                } finally {
                    if ($temporaryPath !== null) {
                        File::delete($temporaryPath);
                    }
                }
            }
        }

        if ($updates !== []) {
            $book->forceFill($updates)->saveQuietly();
            $book->refresh();
        }

        return $this->ensureCover($book);
    }

    /**
     * Guarantees that a catalogue record has a usable cover.
     *
     * Priority:
     * 1. manually uploaded/imported cover;
     * 2. first page of a PDF;
     * 3. branded SVG placeholder generated from title + author credit.
     */
    public function ensureCover(Book $book): Book
    {
        if ($this->hasUsableCover($book)) {
            $updates = [];

            if (blank($book->cover_thumbnail_url)) {
                $updates['cover_thumbnail_url'] = $book->cover_url;
            }

            if (blank($book->cover_alt_text)) {
                $updates['cover_alt_text'] = 'Couverture de '.$book->title;
            }

            if (blank($book->cover_source)) {
                $updates['cover_source'] = 'upload';
            }

            if ($updates !== []) {
                $book->forceFill($updates)->saveQuietly();
            }

            return $book->refresh();
        }

        $path = $book->file_url;

        if (
            is_string($path)
            && $path !== ''
            && mb_strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'pdf'
            && Storage::disk('books')->exists($path)
        ) {
            [$absolutePath, $temporaryPath] = $this->materialize($path);

            try {
                $coverPath = $this->generateDocumentCover($absolutePath, $book->id);

                if ($coverPath !== null) {
                    $book->forceFill([
                        'cover_url' => $coverPath,
                        'cover_thumbnail_url' => $coverPath,
                        'cover_source' => 'first_page',
                        'cover_alt_text' => 'Couverture de '.$book->title,
                    ])->saveQuietly();

                    return $book->refresh();
                }
            } catch (Throwable $exception) {
                Log::warning('Impossible de générer la première page comme couverture.', [
                    'book_id' => $book->id,
                    'exception' => $exception,
                ]);
            } finally {
                if ($temporaryPath !== null) {
                    File::delete($temporaryPath);
                }
            }
        }

        $placeholderPath = $this->generatePlaceholderCover($book);

        $book->forceFill([
            'cover_url' => $placeholderPath,
            'cover_thumbnail_url' => $placeholderPath,
            'cover_source' => 'generated_placeholder',
            'cover_alt_text' => 'Couverture générée pour '.$book->title,
        ])->saveQuietly();

        return $book->refresh();
    }

    public function pageCount(string $absolutePath): ?int
    {
        if ($binary = $this->findExecutable(config('books.pdf.pdfinfo_binary'))) {
            $process = new Process([$binary, $absolutePath]);
            $process->setTimeout((float) config('books.pdf.process_timeout', 30));
            $process->run();

            if ($process->isSuccessful() && preg_match('/^Pages:\s+(\d+)$/mi', $process->getOutput(), $matches)) {
                return max(1, (int) $matches[1]);
            }
        }

        if (PHP_OS_FAMILY === 'Darwin' && is_executable('/usr/bin/mdls')) {
            $process = new Process(['/usr/bin/mdls', '-raw', '-name', 'kMDItemNumberOfPages', $absolutePath]);
            $process->setTimeout((float) config('books.pdf.process_timeout', 30));
            $process->run();
            $output = trim($process->getOutput());

            if ($process->isSuccessful() && ctype_digit($output)) {
                return max(1, (int) $output);
            }
        }

        return $this->countUncompressedPdfPages($absolutePath);
    }

    private function hasUsableCover(Book $book): bool
    {
        $cover = trim((string) $book->cover_url);

        if ($cover === '') {
            return false;
        }

        if (str_starts_with($cover, 'http://') || str_starts_with($cover, 'https://')) {
            return true;
        }

        return Storage::disk('public')->exists(ltrim($cover, '/'));
    }

    private function generateDocumentCover(string $absolutePath, string $bookId): ?string
    {
        $temporaryDirectory = sys_get_temp_dir().'/holisticbooks-cover-'.bin2hex(random_bytes(8));
        File::ensureDirectoryExists($temporaryDirectory, 0700);

        try {
            $generatedPath = $this->generateWithPoppler($absolutePath, $temporaryDirectory)
                ?? $this->generateWithImagick($absolutePath, $temporaryDirectory)
                ?? $this->generateWithQuickLook($absolutePath, $temporaryDirectory);

            if ($generatedPath === null || ! File::isFile($generatedPath)) {
                return null;
            }

            $extension = mb_strtolower(pathinfo($generatedPath, PATHINFO_EXTENSION));
            $extension = in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true) ? $extension : 'jpg';
            $coverPath = "covers/generated/{$bookId}.{$extension}";
            $stream = fopen($generatedPath, 'rb');

            if ($stream === false) {
                throw new RuntimeException('Impossible de lire la couverture générée.');
            }

            try {
                Storage::disk('public')->put($coverPath, $stream, 'public');
            } finally {
                fclose($stream);
            }

            return $coverPath;
        } finally {
            File::deleteDirectory($temporaryDirectory);
        }
    }

    private function generateWithPoppler(string $absolutePath, string $temporaryDirectory): ?string
    {
        $binary = $this->findExecutable(config('books.pdf.pdftoppm_binary'));

        if ($binary === null) {
            return null;
        }

        $outputPrefix = $temporaryDirectory.'/cover';
        $process = new Process([
            $binary,
            '-f', '1',
            '-l', '1',
            '-singlefile',
            '-jpeg',
            '-scale-to', (string) config('books.pdf.cover_size', 1600),
            $absolutePath,
            $outputPrefix,
        ]);
        $process->setTimeout((float) config('books.pdf.process_timeout', 30));
        $process->run();

        $outputPath = $outputPrefix.'.jpg';

        return $process->isSuccessful() && File::isFile($outputPath) ? $outputPath : null;
    }

    private function generateWithImagick(string $absolutePath, string $temporaryDirectory): ?string
    {
        if (! class_exists(\Imagick::class)) {
            return null;
        }

        try {
            $image = new \Imagick();
            $image->setResolution(144, 144);
            $image->readImage($absolutePath.'[0]');
            $image->setImageFormat('jpeg');
            $image->setImageCompressionQuality(88);
            $image->thumbnailImage((int) config('books.pdf.cover_size', 1600), 0);
            $outputPath = $temporaryDirectory.'/cover-imagick.jpg';
            $image->writeImage($outputPath);
            $image->clear();
            $image->destroy();

            return File::isFile($outputPath) ? $outputPath : null;
        } catch (Throwable) {
            return null;
        }
    }

    private function generateWithQuickLook(string $absolutePath, string $temporaryDirectory): ?string
    {
        if (PHP_OS_FAMILY !== 'Darwin' || ! is_executable('/usr/bin/qlmanage')) {
            return null;
        }

        $process = new Process([
            '/usr/bin/qlmanage',
            '-t',
            '-s', (string) config('books.pdf.cover_size', 1600),
            '-o', $temporaryDirectory,
            $absolutePath,
        ]);
        $process->setTimeout((float) config('books.pdf.process_timeout', 30));
        $process->run();

        if (! $process->isSuccessful()) {
            return null;
        }

        $generatedFiles = File::files($temporaryDirectory);

        return $generatedFiles === [] ? null : $generatedFiles[0]->getPathname();
    }

    private function generatePlaceholderCover(Book $book): string
    {
        $path = "covers/generated/{$book->id}.svg";
        $titleLines = $this->wrapForCover($book->title, 26, 4);
        $author = $book->displayAuthorName() ?: 'Holistique Books';

        $titleSvg = '';
        $startY = 650 - (count($titleLines) * 52);

        foreach ($titleLines as $index => $line) {
            $y = $startY + ($index * 104);
            $titleSvg .= '<text x="80" y="'.$y.'" font-size="64" font-weight="700" fill="#ffffff" font-family="Arial, Helvetica, sans-serif">'
                .htmlspecialchars($line, ENT_QUOTES | ENT_XML1, 'UTF-8').'</text>';
        }

        $svg = '<?xml version="1.0" encoding="UTF-8"?>'
            .'<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1600" viewBox="0 0 1000 1600">'
            .'<rect width="1000" height="1600" fill="#173d2c"/>'
            .'<rect x="80" y="90" width="120" height="10" fill="#e8ac42"/>'
            .'<text x="80" y="170" font-size="34" font-weight="700" fill="#e8ac42" font-family="Arial, Helvetica, sans-serif">HOLISTIQUE BOOKS</text>'
            .$titleSvg
            .'<text x="80" y="1390" font-size="34" fill="#ffffff" font-family="Arial, Helvetica, sans-serif">'
            .htmlspecialchars($author, ENT_QUOTES | ENT_XML1, 'UTF-8').'</text>'
            .'<text x="80" y="1460" font-size="24" fill="#d7e3dc" font-family="Arial, Helvetica, sans-serif">'
            .htmlspecialchars($this->workTypeLabel($book->work_type), ENT_QUOTES | ENT_XML1, 'UTF-8').'</text>'
            .'<rect x="80" y="1510" width="840" height="4" fill="#e8ac42"/>'
            .'</svg>';

        Storage::disk('public')->put($path, $svg, 'public');

        return $path;
    }

    /**
     * @return array<int, string>
     */
    private function wrapForCover(string $text, int $maxCharacters, int $maxLines): array
    {
        $words = preg_split('/\s+/u', trim($text)) ?: [];
        $lines = [];
        $line = '';

        foreach ($words as $word) {
            $candidate = trim($line.' '.$word);

            if ($line !== '' && mb_strlen($candidate) > $maxCharacters) {
                $lines[] = $line;
                $line = $word;

                if (count($lines) >= $maxLines - 1) {
                    break;
                }

                continue;
            }

            $line = $candidate;
        }

        if ($line !== '' && count($lines) < $maxLines) {
            $lines[] = $line;
        }

        return $lines !== [] ? $lines : ['Livre'];
    }

    private function workTypeLabel(?string $type): string
    {
        return match ($type) {
            'bible' => 'Bible / texte biblique',
            'theology' => 'Théologie',
            'devotional' => 'Dévotion & méditation',
            'sermon' => 'Prédication / sermon',
            'prayer' => 'Prière & vie spirituelle',
            'study_guide' => 'Guide d’étude',
            'academic' => 'Ouvrage académique',
            'manual' => 'Manuel',
            'magazine' => 'Magazine',
            default => 'Édition numérique',
        };
    }

    /**
     * @return array{0: string, 1: string|null}
     */
    private function materialize(string $storagePath): array
    {
        try {
            return [Storage::disk('books')->path($storagePath), null];
        } catch (Throwable) {
            $temporaryPath = tempnam(sys_get_temp_dir(), 'holisticbooks-pdf-');

            if ($temporaryPath === false) {
                throw new RuntimeException('Impossible de préparer le document pour analyse.');
            }

            $source = Storage::disk('books')->readStream($storagePath);
            $destination = fopen($temporaryPath, 'wb');

            if ($source === false || $destination === false) {
                throw new RuntimeException('Impossible de lire le document pour analyse.');
            }

            try {
                stream_copy_to_stream($source, $destination);
            } finally {
                fclose($source);
                fclose($destination);
            }

            return [$temporaryPath, $temporaryPath];
        }
    }

    private function countUncompressedPdfPages(string $absolutePath): ?int
    {
        $stream = fopen($absolutePath, 'rb');

        if ($stream === false) {
            return null;
        }

        $count = 0;
        $carry = '';

        try {
            while (! feof($stream)) {
                $chunk = fread($stream, 1024 * 1024);

                if ($chunk === false) {
                    return null;
                }

                $buffer = $carry.$chunk;

                if (mb_strlen($buffer, '8bit') <= 64) {
                    $carry = $buffer;
                    continue;
                }

                $processableLength = mb_strlen($buffer, '8bit') - 64;
                $processable = mb_substr($buffer, 0, $processableLength, '8bit');
                $carry = mb_substr($buffer, $processableLength, null, '8bit');
                $count += preg_match_all('/\/Type\s*\/Page\b/', $processable);
            }

            $count += preg_match_all('/\/Type\s*\/Page\b/', $carry);
        } finally {
            fclose($stream);
        }

        return $count > 0 ? $count : null;
    }

    private function findExecutable(mixed $configuredBinary): ?string
    {
        if (! is_string($configuredBinary) || $configuredBinary === '') {
            return null;
        }

        if (str_contains($configuredBinary, DIRECTORY_SEPARATOR)) {
            return is_executable($configuredBinary) ? $configuredBinary : null;
        }

        return (new ExecutableFinder)->find($configuredBinary);
    }
}
