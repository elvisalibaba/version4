<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentReceiptNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Order $order) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $order = $this->order->loadMissing('items.book');
        $amount = number_format((float) $order->total_price, 2, ',', ' ');
        $titles = $order->items->pluck('book.title')->filter()->implode(', ');

        $mail = (new MailMessage)
            ->subject('Paiement confirmé - Holistique Books')
            ->greeting('Paiement confirmé')
            ->line("Nous avons confirmé votre paiement de {$amount} {$order->currency_code}.")
            ->line('Référence : '.($order->payment_transaction_id ?: $order->id));

        if ($titles !== '') {
            $mail->line('Achat : '.$titles);
        }

        return $mail
            ->action('Ouvrir ma bibliothèque', config('holistic.frontend_url').'/dashboard/reader/library')
            ->line('Votre achat numérique est disponible dans votre bibliothèque dès maintenant.')
            ->salutation('L’équipe Holistique Books');
    }
}
