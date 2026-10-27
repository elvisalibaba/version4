# Holistique Books — lecteur léger et lecture gratuite

## Changement d'architecture (PDF et EPUB gratuits seulement)

- L'API Laravel `GET /api/v1/books/{book}/read-free` livre le document en streaming en **une seule réponse** pour un titre publié, droits valides, lecture autorisée et prix de lecture gratuite.
- Le frontend `/api/read/{id}` choisit `full_document` pour ces livres ; `/api/read/{id}/full` relaie les octets depuis Laravel.
- PDF.js reçoit les octets **une seule fois** et change de page localement, sans conversions JPEG sur le serveur.
- Le flux EPUB gratuit réutilise le lecteur EPUB client existant.
- Les livres payants restent sur le lecteur JPEG/page protégée et les contrôles d'accès existants.
- Le lecteur `ReaderPopup` est chargé à la demande, plutôt qu'avec chaque page détail.

**Limite de confidentialité :** tout document livré intégralement à un navigateur est récupérable par un utilisateur avancé, même si l'interface n'offre aucun bouton Télécharger. Ce mode est limité aux livres explicitement publiés et gratuits ; ne l'activez jamais pour un titre sous droits interdisant l'accès au fichier complet.

## Déploiement

1. Sauvegarder le backend, les bases et les variables de production.
2. Mettre à jour le code Laravel du dossier `backend/` (sur cPanel) et lancer les tests : `php artisan test --filter=FreeBookDocumentTest`.
3. Vérifier que les originaux PDF/EPUB résident sur le disque privé `books` ou `local` ; aucun déplacement ni duplication des originaux n'est nécessaire.
4. Tester `GET /api/v1/books/{id}/read-free` sur **un livre gratuit**, puis sur **un livre payant** (attendu 403), et un brouillon (403).
5. Seulement après validation du backend, déployer le frontend Next.js sur Cloudflare ; configurer `HOLISTIC_DATA_SOURCE=laravel` (ou retirer la valeur `supabase`), `API_URL` et `NEXT_PUBLIC_API_URL` avec la bonne URL de l'API.
6. Ouvrir un livre gratuit sans compte, parcourir les pages 1, 10, 20, puis recommencer une page : le lecteur PDF ne doit faire qu'une seule requête binaire au document.
7. Vérifier les droits des livres payants, les commandes EasyPay, les couvertures, les espaces auteur/admin.
8. La tâche `reader-cache:prune --days=7 --limit=500` nettoie progressivement les rendus JPEG périmés (pas les originaux). L'exécution automatique exige que `schedule:run` soit actif dans le cron cPanel.

## Limites

- Une seule requête **du fichier** côté lecteur (en plus des requêtes de métadonnées et d'authentification éventuelles), mais le temps du premier chargement dépend toujours de la taille du document et de la connexion.
- Pour de très gros PDF, le chargement complet peut utiliser beaucoup de mémoire sur un téléphone. Les PDF payants restent en mode protégé ; des seuils et options alternatives seront à ajouter après mesures sur mobile.
- Ne pas exécuter de migrations ou supprimer les anciens fichiers stockés avant sauvegarde.
