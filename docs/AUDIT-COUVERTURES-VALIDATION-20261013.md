# Correctifs HolisticBooks : couvertures et circuit éditorial
Date : 13 octobre 2026

## Constat confirmé sur Supabase ESS (lecture seule, avant correction)
- 29 livres au total : 26 publiés/approuvés, 1 soumis, 1 brouillon, 1 refusé.
- 29 chemins de couverture non vides, 29 fichiers correspondants effectivement présents dans `storage.objects`.
- 27 miniatures référencées, 27 fichiers miniatures correspondants.
- Le bucket `books` est privé, ce qui est approprié pour protéger les fichiers.
- La configuration `next.config.ts` ne reconnaissait pas le domaine d'images Supabase. L'administration ne rendait aucun composant d'image.
- Le bouton « À valider » pointait vers le catalogue sans filtre ni workflow.

## Correctifs
1. `next.config.ts` : autorisation ciblée des miniatures signées Supabase dans Next Image.
2. `lib/supabase/book-covers.ts` : URL signée temporaire avec la session de l'utilisateur et RLS. N'expose aucune clé de service ni le PDF.
3. `app/admin/books/page.tsx` : couvertures, recherche, pagination, états et onglet `?filter=submitted` ne montrant que les livres soumis.
4. `app/dashboard/admin/page.tsx` : la carte « À valider » ouvre directement l'onglet filtré.
5. `app/admin/books/[id]/page.tsx` : couverture, détails, actions et historique des décisions.
6. `supabase/migrations/20261013_admin_editorial_book_transitions.sql` : RPC transactionnelle `hb_admin_transition_book`, SECURITY INVOKER + contrôle admin + journal dans `book_editorial_events`.

## Matrice des décisions
- `submitted` : approuver, demander corrections (motif), refuser (motif)
- `approved` avec `copyright_status=clear` : publier seulement si couverture et fichier existent dans Storage ; ou « À paraître ».
- `published` ou `coming_soon` : dépublier (retour à brouillon, sans supprimer le livre).
- Tous les livres non archivés : archiver.
- Droits : confirmer avec justification, mettre en révision ou bloquer avec motif.
- Les fichiers de livres ne sont jamais servis par la fonction d'image et les règles RLS du bucket privé demeurent en place.
- L'utilisateur non administrateur ne peut pas exécuter la RPC. L'accès anonyme est révoqué.

## Vérifications
- Migration de la RPC appliquée à Supabase, `anon EXECUTE=false`, `authenticated EXECUTE=true`. Toute invocation par `authenticated` vérifie explicitement que le profil Supabase détient le rôle `admin`.
- Aucun statut de livre n'a été modifié lors de l'installation. L'historique est initialement vide.
- Supabase et PostgreSQL doivent confirmer les transitions réelles dans la session admin pendant la recette.
- `npm ci`, ESLint, Vitest, Next.js build vérifiés sur CI avant fusion.
- Les paiements et l'accès sécurisé aux livres complets restent hors périmètre de ce correctif.

## Recette manuelle recommandée
1. Ouvrir `/dashboard/admin/books?filter=submitted` avec un administrateur Supabase : un livre soumis attendu (au moment de l'audit).
2. Vérifier la couverture dans la liste et sur la fiche ; tester un livre publié et un brouillon.
3. Depuis une fiche de test, valider puis publier uniquement avec droits `clear`, ou demander une correction avec motif.
4. Confirmer que l'action écrit un événement historique et actualise le statut.
5. Depuis un compte lecteur ou auteur, tenter la même API : 403 attendu.
6. Vérifier les 26 couvertures publiées sur `/books`.
