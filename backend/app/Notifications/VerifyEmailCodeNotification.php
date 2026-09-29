<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerifyEmailCodeNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $code) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $minutes = (int) config('holistic.verification_ttl_minutes', 15);
        $verificationUrl = URL::temporarySignedRoute(
            'api.v1.auth.verify-email-link',
            now()->addMinutes($minutes),
            [
                'user' => $notifiable->getKey(),
                'code' => $this->code,
            ],
        );

        return (new MailMessage)
            ->subject('Votre code de vérification Holistique Books')
            ->greeting('Bienvenue sur Holistique Books')
            ->line('Utilisez ce code pour confirmer votre adresse email :')
            ->line('**'.$this->code.'**')
            ->action('Valider mon adresse email', $verificationUrl)
            ->line("Le code et le lien expirent dans {$minutes} minutes.")
            ->line('Si vous n’êtes pas à l’origine de cette inscription, vous pouvez ignorer ce message.')
            ->salutation('L’équipe Holistique Books');
    }
}
