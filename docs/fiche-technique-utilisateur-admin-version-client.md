# Fiche technique utilisateur admin - Version client

Version de reference au 2026-03-16

## 1. Presentation

L'espace administrateur de HolistiqueBooks est le centre de pilotage de la plateforme. Il permet a l'equipe de supervision de gerer les utilisateurs, suivre les auteurs, administrer le catalogue, controler les ventes, piloter les abonnements et animer les contenus marketing.

Cette version est redigee pour un usage client, avec un langage fonctionnel et metier.

## 2. Objectifs de l'espace admin

L'interface admin a ete concue pour permettre :

- la supervision globale de l'activite de la plateforme
- la gestion des comptes utilisateurs et des roles
- le suivi editorial des livres soumis par les auteurs
- le controle commercial des commandes et des acces lecteurs
- la gestion des abonnements Premium
- la moderation des interactions lecteurs
- l'animation marketing du blog et des campagnes flash sale

## 3. Profil utilisateur concerne

Cette interface est reservee aux administrateurs de HolistiqueBooks.

L'administrateur peut intervenir sur :

- les comptes lecteurs
- les comptes auteurs
- les livres et leurs formats
- les commandes
- la bibliotheque numerique
- les abonnements
- les contenus editoriaux et promotionnels

## 4. Acces et securite

L'acces au back-office admin est protege.

- Un utilisateur doit etre authentifie pour acceder a l'interface.
- Seuls les comptes disposant du role administrateur peuvent ouvrir les ecrans admin.
- En cas d'absence d'autorisation, l'utilisateur est automatiquement redirige hors de l'espace admin.
- Les controles sont assures a la fois dans l'application et au niveau de la base de donnees.

Cette approche permet de securiser les donnees sensibles et de limiter strictement les actions reservees a l'administration.

## 5. Vue d'ensemble des modules disponibles

### 5.1 Cockpit admin

Le cockpit offre une vision synthetique de la plateforme avec :

- les principaux indicateurs d'activite
- le suivi des utilisateurs
- les performances du catalogue
- les commandes recentes
- les livres en attente de validation

Il sert de tableau de bord de pilotage quotidien.

### 5.2 Gestion des utilisateurs

Le module utilisateurs permet de :

- rechercher un compte
- filtrer par profil
- consulter les informations d'un utilisateur
- visualiser son historique d'achats et d'activite
- modifier son role

L'administrateur peut ainsi faire evoluer un utilisateur en lecteur, auteur ou administrateur selon le besoin.

### 5.3 Gestion des auteurs

Le module auteurs centralise :

- les fiches auteur
- les informations de presentation
- les performances commerciales
- la liste des livres publies ou en cours

Il facilite le suivi de la relation auteur et la qualite des profils visibles sur la plateforme.

### 5.4 Gestion du catalogue

Le module livres permet de :

- consulter l'ensemble du catalogue
- filtrer par statut, langue, auteur ou categorie
- verifier les informations d'un livre
- mettre a jour les metadonnees
- suivre les performances et interactions autour d'un titre

Ce module constitue le coeur de la gestion editoriale.

### 5.5 Revue et validation des soumissions

Lorsqu'un auteur soumet un livre, l'administrateur peut :

- accepter la publication
- demander des corrections
- refuser la soumission
- laisser une note de retour editorial

Ce fonctionnement structure le processus de validation avant mise en ligne.

### 5.6 Gestion des formats

Pour chaque livre, l'admin peut gerer plusieurs formats, par exemple :

- ebook
- paperback
- hardcover
- audiobook

Il peut ajuster :

- le prix
- l'etat de publication
- le stock si besoin
- les informations de fichier
- le cout d'impression pour les formats physiques

### 5.7 Gestion des commandes

Le module commandes permet de :

- consulter l'historique des commandes
- verifier le detail d'une transaction
- suivre le statut de paiement
- corriger un statut en cas de besoin

Il apporte une vue claire sur l'activite commerciale de la plateforme.

