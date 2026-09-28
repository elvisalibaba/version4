# HolistiqueBooks - Fiche de fonctionnement

HolistiqueBooks utilise une architecture séparée entre le site web et le système de gestion.

## Site public

Le site `holistique-books.com` permet aux lecteurs et aux auteurs de :

- consulter le catalogue
- créer un compte
- acheter des ouvrages
- lire les livres numériques autorisés
- gérer favoris et bibliothèque
- suivre leurs abonnements
- accéder à leur espace auteur

## Administration

L’équipe HolistiqueBooks dispose d’un espace sécurisé sur :

```text
https://api.aba.cd/admin
```

Cet espace permet notamment de gérer :

- les utilisateurs
- les auteurs
- les livres
- les catégories
- les commandes
- les abonnements
- les droits de publication

## Sécurité des livres numériques

Les fichiers PDF et EPUB ne sont pas placés directement sur le site public.

Avant chaque lecture, le serveur vérifie que l’utilisateur possède un droit actif provenant d’un achat, d’un abonnement ou d’un accès gratuit autorisé.

## Paiements

Les transactions sont liées aux commandes enregistrées dans le système HolistiqueBooks.

Le statut d’un paiement est vérifié côté serveur avant de rendre un ouvrage disponible dans la bibliothèque du lecteur.

## Infrastructure

- site web : Next.js
- API métier : Laravel
- base de données : MySQL / MariaDB
- authentification : Laravel Sanctum
- administration : Filament
- stockage : Laravel privé/public
- domaine API : `api.aba.cd`
- domaine web : `holistique-books.com`

Cette séparation permet d’utiliser la même API pour le site web et les futures applications mobiles.
