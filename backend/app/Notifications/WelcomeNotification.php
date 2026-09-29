<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WelcomeNotification extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $role = $notifiable->profile?->role;
        $destination = $role === 'author' ? '/dashboard/author' : '/dashboard/reader';

        return (new MailMessage)
            ->subject('Votre compte Holistique Books est activé')
            ->greeting('Votre adresse email est confirmée')
            ->line('Votre compte Holistique Books est maintenant actif.')
            ->action('Accéder à mon espace', config('holistic.frontend_url').$destination)
            ->line('Votre bibliothèque, vos achats et votre progression resteront synchronisés avec votre compte.')
            ->salutation('L’équipe Holistique Books');
    }
}
