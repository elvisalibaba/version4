# Holistique Books — Mise en production sur cPanel (sans SSH)

L'hébergement n'offre ni SSH ni terminal. **Tout passe par le Gestionnaire de
fichiers et une seule tâche cron** (`cpanel-cron.sh`), qui joue le rôle du terminal :
déploiement, migrations, sauvegarde, file d'attente des e-mails et tâches planifiées.

## 0. Structure sur le serveur

```
/home/UTILISATEUR/
├── holistic-api/                 ← application Laravel (ZIP « private »), hors web
│   ├── cpanel-cron.sh
│   ├── RELEASE                   ← identifiant de version (déclenche le déploiement)
│   ├── .env                      ← à créer une fois
│   └── storage/app/deploy/       ← STATUS.txt, make-admin.txt, DEPLOY
└── public_html/api.aba.cd/       ← ZIP « public » (index.php pointe vers ../../holistic-api)
```

`storage/` ne doit jamais être sous `public_html`.

## 1. Fabriquer les ZIP

GitHub → Actions → **Production package** → *Run workflow* (ou push sur `production`).
Téléchargez l'artefact : il contient
`holisticbooks-api-production-…zip` (privé), `holisticbooks-api-public-…zip` (public)
et leurs `.sha256`. Les dépendances (`vendor/`) et les assets Filament sont déjà inclus.

## 2. Premier déploiement (base neuve)

1. **cPanel > Bases de données MySQL** : créez la base et l'utilisateur, avec tous les privilèges.
2. **Sélectionner une version de PHP** : PHP 8.3 ou 8.4, extensions `intl`, `mbstring`,
   `pdo_mysql`, `fileinfo`, `zip`, `openssl`, `gd`, `curl`. Activez aussi `imagick`
   pour le lecteur PDF lorsque l’hébergeur ne fournit pas `pdftoppm`.
3. **Gestionnaire de fichiers** :
   - extrayez le ZIP privé dans `/home/UTILISATEUR/holistic-api` ;
   - extrayez le ZIP public dans `public_html/api.aba.cd` ;
   - dans `holistic-api`, copiez `.env.production.example` en `.env` et remplissez :
     `DB_*`, `MAIL_*`, `EASYPAY_*`, `SUPPORT_EMAIL`, `FRONTEND_PROXY_SECRET`
     (≥ 40 caractères aléatoires, **même valeur** dans le `.env` du front Next.js).
     Laissez `APP_KEY=` vide : il sera généré automatiquement.
4. **cPanel > Tâches Cron** : ajoutez **une seule** ligne, toutes les minutes :

   ```
   * * * * * /bin/bash /home/UTILISATEUR/holistic-api/cpanel-cron.sh >/dev/null 2>&1
   ```

5. Attendez 1 à 2 minutes, puis ouvrez `holistic-api/storage/app/deploy/STATUS.txt`.
   Il doit afficher `Résultat : OK`. Sinon, lisez `storage/logs/deploy.log`.

Le premier passage génère `APP_KEY`, lance les migrations, charge le référentiel
éducatif RDC, met en cache la configuration et vérifie la santé de l'application.

Si `deploy.log` indique *aucun PHP 8.3+ CLI trouvé*, précisez le binaire dans la ligne cron :

```
* * * * * PHP_BIN=/usr/local/bin/ea-php83 /bin/bash /home/UTILISATEUR/holistic-api/cpanel-cron.sh >/dev/null 2>&1
```

## 3. Créer le premier administrateur

Dans `holistic-api/storage/app/deploy/`, créez le fichier `make-admin.txt` :

```
votre.email@exemple.com
UnMotDePasseLongEtUnique
Votre Nom
```

À la minute suivante, le cron crée un **super administrateur** dont l'e-mail est déjà
vérifié, puis **supprime le fichier**. Connectez-vous sur `https://api.aba.cd/admin`.
Les autres membres du staff se créent ensuite depuis le Control Center
(Utilisateurs → rôle *admin* + fonction interne). Seul un super administrateur peut
attribuer un rôle ou une fonction interne.

## 4. Mises à jour suivantes

1. Lancez le workflow **Production package** et téléchargez les ZIP.
2. Extrayez le ZIP privé **par-dessus** `holistic-api` (le `.env` et `storage/` sont conservés),
   puis le ZIP public dans `public_html/api.aba.cd`.
