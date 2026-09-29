# Holistique Books — Architecture éditoriale et multimédia

## Vision

Holistique Books est structuré comme une maison d’édition numérique et une plateforme de distribution, et non comme un simple catalogue de fichiers.

Le même noyau Laravel gère :

- maison d’édition et labels ;
- auteurs plateforme, auteurs catalogue et références internationales ;
- acquisitions et contrats de droits ;
- ebooks et imprimés ;
- livres audio ;
- éditions vidéo et contenus enrichis ;
- catégories éditoriales ;
- ventes, abonnements et royalties ;
- publicité web et mobile ;
- accès lecteur web et Flutter.

## Maison d’édition

### publishing_houses

Représente une structure éditoriale.

Holistique Books est créée automatiquement comme maison principale lors de la migration.

### publishing_imprints

Permet de créer des labels éditoriaux distincts sous une même maison : jeunesse, business, littérature, académique, etc.

### publishing_house_members

Associe les comptes internes aux fonctions de la maison :

- direction ;
- administration ;
- éditorial ;
- droits ;
- marketing ;
- finance ;
- analyse.

Cette structure prépare une future gestion fine des permissions.

## Catalogue auteurs

Un auteur peut être :

- `platform` : auteur disposant d’un compte ;
- `publisher_catalog` : auteur géré directement par la maison ;
- `international_reference` : profil interne de prospection.

Les profils internationaux de référence ne sont pas présentés publiquement comme partenaires de Holistique Books sans titre public licencié.

## Acquisition et droits

### rights_acquisition_targets

Pipeline interne avant publication :

`prospect -> contacted -> negotiating -> contracted`

Il sert à suivre les œuvres que la maison souhaite acquérir.

Une sélection initiale de 10 auteurs internationaux est ajoutée comme références internes. Les titres associés sont des cibles de prospection et ne constituent pas des licences.

### rights_contracts

Une fois les droits obtenus, le contrat peut préciser :

- titulaire des droits ;
- territoires ;
- langues ;
- formats autorisés ;
- exclusivité ;
- dates ;
- conditions de royalties ;
- pièce contractuelle privée.

Un livre lié à un auteur international de référence ne peut pas passer en publication sans droit actif enregistré.

Le catalogue public exige également `copyright_status = clear`.

## Catégories

La taxonomie est stockée dans `categories`, avec :

- hiérarchie parent/enfant ;
- description ;
- ordre ;
- catégorie mise en avant ;
- activation ;
- types de contenus compatibles.

Le livre conserve un snapshot JSON utile aux APIs existantes et synchronise également la relation normalisée `book_categories`.

Les catégories initiales couvrent notamment littérature africaine et congolaise, roman, jeunesse, business, finance, développement personnel, technologie/IA, santé, histoire, science et spiritualité.

## Multimédia

### media_editions

Une œuvre peut avoir plusieurs éditions :

- ebook ;
- audiobook ;
- video ;
- print ;
- bundle.

Les métadonnées comprennent langue, durée, narrateur, présentateur, stockage, streaming, preview, MIME, DRM et statut.

### media_chapters

Découpe une édition audio ou vidéo en chapitres/pistes avec timecodes et possibilité d’extrait.

### Accès sécurisé

Le lecteur demande :

`GET /api/v1/media-editions/{id}/access`

Laravel vérifie l’achat, la gratuité ou l’abonnement à l’aide du même système d’accès que les livres.

Les fichiers privés peuvent être servis par une URL signée temporaire. Le streaming local prend en charge HTTP Range.

## Publicité

### ad_campaigns

Définit annonceur, objectif, budget, devise, calendrier, canaux et ciblage.

### ad_placements

Définit les emplacements disponibles sur web et mobile.

### ad_creatives

Stocke bannière, image, vidéo ou native ad, avec CTA et destination.

### ad_assignments

Associe création + campagne + emplacement et contrôle période/poids.

### ad_events

Enregistre impressions et clics avec contexte. Le système ne stocke pas l’adresse IP brute comme identifiant publicitaire.

## Emplacements initiaux

Web :

- `web.home.hero`
- `web.home.feed`
- `web.book.detail`
- `web.reader.dashboard`

Mobile :

- `mobile.home.banner`
- `mobile.library.native`
- `mobile.reader.interstitial`

Le frontend web consomme déjà le moteur via `AdSlot`. Flutter utilisera les mêmes endpoints.

## Espaces utilisateurs

### Admin

Le Control Center expose notamment :

- catalogue et catégories ;
- auteurs ;
- maison et labels ;
- équipe éditoriale ;
- acquisitions et contrats de droits ;
- audio/vidéo et chapitres ;
- campagnes, emplacements, créations et diffusion publicitaire ;
- ventes, paiements, versements et statistiques.

### Auteur

L’Author Studio conserve publication, distribution, ventes et finances, avec un nouvel espace audio/vidéo lié aux mêmes œuvres.

### Lecteur

L’espace lecteur regroupe bibliothèque, progression, favoris, achats, Premium et média. Les éditions audio/vidéo utilisent les mêmes droits d’accès que les livres.

## Principe juridique

Une donnée bibliographique ou un profil d’auteur de référence ne vaut jamais licence.

Le système distingue donc strictement :

1. cible d’acquisition ;
2. négociation ;
3. contrat actif ;
4. création du titre ;
5. validation des droits ;
6. publication.

Cette séparation doit être conservée dans les futurs workflows.
