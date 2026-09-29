<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Throwable;

class TestHolisticMail extends Command
{
    protected $signature = 'holistic:test-mail {email}';

    protected $description = 'Send a production mail diagnostic without exposing SMTP credentials.';

    public function handle(): int
    {
        $email = (string) $this->argument('email');

        try {
            Mail::raw(
                'Test de messagerie Holistique Books. Si vous recevez ce message, la configuration SMTP du backend Laravel fonctionne.',
                fn ($message) => $message->to($email)->subject('Test SMTP Holistique Books'),
            );
        } catch (Throwable $error) {
            $this->error('MAIL_ERROR: '.$error->getMessage());
            return self::FAILURE;
        }

        $this->info('MAIL_SENT: '.$email);
        return self::SUCCESS;
    }
}