### 5.8 Gestion de la bibliotheque lecteur

L'administrateur peut intervenir directement sur les acces a la bibliotheque numerique afin de :

- attribuer manuellement un livre
- corriger un acces apres incident
- retirer un acces errone
- distinguer les acces issus d'un achat, d'un abonnement ou d'une mise a disposition gratuite

Ce module est utile pour la gestion du service client et des cas exceptionnels.

### 5.9 Gestion des abonnements Premium

Le back-office permet de :

- creer des plans d'abonnement
- definir leur activation
- associer des livres a chaque plan
- suivre les utilisateurs abonnes
- corriger ou prolonger un abonnement

L'administration conserve ainsi une maitrise complete de l'offre Premium.

### 5.10 Moderation de l'engagement lecteur

Deux modules sont prevus pour suivre les interactions des lecteurs :

- les notes
- les highlights

Ils permettent de :

- lire les signaux d'engagement
- identifier les contenus problemes
- supprimer une note ou un highlight si necessaire

### 5.11 Gestion du blog editorial

L'espace admin permet a l'equipe de :

- publier un article
- organiser les contenus par categorie ou tag
- mettre a jour la vitrine editoriale
- supprimer un article devenu obselete

Ce module soutient la strategie de contenu de la marque.

### 5.12 Gestion de la flash sale

L'administrateur peut piloter une mise en avant promotionnelle depuis la home :

- reglage du pourcentage de remise
- selection des livres a promouvoir
- nettoyage ou reinitialisation de la selection
- verification du rendu promotionnel

La flash sale agit comme un levier marketing rapide et visible.

## 6. Parcours metier principaux

### 6.1 Faire evoluer un utilisateur

Un administrateur peut consulter un compte puis adapter son role selon l'organisation de la plateforme :

- lecteur
- auteur
- administrateur

### 6.2 Valider un livre auteur

Un livre soumis passe par une etape de controle admin avant publication. L'admin decide s'il doit :

- etre accepte
- revenir en correction
- etre refuse

### 6.3 Corriger un acces lecteur

En cas de reclamation ou de correction metier, l'admin peut intervenir sur la bibliotheque d'un utilisateur pour restituer ou retirer un acces.

### 6.4 Administrer l'offre Premium

L'equipe peut configurer les plans, y ajouter des livres et suivre la vie des abonnements utilisateurs.

### 6.5 Animer la plateforme

Le blog et la flash sale permettent de maintenir une presence editoriale et commerciale sans intervention technique externe.

## 7. Benefices pour l'exploitation

L'espace admin apporte plusieurs benefices concrets :

- centralisation de la supervision dans une interface unique
- reduction des interventions manuelles en base
- meilleure qualite de controle sur le catalogue
- support plus rapide des auteurs et des lecteurs
- meilleure visibilite sur l'activite commerciale
- capacite d'animation marketing autonome

## 8. Points d'attention sur la version actuelle

Dans la version actuelle du projet :

- la suspension complete d'un compte utilisateur n'est pas encore prevue
- certaines statistiques reposent sur des indicateurs techniques qui doivent rester bien synchronises
- la plateforme propose deja une supervision solide, mais certains mecanismes de journalisation peuvent encore etre enrichis a l'avenir

Ces limites n'empechent pas l'exploitation du back-office, mais elles definissent le cadre fonctionnel actuel.

## 9. Conditions de mise en service

Pour exploiter correctement le module administrateur, il faut :

- une configuration Supabase active
- une gestion des roles correctement alimentee
- les migrations de base de donnees appliquees
- la configuration des paiements si la vente en ligne est active
- la configuration email si les notifications administratives sont souhaitees

## 10. Conclusion

L'espace administrateur HolistiqueBooks constitue un back-office complet de gestion, de moderation et de pilotage. Il permet a l'equipe cliente de superviser l'ensemble des operations essentielles de la plateforme depuis une interface unique, securisee et orientee usage metier.
