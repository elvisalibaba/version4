# Holistique Books — audit performance Web (27 octobre 2026)

## Périmètre et contraintes

- Front : Next.js 16 sur Cloudflare Workers ; Web conçu pour la découverte et la lecture.
- API principale à conserver : Laravel / MySQL sur cPanel, RAM d'hébergement annoncée : 1 Go, sans terminal.
- Livres gratuits généralement 1 à 2 Mo ; objectif de 100 à 200 lecteurs concomitants.
- Mobile : aucune modification fonctionnelle requise pour cette phase.
- **La réussite de CI n'est pas une mesure de performances de production** ; le chargement réel, le débit réseau et l'utilisation PHP-FPM devront être vérifiés sur site.

## Changements proposés dans la PR #33 (frontend)

1. Les livres gratuits autorisés ne passent plus par un proxy binaire Next.js : la réponse `GET /api/read/{bookId}` fournit directement l'URL contrôlée `https://api.aba.cd/api/v1/books/{id}/read-free`.
2. Le navigateur appelle cette URL **une fois**, PDF.js conserve les octets du PDF en mémoire et les pages sont rendues localement. Un changement de page n'émet pas de requête serveur.
3. Les livres payants et leurs aperçus restent en mode page protégée avec permissions d'accès.
4. Le chargement de `ReaderPopup` est différé jusqu'à l'ouverture du lecteur.
5. Pour le mode `full_document`, aucune interrogation supplémentaire `/api/auth/me` n'est déclenchée ; progression non synchronisée sur le serveur.
6. `getCurrentUserProfile` saute `auth/me` en l'absence de cookie de session Laravel et ses appels sont dédupliqués par rendu SSR (`React.cache`).
7. `getFavoriteIds` saute la requête `favorites` pour les visiteurs anonymes.
8. Les listes appellent `GET /api/v1/books?view=card` pour obtenir la réponse compacte dédiée à la vitrine. `getBookById` réutilise les données d'un même livre pendant un rendu serveur.
9. Le composant couverture utilise `cover_thumbnail_url` lorsque l'API fournit une vraie miniature ; les créations réelles de miniatures sont à auditer séparément.

## Changements proposés dans la PR #34 (Laravel / cPanel)

- Route `GET /api/v1/books/{book}/read-free` avec contrôle publication + droits + prix gratuit ; fichiers privés diffusés en streaming sans rendu JPEG.
- API facultative `view=card` : uniquement les données nécessaires aux cartes de la librairie, sans modifier le format complet destiné aux autres clients / futur mobile.
- Les PDF privés ou payants conservent les permissions et aperçus page par page.
- Nettoyage `reader-cache:prune` avec parcours récursif progressif : ne charge pas tous les noms de JPEG en mémoire ; plafond de 500 suppressions/jour ; originaux intacts.
- TTL public du flux gratuit : 60 secondes navigateur, 300 secondes CDN. **Attention :** une révocation de droits peut rester visible pendant ce TTL ; il faut purger la copie CDN immédiatement en cas de dépublication d'un livre gratuit.

## Réglage impératif du cache Cloudflare (si api.aba.cd est proxifié)

Cloudflare ne met pas en cache par défaut un endpoint sans extension de fichier, même s'il sert un PDF. Une **Cache Rule strictement limitée aux livres gratuits** doit être activée sur la zone qui gère `api.aba.cd`.

Expression indicative :

```text
(http.host eq "api.aba.cd"
 and http.request.method eq "GET"
 and starts_with(http.request.uri.path, "/api/v1/books/")
 and ends_with(http.request.uri.path, "/read-free"))
```

Action : **Eligible for cache**, Edge TTL basé sur les headers d'origine (300 secondes maximum recommandé dans cette phase). Ne surtout pas créer de règle `Cache Everything` sur l'ensemble de `/api/`. Ne jamais mettre en cache `auth/me`, `orders`, `reader sessions`, `payments`, les PDF payants ou les tableaux de bord.

- Le record DNS `api.aba.cd` doit être **Proxied** et la zone DNS active. Sinon la règle de cache Cloudflare ne s'appliquera pas.
- Le frontend utilise `www.holistique-books.com` ; l'API autorise cette origine dans `backend/config/cors.php`. Vérifier le CORS depuis le navigateur.
- Vérifier la réponse du PDF gratuit : `Content-Type: application/pdf` ; premier `CF-Cache-Status: MISS`, puis `HIT` à la seconde demande. Les valeurs dépendent de l'éligibilité et des points de présence.
- Une API ayant de nombreux utilisateurs demandant **des livres différents** produira plus de défauts de cache qu'un seul livre populaire. Les premiers chargements et les purges continuent à utiliser PHP.
- Si 100–200 téléchargements simultanés saturent cPanel malgré le CDN, servir les **seuls livres gratuits sous licence adaptée** depuis un hébergement d'objets/CDN sans exécution PHP. Décision à prendre après métriques.

## Vérifications pour l'installation sans terminal

Le dépôt possède déjà un workflow GitHub `.github/workflows/production-package.yml` générant des archives Laravel privées/publiques lors d'un merge vers `production`. **Ne pas fusionner ni écraser de fichier de production avant de confirmer la méthode de déploiement existante et de sauvegarder les données.**

1. Sauvegarder le dossier backend, l'environnement `.env`, les fichiers privés et MySQL.
2. Mettre le backend Laravel à jour **en premier** (PR #34), tester un livre gratuit (HTTP 200, PDF complet) puis un payant (HTTP 403). Confirmer que le ZIP ou l'extraction n'écrase pas `storage/`, `.env` ni les données.
3. Activer la règle cache CDN **uniquement** sur `read-free`; tester le second accès `CF-Cache-Status: HIT`.
4. Mettre ensuite le frontend à jour (PR #33). Sur Cloudflare, sélectionner `HOLISTIC_DATA_SOURCE=laravel` et des URL d'API HTTPS correctes dans les **Build variables** et **Runtime variables** ; ne pas supprimer les données Supabase avant inventaire.
5. Tester une session de lecture sans compte, le changement de 20 pages et l'absence de nouvelles requêtes PDF dans DevTools → Network.
6. Vérifier lecture EPUB, payant, panier/paiements, admin, auteurs, catalogue et affichage des miniatures.
7. Mesurer Lighthouse/LCP, TTFB, tailles `_next/static`, PHP-FPM et DB, latence p95. Faire un test de charge progressif et **autorisé** sur un environnement adapté avant d'affirmer le support de 200 connexions.

## Limites et risques

- Un PDF/EPUB transmis intégralement est techniquement récupérable depuis le navigateur. Un titre gratuit n'est pas automatiquement libre de droits ; le propriétaire doit avoir autorisé cette diffusion.
- `Cache-Control: public` permet un cache partagé ; la révocation demande une purge ciblée et un TTL court.
- Le modèle web conserve des rendus SSR Next.js dynamiques ; les requêtes de navigation ne disparaissent pas complètement. Les liens et les métadonnées initiales utilisent encore Cloudflare Workers.
- Le site n'est pas encore déployé avec ces changements : les deux PR restent en brouillon.
