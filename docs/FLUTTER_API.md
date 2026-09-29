# Holistique Books — contrat API Flutter

Base production :

`https://api.aba.cd/api/v1`

## Authentification

L’application Flutter utilise des tokens Bearer Laravel Sanctum.

### Inscription
`POST /auth/register`

Le compte est créé mais reste non vérifié. L’API envoie un code OTP à 6 chiffres.

### Vérification email
`POST /auth/verify-email`

Payload :

```json
{
  "email": "reader@example.com",
  "code": "123456",
  "device_name": "Flutter Android"
}
```

La réponse contient le token Sanctum.

### Connexion
`POST /auth/login`

```json
{
  "email": "reader@example.com",
  "password": "secret",
  "device_name": "Flutter Android"
}
```

Envoyer ensuite :

`Authorization: Bearer <token>`

## Bootstrap mobile

`GET /mobile/bootstrap`

Retourne la version API, les fonctionnalités activées, les règles d’authentification et les versions mobiles publiées.

## Appareil

`POST /mobile/devices`

Exemple :

```json
{
  "device_uuid": "uuid-stable-genere-par-l-app",
  "platform": "android",
  "device_name": "Samsung Galaxy",
  "manufacturer": "Samsung",
  "model": "SM-...",
  "os_version": "Android 16",
  "app_version_name": "1.0.0",
  "app_version_code": 1,
  "metadata": {}
}
```

Heartbeat :

`POST /mobile/devices/{deviceUuid}/heartbeat`

Révocation :

`DELETE /mobile/devices/{deviceUuid}`

## Push notifications

`POST /mobile/push-token`

```json
{
  "device_uuid": "uuid-stable-genere-par-l-app",
  "provider": "fcm",
  "token": "<FCM_TOKEN>"
}
```

## Catalogue et bibliothèque

- `GET /books`
- `GET /books/{id}`
- `GET /library`
- `GET /reader/dashboard`
- `GET /favorites`
- `POST /favorites/{bookId}`
- `DELETE /favorites/{bookId}`

## Lecture synchronisée

- `GET /read/{bookId}`
- `GET /books/{bookId}/progress`
- `PUT /books/{bookId}/progress`
- `GET /books/{bookId}/highlights`
- `POST /books/{bookId}/highlights`
- `PUT /highlights/{id}`
- `DELETE /highlights/{id}`

Le backend contient déjà les tables pour appareils, licences offline, téléchargements, file de synchronisation et tokens push. Flutter doit conserver un `device_uuid` stable par installation.

## Paiement

- `POST /payments/easypay/init`
- `POST /payments/easypay/orders/{order}/reconcile`

EasyPay reste entièrement contrôlé côté Laravel. Aucun token marchand ne doit être embarqué dans l’application Flutter.

## Règles de sécurité

- ne jamais stocker le token Sanctum en clair hors stockage sécurisé ;
- utiliser `flutter_secure_storage` pour le token ;
- ne jamais embarquer les secrets EasyPay ;
- utiliser le backend pour les URLs privées de livres ;
- révoquer l’appareil lors d’une déconnexion définitive ;
- prévoir certificate pinning uniquement après stabilisation des certificats de production.


## Livres audio et vidéo

Les éditions multimédia utilisent le même catalogue et les mêmes droits d'accès que les ebooks.

Après authentification :

`GET /media-editions/{mediaEditionId}/access`

La réponse contient notamment :

```json
{
  "data": {
    "id": "uuid",
    "book_id": "uuid",
    "media_type": "audiobook",
    "title": "Edition audio",
    "duration_seconds": 14400,
    "narrator": "Nom du narrateur",
    "playback_url": "https://api.aba.cd/api/v1/media-editions/.../stream?signature=...",
    "expires_in_seconds": 900,
    "chapters": []
  }
}
```

Le client Flutter ne doit jamais construire lui-même une URL de fichier privé. Il demande toujours un contrat de lecture au backend.

Pour les fichiers stockés localement, l'URL de lecture est signée et temporaire. Le endpoint de streaming accepte les requêtes HTTP Range pour la navigation audio/vidéo.

Pour un futur CDN, le même endpoint `access` pourra renvoyer une URL CDN signée sans changer le contrat Flutter.

## Publicité mobile

Les emplacements mobiles sont administrés dans Filament et utilisent le même moteur que le web.

Exemples déjà prévus :

- `mobile.home.banner`
- `mobile.library.native`
- `mobile.reader.interstitial`

Récupération :

`GET /ads/mobile.home.banner?channel=mobile`

Événement d'impression ou clic :

`POST /ads/{assignmentId}/events`

```json
{
  "event_type": "impression",
  "session": "installation-or-session-id",
  "context": {
    "channel": "mobile",
    "screen": "home"
  }
}
```

L'application doit clairement distinguer les contenus sponsorisés du catalogue éditorial.
