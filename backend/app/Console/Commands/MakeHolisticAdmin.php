<?php

namespace App\Console\Commands;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MakeHolisticAdmin extends Command
{
    protected $signature = 'holistic:make-admin {email} {--name=} {--password=}';

    protected $description = 'Créer ou promouvoir un utilisateur HolisticBooks comme administrateur du back-office.';

    public function handle(): int
    {
        $email = mb_strtolower(trim((string) $this->argument('email')));
        $name = trim((string) ($this->option('name') ?: ''));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Adresse e-mail invalide.');

            return self::FAILURE;
        }

        $user = User::query()->where('email', $email)->first();

        if ($user === null) {
            $name = $name !== '' ? $name : (string) $this->ask('Nom complet', Str::before($email, '@'));
            $password = (string) ($this->option('password') ?: $this->secret('Mot de passe'));

            if (mb_strlen($password) < 8) {
                $this->error('Le mot de passe doit contenir au moins 8 caractères.');

                return self::FAILURE;
            }

            $user = DB::transaction(function () use ($email, $name, $password): User {
                $user = User::query()->create([
                    'name' => $name,
                    'email' => $email,
                    'password' => $password,
                ]);

                Profile::query()->create([
                    'id' => $user->id,
                    'email' => $email,
                    'name' => $name,
                    'role' => 'admin',
                    'preferred_language' => 'fr',
                    'favorite_categories' => [],
                    'marketing_opt_in' => false,
                ]);

                return $user;
            });

            $this->info("Administrateur créé : {$user->email}");

            return self::SUCCESS;
        }

        DB::transaction(function () use ($user, $name): void {
            if ($name !== '') {
                $user->update(['name' => $name]);
            }

            Profile::query()->updateOrCreate(
                ['id' => $user->id],
                [
                    'email' => $user->email,
                    'name' => $name !== '' ? $name : $user->name,
                    'role' => 'admin',
                    'preferred_language' => 'fr',
                    'favorite_categories' => [],
                    'marketing_opt_in' => false,
                ],
            );
        });

        $this->info("Accès administrateur activé pour : {$user->email}");

        return self::SUCCESS;
    }
}
