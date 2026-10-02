# HolisticBooks Mobile

Application Flutter officielle de HolisticBooks v4.

## Architecture

- Riverpod : état et injection
- Dio : API Laravel
- GoRouter : navigation et deep links
- Flutter Secure Storage : jeton Sanctum
- pdfx : fondation lecteur PDF
- API : https://api.aba.cd/api/v1

## Initialisation locale

```bash
cd mobile
flutter create . --platforms=android,ios --org cd.aba.holisticbooks
flutter pub get
flutter run --dart-define=API_BASE_URL=https://api.aba.cd/api/v1
```

Conserver les fichiers déjà présents dans lib/, pubspec.yaml et analysis_options.yaml.

## Aperçu gratuit

Un visiteur non connecté est limité aux 10 premières pages. À la page 10, l’application demande la création ou la connexion à un compte lecteur. Après authentification, Laravel revalide l’accès complet.

## Roadmap

1. Authentification + vérification email
2. Catalogue + détail livre
3. Lecteur PDF réel sur flux privé Laravel
4. EPUB
5. Bibliothèque + progression
6. Favoris + avis
7. Abonnements + paiement
8. Audio/vidéo
9. Hors-ligne sécurisé
10. Push notifications