3. Le fichier `RELEASE` a changé : le cron déploie automatiquement à la minute suivante.
   Il met le site en maintenance, sauvegarde la base (`storage/app/backups/`), migre,
   reconstruit les caches puis remet le site en ligne.
4. Vérifiez `STATUS.txt`.

**En cas d'échec de migration**, le site est remis en ligne, la version est notée dans
`failed-release` et elle n'est **pas** retentée en boucle. Après correction, créez un fichier
vide `storage/app/deploy/DEPLOY` pour relancer. Pour restaurer, importez la sauvegarde
`storage/app/backups/*.sql.gz` via **phpMyAdmin > Importer**.

Toute évolution du schéma passe par une **nouvelle** migration. Ne modifiez jamais
une migration déjà exécutée en production.

## 5. Ce que fait le cron chaque minute

- `schedule:run` :
  - envoi des e-mails en file d'attente (bienvenue, reçus de paiement) ;
  - royalties devenues payables (02:00) ;
  - expiration des contrats de droits (01:30) ;
  - nettoyage des sessions de lecture (toutes les heures) ;
  - purge des jetons expirés (chaque jour).
- Déploiement, si `RELEASE` a changé ou si `DEPLOY` existe.
- Création d'administrateur, si `make-admin.txt` existe.

## 6. Variables critiques

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.aba.cd
FRONTEND_URL=https://holistique-books.com
FRONTEND_PROXY_SECRET=…            # identique côté Next.js
SANCTUM_EXPIRATION_MINUTES=43200   # 30 jours, comme le cookie du front
QUEUE_CONNECTION=database
SESSION_DRIVER=database
CACHE_STORE=database
EASYPAY_MODE=v1                    # sandbox tant que les tests ne sont pas validés
BOOK_PDF_MAX_CONCURRENT_RENDERS=3
BOOK_PDF_IMAGICK_ENABLED=true      # repli sans pdftoppm
```

Côté **front Next.js** : `API_URL=https://api.aba.cd` et `FRONTEND_PROXY_SECRET=` (même
valeur, jamais préfixée par `NEXT_PUBLIC_`). Sans cette clé, l'API voit l'IP du
serveur Next pour tous les visiteurs, et les limites de débit (mot de passe oublié,
renvoi de code, aperçu PDF) sont partagées par tout le monde.

## 7. Lecteur protégé

- Le lecteur utilise `pdftoppm` (Poppler) s’il est disponible, sinon l’extension PHP
  `imagick` avec la prise en charge du format PDF. Sur cPanel, activez `imagick` depuis
  **Select PHP Version > Extensions** : aucune commande d’installation n’est nécessaire.
- `STATUS.txt` / `holistic:health` indique le moteur retenu. Si ni Poppler ni Imagick/PDF
  ne sont disponibles, demandez leur activation à l’hébergeur ; ne réactivez jamais le
  téléchargement du PDF complet comme contournement.
- Les PDF restent sur le disque privé. Les lecteurs reçoivent des images page par page,
  via une session courte liée au compte.

## 8. Finance auteurs

- Le **taux de royalties** se fixe uniquement dans *Control Center → Finance auteurs →
  Taux de royalties* (permission `finance.manage`). Les auteurs le voient en lecture seule.
- Un portefeuille par devise : une vente en CDF crédite le portefeuille CDF, une vente
  en USD le portefeuille USD. Un retrait débite le portefeuille de la devise du compte
  de versement.

## 9. Révisions de livres publiés

Le nouveau manuscrit d'un livre publié, déposé par l'auteur, est archivé
(`pending_review`) et le livre passe en *soumis*. La version en ligne ne change pas.
Dans *Catalogue*, l'action **Appliquer la révision** (permission `catalog.publish`) la met en ligne.

## 10. Sauvegardes

Les sauvegardes de `storage/app/backups` restent sur le même serveur : **ce n'est pas
une sauvegarde suffisante**. Activez aussi les sauvegardes cPanel vers un stockage
externe, téléchargez régulièrement un `.sql.gz` et testez une restauration chaque mois.

## 11. Contrôles fonctionnels après mise en ligne

- inscription → code e-mail → connexion ;
- mot de passe oublié depuis deux appareils différents (pas de blocage croisé) ;
- achat EasyPay en sandbox : succès, échec, callback dupliqué ;
- lecture protégée page par page ; l'aperçu invité est limité à `sample_pages` ;
- un auteur ne peut ni changer son taux, ni remplacer le fichier d'un livre publié ;
- un membre *support* ne peut pas modifier le catalogue ni les rôles.
