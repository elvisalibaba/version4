# Holistique Books — Backend éditorial professionnel V2

## Principes

Le catalogue ne doit pas confondre **ingestion**, **enrichissement éditorial**, **validation des droits** et **publication**.

Un livre peut donc être enregistré avec des informations partielles sans être refusé. La qualité et les droits sont ensuite contrôlés dans la chaîne éditoriale.

## Catalogue

Minimum administrateur :

- titre.

Tout le reste peut être complété progressivement :

- auteur ou attribution libre ;
- ISBN ;
- éditeur ;
- édition ;
- description ;
- catégories ;
- fichiers ;
- couverture ;
- prix ;
- données académiques ;
- données spirituelles.

## Attribution des œuvres

Le modèle gère :

- auteur identifié ;
- collectif ;
- institution / organisation ;
- anonyme ;
- tradition / attribution historique ;
- texte sacré.

Le champ `author_id` est nullable.

`author_credit` contient le crédit réellement affiché au lecteur sans imposer la création d’un faux profil auteur.

## Pôles éditoriaux

- Catalogue général
- Pôle ecclésial / édition spirituelle
- Pôle institutionnel
- Pôle entrepreneurial

## Édition spirituelle

Types dédiés :

- Bible
- Théologie
- Dévotion / méditation
- Prédication / sermon
- Prière
- Recueil de chants
- Guide d’étude

Métadonnées possibles :

- tradition / courant ;
- dénomination / ministère ;
- traduction biblique ;
- Ancien / Nouveau Testament / Bible complète ;
- corpus ou référence biblique ;
- public ciblé ;
- thèmes spirituels.

## Couvertures garanties

Le backend garantit une cover selon cette priorité :

1. upload administrateur ;
2. cover importée ;
3. page 1 du PDF avec Poppler ;
4. page 1 avec Imagick ;
5. QuickLook sur macOS ;
6. fallback SVG Holistique Books avec titre et crédit auteur.

Commande de maintenance :

```bash
php artisan books:repair-covers --all
```

## Chaîne éditoriale

Étapes suivies :

1. Collecte / réception
2. Brief / diagnostic
3. Contrat / cadrage
4. Planification
5. Rédaction / manuscrit
6. Première correction
7. Seconde relecture
8. Mise en page
9. Design / couverture
10. BAT
11. Production / impression
12. Diffusion / distribution
13. Publication / suivi

Chaque changement important est enregistré dans `book_editorial_events`.

## BAT

Le catalogue possède un statut BAT indépendant :

- pending
- in_review
- approved
- rejected

La date et le responsable de validation sont enregistrés lors de l’approbation.

## Administration

Actions principales :

- Ajouter un livre
- Import rapide jusqu’à 50 fichiers
- Importer un ZIP jusqu’à 50 livres
- Réparer les covers
- Valider et publier les imports
- Valider et publier une sélection
- Consulter l’historique éditorial

## Droits

La souplesse d’ingestion ne désactive pas la sécurité des droits.

Les ouvrages entrent par défaut en `copyright_status = review`.

Un auteur explicitement marqué comme référence internationale reste bloqué à la publication tant qu’un droit actif n’est pas enregistré.

## Compatibilité

Les champs historiques `author_display_name`, `cover_url`, `categories`, `status`, `review_status` et `copyright_status` sont conservés afin de ne pas casser le frontend existant.
