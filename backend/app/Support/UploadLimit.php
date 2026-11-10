<?php

namespace App\Support;

/**
 * Taille maximale unique des fichiers envoyés (livres, extraits, médias, APK).
 *
 * Elle doit rester alignée sur `client_max_body_size` de nginx et sur
 * `upload_max_filesize` / `post_max_size` de PHP (voir deploy/docker/).
 * Valeur réglable par UPLOAD_MAX_KILOBYTES ; 51200 Ko = 50 Mo par défaut.
 */
final class UploadLimit
{
    public const DEFAULT_KILOBYTES = 51200;

    public static function kilobytes(): int
    {
        $value = (int) config('holistic.upload_max_kilobytes', self::DEFAULT_KILOBYTES);

        return $value > 0 ? $value : self::DEFAULT_KILOBYTES;
    }

    public static function megabytes(): int
    {
        return intdiv(self::kilobytes(), 1024);
    }

    /** Règle de validation Laravel « max: » en kilo-octets. */
    public static function rule(): string
    {
        return 'max:'.self::kilobytes();
    }

    public static function message(): string
    {
        return sprintf(
            'Ce fichier dépasse %d Mo, la taille maximale acceptée. Réduisez sa taille (compression du PDF, images allégées) puis renvoyez-le.',
            self::megabytes(),
        );
    }

    public static function helperText(): string
    {
        return sprintf('%d Mo maximum.', self::megabytes());
    }
}
