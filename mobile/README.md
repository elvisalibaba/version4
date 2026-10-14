# HolisticBooks Mobile

Application Flutter officielle de HolisticBooks v4.

## Architecture

- Riverpod : état et injection
- Supabase Flutter : authentification et session JWT
- Flutter Secure Storage : persistance chiffrée de la session Supabase
- Cryptography : chiffrement AES-256-GCM des pages hors ligne
- Path Provider : bibliothèque privée propre à l'utilisateur
- Dio : routes mobiles Next.js et lecteur sécurisé
- GoRouter : navigation et deep links
- pdfx : fondation lecteur PDF
- API : https://holistique-books.com/api
- Supabase : projet partagé avec l'application Next.js

## Initialisation locale

```bash
cd mobile
flutter create . --platforms=android,ios --org cd.aba.holisticbooks
flutter pub get
flutter run --dart-define-from-file=.env.local.json
```

Le fichier local `.env.local.json` contient `API_BASE_URL`, `SUPABASE_URL` et
`SUPABASE_PUBLISHABLE_KEY`. Il est ignoré par Git. En CI, fournissez les mêmes
valeurs avec `--dart-define` ou `--dart-define-from-file`.

## Aperçu gratuit

Un visiteur non connecté est limité aux 10 premières pages. À la page 10,
l’application demande la création ou la connexion à un compte lecteur. Après
authentification, Next.js transmet le JWT Supabase à la fonction de lecture
sécurisée, qui revalide les droits d'accès.

## Lecture hors connexion

Un lecteur connecté et autorisé peut télécharger un livre depuis sa fiche.
Supabase émet une licence liée au compte, au téléphone et au livre. Les pages
sont récupérées par les routes sécurisées Next.js puis chiffrées séparément en
AES-256-GCM dans le répertoire privé de l'application. La clé de licence reste
dans Android Keystore via Flutter Secure Storage et n'est jamais écrite dans le
manifeste du livre.

La bibliothèque locale indique la date d'expiration, ouvre directement le
lecteur sans réseau et permet de supprimer le téléchargement et sa clé. Une
licence standard dure 7 jours ; elle dure 30 jours pour un achat ou un livre
gratuit ajouté à la bibliothèque.

## État fonctionnel

- [x] Authentification + vérification email
- [x] Catalogue + détail livre
- [x] Lecteur PDF réel sur flux privé Supabase via Next.js
- [x] Bibliothèque et lecture hors connexion chiffrée
- [ ] EPUB
- [ ] Progression, favoris et avis
- [ ] Abonnements + paiement natif
- [ ] Audio/vidéo
- [ ] Push notifications
