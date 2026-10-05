# Import professionnel de livres — Holistique Books

## Objectif

L’import administrateur est un mécanisme d’ingestion, pas un contrôle éditorial bloquant.

Un livre doit pouvoir entrer dans le catalogue avec un minimum d’informations puis être enrichi par l’équipe. Les droits de diffusion restent contrôlés séparément au moment de la publication.

## Trois formats de lot acceptés

### 1. ZIP avec manifest.json

```text
lot-holistique-books.zip
├── manifest.json
├── books/
│   ├── book-001.pdf
│   └── ...
└── covers/
    ├── book-001.webp
    └── ...
```

Le manifeste peut contenir jusqu’à 50 entrées :

```json
{
  "version": 1,
  "books": [
    {
      "file": "books/book-001.pdf",
      "cover": "covers/book-001.webp",
      "title": "Titre",
      "author": "Nom auteur",
      "author_credit": "Nom affiché",
      "authorship_type": "named",
      "publisher": "Éditeur",
      "edition": "2e édition",
      "isbn": "978...",
      "language": "fr",
      "editorial_pole": "ecclesial",
      "work_type": "theology",
      "categories": ["Théologie"]
    }
  ]
}
```

### 2. ZIP avec catalogue.csv

Colonnes reconnues en français ou anglais :

```text
file,cover,title,author,author_credit,authorship_type,publisher,edition,isbn,language,editorial_pole,work_type
```

Les champs autres que `file` sont facultatifs.

### 3. ZIP brut

Un ZIP contenant uniquement :

```text
books/
  livre-1.pdf
  livre-2.epub
covers/
  livre-1.webp
  livre-2.jpg
```

est accepté sans manifeste.

Le système :
- déduit le titre depuis le nom du fichier ;
- associe automatiquement une cover portant le même nom ;
- accepte un auteur absent ;
- reconnaît les noms contenant « Bible », « Ancien Testament » ou « Nouveau Testament » comme textes sacrés du pôle ecclésial ;
- génère une couverture si aucune image n’est fournie.

## Attribution d’auteur

`author_id` est facultatif.

Types d’attribution disponibles :

- `named`
- `collective`
- `institutional`
- `anonymous`
- `traditional`
- `sacred_text`

Une Bible peut donc être enregistrée sans faux profil auteur.

## Couvertures

Priorité :

1. cover fournie manuellement ;
2. cover présente dans le ZIP ;
3. première page du PDF ;
4. couverture Holistique Books générée automatiquement.

Aucun livre ne doit rester sans `cover_url` après enrichissement.

Réparation du catalogue existant :

```bash
php artisan books:repair-covers
```

Pour revérifier aussi les chemins cassés :

```bash
php artisan books:repair-covers --all
```

## Doublons

Un checksum SHA-256 est conservé. Un doublon n’est plus bloqué pendant l’ingestion : l’identifiant du livre déjà connu est enregistré dans `ingestion_metadata.duplicate_of`.

L’équipe peut donc traiter le cas ensuite sans perdre un import volontaire.

## Droits

Importer n’équivaut jamais à déclarer les droits acquis.

Par défaut :

- `status = draft`
- `review_status = draft`
- `copyright_status = review`

La publication en masse demande toujours une confirmation explicite des droits.

## Formats

L’import de lot accepte comme sources :

- PDF
- EPUB
- MOBI
- AZW3

Le PDF bénéficie en plus de l’extraction du nombre de pages et de la première page comme cover lorsque le serveur dispose d’un moteur compatible.

## Limites

- jusqu’à 50 livres par lot ;
- jusqu’à 450 Mo par fichier applicatif ;
- les limites PHP / serveur doivent être configurées au-dessus de ces valeurs.
