# Réintégration EasyPay -> Supabase (13 octobre 2026)

## Origine retrouvée
Source historique : `backup-main-2026-07-16/lib/payments/cinetpay.ts`, anciennes routes de paiement Supabase, restaurées sur `fix/supabase-easypay-gateway-20261013`.

## Variables Vercel reconnues (ne PAS recopier les secrets dans GitHub)
- `EASYPAY_PUBLISHABLE_KEY`, `EASYPAY_CORRELATION_ID`, `EASYPAY_MODE`, `EASYPAY_BASE_URL`
- `NEXT_PUBLIC_HOLISTIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Des variables CinetPay existent aussi, mais la passerelle historique présentée ici est **e-COM EasyPay** et ne consomme pas les identifiants CinetPay.
- Pour la prévisualisation sur cette branche : `EASYPAY_MODE=sandbox` exclusivement. Ne modifier aucune clé de production.

## Chemin des transactions
1. L'utilisateur connecté prépare une commande dans `/api/supabase/orders`. Prix/format/quantité/devise vérifiés côté serveur à partir de `book_formats`. Seules les éditions **imprimées** officiellement publiées et payantes sont acceptées : les livres numériques se lisent gratuitement sur HolisticBooks.
2. `/api/payments/easypay/init` initialise EasyPay avec un paiement attaché à une commande Supabase. Le paiement est calculé côté serveur, pas depuis les montants du panier local.
3. EasyPay retourne une référence. La notification `/api/payments/easypay/notify` ou la page de retour `/payment/return?orderId=...` vérifie **depuis le serveur** cette référence auprès du prestataire.
4. Seules les réponses de vérification confirmées `SUCCESS`, avec références concordantes (commande + transaction), et montant/devise concordants lorsqu'ils sont fournis par EasyPay, peuvent passer à `paid`. La page de retour seule ne valide jamais la transaction.
5. Les triggers Supabase gèrent les accès numériques éventuels, sans attribuer une édition numérique lors d'un achat de livre imprimé.

## Sécurité appliquée à la base
Migration `supabase/migrations/20261013_secure_payments_server_owned_orders.sql` exécutée. Accès INSERT, UPDATE et DELETE sur `orders`, `order_items`, `library` révoqués à `anon` et `authenticated`, sauf traitements serveur privilégiés. Les anciennes politiques client d'insertion ont été supprimées. Les 8 commandes historiques ont été conservées.

## Limites de la recette
- Vérification TypeScript, lint, tests applicatifs et prévisualisation Vercel : automatisés.
- Aucun paiement bancaire ou Mobile Money réel n'a été déclenché. Une transaction EasyPay **sandbox complète** (création, statut, notification, retour, absence de doublon) est encore nécessaire avant activation sur `main`.
- Il n'existe actuellement aucune édition papier marquée `is_published=true` parmi les formats du catalogue vérifié. La plateforme ne doit donc pas commencer à facturer de titre numérique simplement pour tester.
- La documentation du marchand devra confirmer la forme exacte de la réponse `checking-status`, notamment `transaction.order_ref` et `transaction.reference`. Le code rejette une confirmation sans références vérifiables.

## Procédure de recette
1. Publier une édition papier de test en USD dans la branche de préparation, sans modifier les vrais prix de production.
2. Déclencher `/api/payments/easypay/init` depuis la session d'un compte de test avec le mode sandbox.
3. Simuler/terminer un paiement approuvé dans le prestataire.
4. Valider que le webhook n'accorde rien si l'ordre, le statut ou la référence ne correspondent pas.
5. Vérifier le retour et l'absence de nouvelle transaction facturée après double clic/recharge.
6. Fusionner après validation explicite de la recette, puis basculer de sandbox à v1 avec contrôle du marchand.
