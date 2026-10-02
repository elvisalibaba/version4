# HolisticBooks — Espace Éducation RDC

## Objectif

Le module Éducation organise les ouvrages destinés aux élèves et aux étudiants de la RDC sans mélanger la taxonomie pédagogique avec les catégories éditoriales générales.

Un livre peut être associé à plusieurs classifications académiques.

## Hiérarchie scolaire

Le socle fourni couvre :

- Préscolaire : 1re à 3e année.
- Primaire : 1re à 6e année.
- Cycle Terminal de l’Éducation de Base (CTEB) : 7e et 8e années.
- Humanités : 1re à 4e année.
- Humanités générales, techniques et professionnelles.
- Sections/options documentées par le Ministère : Humanités scientifiques, Mathématique-Physique, Bio-Chimie, Littéraire, Latin-Philosophie, Latin-Grec, Pédagogie générale, Normale, Éducation physique, Commerciale et Gestion, Secrétariat-Administration, Technique Industrielle, Technique Agricole, Technique Sociale, Technique Informatique, Technique Artistique, Électricité, Électronique, Pétrochimie, Coupe et Couture et Arts & Métiers.

Le référentiel reste administrable dans Filament afin de suivre les réformes curriculaires.

## Hiérarchie universitaire

Le socle fournit les cycles :

- Licence 1, Licence 2, Licence 3
- Master 1, Master 2
- Doctorat

Et les 8 domaines officiels LMD :

1. Sciences de l’Homme et de la Société
2. Sciences de la Santé
3. Sciences Économiques et de Gestion
4. Sciences et Technologie
5. Sciences Juridiques, Politiques et Administratives
6. Sciences Psychologiques et de l’Éducation
7. Sciences Agronomiques et Environnement
8. Lettres, Langues et Arts

La commande `php artisan education:sync-regesu` importe/actualise les filières et mentions publiées par RegESU.

### Parcours Théologie

HolisticBooks met en avant la filière officielle RegESU **Théologie Protestante**, rattachée au domaine **Sciences de l’Homme et de la Société**. Le socle précharge les mentions publiées par RegESU :

- Théologie Pastorale — Licence
- Exégèses et Théologies Bibliques : Ancien Testament — Master
- Exégèses et Théologies Bibliques : Nouveau Testament — Master
- Théologie systématique et éthique — Master
- Théologie Pastorale — Master
- Histoire de l’Église — Master

Ces entrées portent les codes RegESU `ESU_FIELD_10` et `ESU_MENTION_37` à `ESU_MENTION_42`, ce qui permet à la synchronisation officielle de les actualiser sans créer de doublons.

## Sources officielles

- MINEDU-NC — système éducatif : https://edu-nc.gouv.cd/systeme-educatif
- MINEDU-NC — programmes nationaux : https://edu-nc.gouv.cd/programmes-nationaux
- RegESU — domaines, filières et mentions LMD : https://regesu.minesursi.gouv.cd/lmd_filiere

## Administration

Filament > Éducation > Référentiel scolaire & universitaire.

Actions disponibles :

- Charger le référentiel RDC
- Synchroniser RegESU
- Ajouter une classification
- Modifier/désactiver une classification

Dans la fiche d’un livre, la section « Éducation scolaire et universitaire » permet d’associer plusieurs classifications au même titre.

## API publique

- `GET /api/v1/education/catalog`
- `GET /api/v1/books?education=<slug-ou-code>`
- `GET /api/v1/books?education_audience=school`
- `GET /api/v1/books?education_audience=university`

## Frontend

La route `/education` expose l’espace « Élèves & Étudiants » avec navigation par niveau, classe, section, option, cycle LMD et domaine.
