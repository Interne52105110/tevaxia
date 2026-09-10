# Correctif SQL locatif 064 — préparé, non appliqué en production

La publication du site n'exécute pas les migrations Supabase. L'accès SQL administrateur au projet de production n'était pas disponible le 10 septembre 2026. Le statut de cette migration reste **à appliquer après vérification du schéma et des politiques effectives**.

Le test local reproduit un défaut des migrations historiques 016/026 : un propriétaire peut associer son identifiant à un lot différent dans un jeton ; la fonction publique SECURITY DEFINER retourne alors le lot tiers. Cela établit le défaut des fichiers historiques, sans établir que les mêmes politiques sont actuellement actives en production.

La migration 064 ajoute des politiques restrictives liant paiement/jeton au propriétaire du lot. Elle vérifie également cette correspondance dans la fonction publique, filtre les paiements par propriétaire, fixe le search_path, retire le droit EXECUTE du rôle PUBLIC et conserve les rôles anon/authenticated nécessaires. Les jetons incohérents existants deviennent inutilisables, sans suppression de données. L'historique reste limité à 24 échéances.

## Validation locale reproductible

Le script `scripts/test-rental-portal-sql.cjs` crée exclusivement une base PostgreSQL PGlite en mémoire. Il ne lit aucune configuration Supabase et n'ouvre aucune connexion de production. Installer `@electric-sql/pglite@0.5.8` dans un répertoire de test séparé, puis renseigner `PGLITE_MODULE` avec le chemin absolu du paquet installé et exécuter le script avec Node.

Résultats : défaut historique reproduit, migration appliquée deux fois, écritures légitimes conservées, accès croisés bloqués même en présence de politiques permissives supplémentaires, jeton incohérent refusé, paiement de propriétaire incohérent exclu, accès direct anonyme refusé, tri/limite 24, jetons révoqués/expirés/inconnus refusés. Ces tests ne remplacent pas une vérification de concurrence sur l'instance cible ou une revue de ses autres fonctions privilégiées.

## Application administrative restante

Avant application, examiner les définitions effectives des trois tables et de la fonction, leurs propriétaires, droits et politiques, ainsi que les dépendances éventuelles. Mesurer les associations incohérentes sans exporter de données personnelles ; décider de leur traitement séparément, sans les réattribuer automatiquement. Appliquer `supabase/migrations/064_rental_portal_ownership.sql` dans une transaction administrative, puis contrôler avec deux comptes de test et un lien de test dédié. Ne pas annoncer ce correctif comme actif avant cette vérification.

Références : [politiques restrictives PostgreSQL](https://www.postgresql.org/docs/16/sql-createpolicy.html), [fonctions et search_path Supabase](https://supabase.com/docs/guides/database/functions), [PGlite en mémoire](https://pglite.dev/docs/).


## Complément 065 — colocataires

La migration 065_cotenant_lot_ownership.sql applique la même restriction au lien entre rental_cotenants et rental_lots. Elle dépend de 006/030 et reste également NON appliquée à la production. Le test local couvre désormais création/modification légitimes et refus de l'insertion ou réaffectation vers un lot tiers. Les prérequis de vérification administrative ci-dessus restent applicables.
