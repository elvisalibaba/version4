<?php

namespace App\Services;

use Illuminate\Support\Facades\File;
use RuntimeException;
use Symfony\Component\Process\ExecutableFinder;
use Symfony\Component\Process\Process;
use Throwable;

class PdfPageImageRenderer
{
    /**
     * @return array{available: bool, preferred_driver: string|null, pdftoppm: string|null, imagick: bool}
     */
    public function status(): array
    {
        $pdftoppm = $this->pdftoppmBinary();
        $imagick = $this->imagickAvailable();

        return [
            'available' => $pdftoppm !== null || $imagick,
            'preferred_driver' => $pdftoppm !== null ? 'pdftoppm' : ($imagick ? 'imagick' : null),
            'pdftoppm' => $pdftoppm,
            'imagick' => $imagick,
        ];
    }

    public function isAvailable(): bool
    {
        return $this->status()['available'];
    }

    public function render(
        string $absolutePath,
        int $page,
        string $outputPath,
        int $maxSize,
        int $jpegQuality = 86,
    ): void {
        $errors = [];
        $pdftoppm = $this->pdftoppmBinary();

        if ($pdftoppm !== null) {
            try {
                $this->renderWithPoppler($pdftoppm, $absolutePath, $page, $outputPath, $maxSize, $jpegQuality);

                return;
            } catch (Throwable $exception) {
                $errors[] = 'pdftoppm: '.$exception->getMessage();
            }
        }

        if ($this->imagickAvailable()) {
            try {
                $this->renderWithImagick($absolutePath, $page, $outputPath, $maxSize, $jpegQuality);

                return;
            } catch (Throwable $exception) {
                $errors[] = 'Imagick: '.$exception->getMessage();
            }
        }

        $details = $errors === [] ? '' : ' '.implode(' | ', $errors);

        throw new RuntimeException('Aucun moteur n’a pu rendre cette page PDF.'.$details);
    }

    public function pageCountWithImagick(string $absolutePath): ?int
    {
        if (! $this->imagickAvailable()) {
            return null;
        }

        $document = null;

        try {
            $document = new \Imagick;
            $document->pingImage($absolutePath);
            $count = $document->getNumberImages();

            return $count > 0 ? $count : null;
        } catch (Throwable) {
            return null;
        } finally {
            if ($document instanceof \Imagick) {
                $document->clear();
                $document->destroy();
            }
        }
    }

    private function pdftoppmBinary(): ?string
    {
        $configuredBinary = config('books.pdf.pdftoppm_binary');

        if (! is_string($configuredBinary) || $configuredBinary === '') {
            return null;
        }

        if (str_contains($configuredBinary, DIRECTORY_SEPARATOR)) {
            return is_executable($configuredBinary) ? $configuredBinary : null;
        }

        return (new ExecutableFinder)->find($configuredBinary);
    }

    private function imagickAvailable(): bool
    {
        if (! config('books.pdf.imagick_enabled', true) || ! class_exists(\Imagick::class)) {
            return false;
        }

        try {
            return \Imagick::queryFormats('PDF') !== [];
        } catch (Throwable) {
            return false;
        }
    }

    private function renderWithPoppler(
        string $binary,
        string $absolutePath,
        int $page,
        string $outputPath,
        int $maxSize,
        int $jpegQuality,
    ): void {
        $outputPrefix = preg_replace('/\.jpe?g$/i', '', $outputPath) ?: $outputPath;
        $process = new Process([
            $binary,
            '-f', (string) $page,
            '-l', (string) $page,
            '-singlefile',
            '-jpeg',
            '-jpegopt', 'quality='.max(1, min(100, $jpegQuality)),
            '-scale-to', (string) $maxSize,
            $absolutePath,
            $outputPrefix,
        ]);
        $process->setTimeout((float) config('books.pdf.process_timeout', 30));
        $process->run();

        $generatedPath = $outputPrefix.'.jpg';

        if (! $process->isSuccessful() || ! File::isFile($generatedPath)) {
            throw new RuntimeException(trim($process->getErrorOutput()) ?: 'échec de conversion');
        }

        if ($generatedPath !== $outputPath && ! File::move($generatedPath, $outputPath)) {
            throw new RuntimeException('impossible de déplacer la page rendue');
        }
    }

    private function renderWithImagick(
        string $absolutePath,
        int $page,
        string $outputPath,
        int $maxSize,
        int $jpegQuality,
    ): void {
        $document = new \Imagick;
        $renderedPage = null;

        try {
            $document->setResolution(144, 144);
            $document->readImage($absolutePath.'['.($page - 1).']');
            $document->setImageBackgroundColor('white');
            $renderedPage = $document->mergeImageLayers(\Imagick::LAYERMETHOD_FLATTEN);
            $renderedPage->setImageFormat('jpeg');
            $renderedPage->setImageCompressionQuality(max(1, min(100, $jpegQuality)));
            $renderedPage->thumbnailImage($maxSize, 0);

            if (! $renderedPage->writeImage($outputPath) || ! File::isFile($outputPath)) {
                throw new RuntimeException('Imagick n’a produit aucune image.');
            }
        } finally {
            if ($renderedPage instanceof \Imagick) {
                $renderedPage->clear();
                $renderedPage->destroy();
            }

            $document->clear();
            $document->destroy();
        }
    }
}
