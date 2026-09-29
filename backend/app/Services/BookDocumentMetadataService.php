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

        if (! is_string($path) || $path === '' || ! Storage::disk('books')->exists($path)) {
            return $book;
        }

        $extension = mb_strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $updates = [
            'file_format' => $extension,
            'file_size' => Storage::disk('books')->size($path),
        ];

        if ($extension !== 'pdf') {
            $book->update($updates);

            return $book->refresh();
        }

        [$absolutePath, $temporaryPath] = $this->materialize($path);

        try {
            if ($pageCount = $this->pageCount($absolutePath)) {
                $updates['page_count'] = $pageCount;
            }

            if (blank($book->cover_url) && ($coverPath = $this->generateCover($absolutePath, $book->id))) {
                $updates['cover_url'] = $coverPath;
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

        $book->update($updates);

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

    private function generateCover(string $absolutePath, string $bookId): ?string
    {
        $temporaryDirectory = sys_get_temp_dir().'/holisticbooks-cover-'.bin2hex(random_bytes(8));
        File::ensureDirectoryExists($temporaryDirectory, 0700);

        try {
            $generatedPath = $this->generateWithPoppler($absolutePath, $temporaryDirectory)
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
