<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class HolisticResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly string $token) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = config('holistic.frontend_url')
            .'/reset-password?token='.urlencode($this->token)
            .'&email='.urlencode((string) $notifiable->email);

        return (new MailMessage)
            ->subject('Réinitialiser votre mot de passe Holistique Books')
            ->greeting('Réinitialisation du mot de passe')
            ->line('Une demande de réinitialisation a été reçue pour votre compte.')
            ->action('Choisir un nouveau mot de passe', $url)
            ->line('Ce lien est temporaire. Si vous n’avez rien demandé, ignorez simplement ce message.')
            ->salutation('L’équipe Holistique Books');
    }
}
