# Import préparé de livres — HolisticBooks

## Format du lot

L’admin accepte un fichier ZIP de 450 Mo maximum contenant jusqu’à 50 livres :

```
lot-holisticbooks.zip
├── manifest.json
├── books/
│   ├── book-001.pdf
│   └── ...
└── covers/
    ├── book-001.webp
    └── ...
```

Le fichier `manifest.json` contient un tableau `books`. Exemple :

```json
{
  "version": 1,
  "books": [
    {
      "file": "books/book-001.pdf",
      "cover": "covers/book-001.webp",
      "title": "Titre",
      "author": "Nom auteur",
      "co_authors": [],
      "publisher": "Éditeur",
      "edition": "2e édition",
      "isbn": "978...",
      "language": "fr",
      "page_count": 250,
      "categories": ["Développement personnel"],
      "tags": []
    }
  ]
}
```

## Comportement à l’import

Chaque livre est créé avec les valeurs sûres suivantes :

- prix : 0 USD ;
- vente individuelle / lecture gratuite : activée ;
- abonnement : désactivé ;
- statut : brouillon ;
- revue éditoriale : brouillon ;
- droits : à vérifier.

L’import ne publie donc jamais automatiquement un ouvrage dont les droits n’ont pas été validés.

Les auteurs sont créés comme profils de catalogue lorsqu’ils n’existent pas encore. Les PDF sont stockés sur le disque privé `books` et les couvertures sur le disque public.

Les doublons de fichiers sont bloqués par empreinte SHA-256.

## Admin

Dans Filament :

`Catalogue → Livres → Importer un lot préparé (jusqu’à 50)`

L’ancien import de 10 PDF reste disponible pour les lots simples ayant un auteur commun.
