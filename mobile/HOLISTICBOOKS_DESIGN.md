# Charte graphique Holistique Books

Cette charte reprend les couleurs réelles du logo officiel présent dans
`public/brand` et sert de source unique pour l’application mobile.

## Principes

- Fond principal : #F8F9FE
- Surface : #FFFFFF
- Bleu signature : #506AFF
- Bleu clair : #8293FF
- Bleu nuit / texte principal : #070D2E
- Texte secondaire : #626B85
- Surface bleutée : #EEF1FF
- Surface champs : #F0F2FA
- Bordure légère : #DDE2F2
- Largeur maximale du contenu : 430 px
- Padding horizontal : 16 px
- Boutons : 42 px, rayon 21 px
- Champs : 52 px, rayon 8 px
- Titres principaux : 28 px, graisse 800
- Corps : 13 px

## Logo et mouvement

- Icône officielle : `public/brand/icon-blue.png`
- Logo horizontal clair : `public/brand/logo-light.png`
- Ne jamais recréer le symbole avec une lettre ou une icône générique.
- Les apparitions utilisent une combinaison courte fondu + échelle.
- Les écrans secondaires utilisent un fondu + glissement de 280 ms.
- Le lecteur utilise un mouvement vertical discret de 360 ms.
- Les animations respectent le réglage système de réduction des mouvements.

## Navigation mobile

Navigation persistante à quatre destinations :
1. Accueil
2. Découvrir
3. Bibliothèque
4. Profil

## Composants partagés

- AppColors
- AppDimensions
- AppLogo
- AppButton
- AppTextField
- AuthBackground
- AppShell
- OfflineDownloadButton

## Lecture hors connexion

- Les pages restent dans le répertoire privé de l’application.
- Chaque page est chiffrée en AES-256-GCM avec la clé de licence conservée dans
  le stockage sécurisé du téléphone.
- Une licence est limitée dans le temps et liée au compte et à l’appareil.
- La suppression depuis la bibliothèque efface les pages locales et la clé.

Toute nouvelle interface mobile HolisticBooks doit réutiliser ces composants et tokens avant d’introduire une nouvelle valeur locale.
