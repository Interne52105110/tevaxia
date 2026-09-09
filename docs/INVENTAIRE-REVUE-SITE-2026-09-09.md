# Inventaire de revue Tevaxia — 9 septembre 2026

Cet inventaire décrit les routes sources hors copies linguistiques. Une route recensée ne signifie pas que son calcul ou son contenu est validé. Les lots validés sont détaillés dans les rapports datés.

## État actualisé après les lots du 9 septembre

Les contrôles détaillés et limites sont consignés dans AUDIT-METIER-2026-09-09.md. Les listes de dépendances ci-dessous sont l’inventaire initial, pas une certification.

- Lots repris et vérifiés : frais d’acquisition/fiches agence, capitalisation et DCF, comparables et réconciliation, préparation CPE/HVAC/LENOZ/ESG/CRREM/taxonomie, prévisions hôtelières/STR, données municipales/RNPP/HPI, marché commercial publié, scénarios de prix, budgets construction/VRD, commandes PDF communes, bilan promoteur, foncier agricole, comptes/valorisation/DSCR/pré-acquisition hôteliers, dossier documentaire E‑2, comparatif hôtelier, observatoire touristique Eurostat, transactions publiées, benchmark de période commune, budget MICE, parcours motel/aparthotel, plan CAPEX, préparation documentaire Green Key/due diligence et accès aux détails au clavier.
- Restent à revoir : fonctions et hypothèses restantes hors des lots validés, autres modèles hôteliers/STR, modules de gestion locative/copropriété/agence, parcours authentifiés, anciennes API Java et schémas des API encore non alignés.
- Restent également les pages éditoriales, les exports historiques, les anciens liens partagés et les fonctions non couvertes par les lots détaillés. Les cinq langues sont contrôlées pour chaque lot, pas encore exhaustivement pour toutes les routes.

## Routes et dépendances directes

| Route | Modules métier importés directement |
| --- | --- |
| `/` | Composants ou contenu à inspecter |
| `/achat-vs-location` | `calculations`, `storage` |
| `/actions-prioritaires` | `agency-mandates`, `agency-signatures`, `calculations`, `supabase` |
| `/aml-kyc` | Composants ou contenu à inspecter |
| `/aml-kyc/archives` | `errors`, `kyc-archives`, `supabase` |
| `/api-banques` | Composants ou contenu à inspecter |
| `/api-docs` | Composants ou contenu à inspecter |
| `/bail-commercial` | `calculations` |
| `/bilan-promoteur` | `calculations`, `storage` |
| `/calculateur-loyer` | `calculations`, `coefficients-reevaluation`, `storage` |
| `/calculateur-loyer/observatoire` | `calculations`, `loyer-observatoire` |
| `/calculateur-vrd` | `calculations` |
| `/carte` | `calculations`, `demographics`, `market-cycle`, `market-data`, `market-score` |
| `/cgu` | Composants ou contenu à inspecter |
| `/commune/[slug]` | `communes-coords`, `market-data` |
| `/comparer` | `adjustments`, `calculations`, `estimation`, `market-data`, `storage` |
| `/confidentialite` | Composants ou contenu à inspecter |
| `/connexion` | `supabase` |
| `/conseil-syndical` | `seo` |
| `/conseil-syndical/[token]` | `calculations`, `coownership-portal` |
| `/convertisseur-surfaces` | `calculations`, `pag-pap` |
| `/copropriete` | `seo` |
| `/copropriete/[token]` | `calculations`, `coownership-portal` |
| `/copropriete/[token]/ag/[assemblyId]` | `coownership-assemblies` |
| `/copropriete/[token]/assistant` | `supabase` |
| `/copropriete/[token]/mon-compte` | `calculations`, `coownership-portal` |
| `/dcf-multi` | `calculations`, `dcf-leases`, `errors`, `storage`, `valuation` |
| `/docs` | `persona-docs`, `profile-types` |
| `/docs/[persona]` | `persona-docs`, `profile-types` |
| `/energy` | Composants ou contenu à inspecter |
| `/energy/audit` | `energy-audit` |
| `/energy/communaute` | `energy-sharing-scenario` |
| `/energy/connexion` | Composants ou contenu à inspecter |
| `/energy/epbd` | Composants ou contenu à inspecter |
| `/energy/estimateur-cpe` | `measured-energy` |
| `/energy/hvac` | `calculations` |
| `/energy/impact` | `energy-impact-scenario` |
| `/energy/lenoz` | Composants ou contenu à inspecter |
| `/energy/mes-evaluations` | Composants ou contenu à inspecter |
| `/energy/portfolio` | `energy-portfolio`, `energy-portfolio-report` |
| `/energy/profil` | Composants ou contenu à inspecter |
| `/energy/renovation` | `calculations`, `renovation-scenario` |
| `/esg` | Composants ou contenu à inspecter |
| `/esg/crrem-pathways` | `crrem` |
| `/esg/taxonomy` | `taxonomy` |
| `/estimateur-construction` | `calculations` |
| `/estimation` | `adjustments`, `calculations`, `demographics`, `emphyteose`, `estimation`, `macro-data`, `market-data`, `renovation-costs`, `storage`, `url-state` |
| `/facturation` | `seo` |
| `/facturation/emission` | `analytics`, `facturation` |
| `/facturation/historique` | `facturation` |
| `/frais-acquisition` | `calculations`, `storage` |
| `/gestion-locative` | Composants ou contenu à inspecter |
| `/gestion-locative/ais` | Composants ou contenu à inspecter |
| `/gestion-locative/assurance-impayes` | `calculations` |
| `/gestion-locative/etat-des-lieux` | Composants ou contenu à inspecter |
| `/gestion-locative/fiscal` | `calculations`, `supabase` |
| `/gestion-locative/lot/[id]` | `calculations`, `gestion-locative` |
| `/gestion-locative/lot/[id]/colocataires` | `calculations`, `cotenants`, `errors`, `gestion-locative`, `supabase` |
| `/gestion-locative/lot/[id]/paiements` | `calculations`, `errors`, `gestion-locative`, `profile`, `rental-payments`, `tenant-portal` |
| `/gestion-locative/portefeuille` | `calculations`, `gestion-locative` |
| `/gestion-locative/reconciliation` | Composants ou contenu à inspecter |
| `/gestion-locative/reconciliation/psd2` | `errors`, `supabase` |
| `/gestion-locative/relances` | `calculations`, `supabase` |
| `/guide` | Composants ou contenu à inspecter |
| `/guide/achat-immobilier-non-resident` | `seo` |
| `/guide/bail-commercial-luxembourg` | `seo` |
| `/guide/bail-habitation-luxembourg` | `seo` |
| `/guide/bellegen-akt` | `seo` |
| `/guide/copropriete-luxembourg` | `seo` |
| `/guide/estimation-bien-immobilier` | `seo` |
| `/guide/frais-notaire-luxembourg` | `seo` |
| `/guide/ia-tevaxia` | `seo` |
| `/guide/investir-hotel-luxembourg` | `seo` |
| `/guide/klimabonus` | `seo` |
| `/guide/plus-value-immobiliere` | `seo` |
| `/guide/regle-5-pourcent-loyer` | `seo` |
| `/guide/tva-3-pourcent-logement` | `seo` |
| `/hedonique` | Composants ou contenu à inspecter |
| `/hotellerie` | Composants ou contenu à inspecter |
| `/hotellerie/alerts` | `supabase` |
| `/hotellerie/benchmark` | `calculations`, `hotels`, `orgs`, `supabase` |
| `/hotellerie/capex` | `calculations` |
| `/hotellerie/certifications-esg` | Composants ou contenu à inspecter |
| `/hotellerie/compset` | `hotellerie` |
| `/hotellerie/dscr` | `hotellerie` |
| `/hotellerie/due-diligence` | Composants ou contenu à inspecter |
| `/hotellerie/exploitation` | `hotellerie` |
| `/hotellerie/forecast` | `calculations`, `errors`, `hotel-forecast`, `hotels`, `orgs` |
| `/hotellerie/groupe` | `calculations`, `errors`, `hotels`, `orgs`, `supabase` |
| `/hotellerie/groupe/[id]` | `calculations`, `errors`, `hotels`, `orgs` |
| `/hotellerie/housekeeping` | `calculations` |
| `/hotellerie/impayes` | `calculations` |
| `/hotellerie/mice` | `calculations` |
| `/hotellerie/motel` | `calculations` |
| `/hotellerie/observatoire-lu` | `hotellerie` |
| `/hotellerie/pre-acquisition` | `hotellerie` |
| `/hotellerie/renovation` | `hotellerie` |
| `/hotellerie/revpar-comparison` | `hotellerie` |
| `/hotellerie/score-e2` | `hotellerie` |
| `/hotellerie/transactions` | `calculations`, `hotel-transactions` |
| `/hotellerie/valorisation` | `hotellerie` |
| `/indices` | `calculations`, `market-data`, `market-score`, `tevaxia-index` |
| `/inspection` | Composants ou contenu à inspecter |
| `/invitation/[token]` | `orgs`, `supabase` |
| `/locataire` | `seo` |
| `/locataire/[token]` | `calculations`, `tenant-portal` |
| `/locataire/[token]/assistant` | `supabase` |
| `/marche` | `calculations`, `market-data`, `market-data-commercial` |
| `/marche/forecast` | `market-data`, `price-forecast` |
| `/mentions-legales` | Composants ou contenu à inspecter |
| `/mes-evaluations` | `calculations`, `storage` |
| `/offline` | Composants ou contenu à inspecter |
| `/onboarding` | `agency-mandates`, `coownerships`, `errors`, `orgs`, `pms` |
| `/outils-bancaires` | Composants ou contenu à inspecter |
| `/pag-pap` | `calculations`, `communes-coords`, `geoportail`, `market-data`, `pag-pap` |
| `/partage/[token]` | `shared-links`, `supabase` |
| `/plan-du-site` | Composants ou contenu à inspecter |
| `/plus-values` | `calculations`, `storage` |
| `/pms` | `pms`, `supabase` |
| `/pms/[propertyId]` | `calculations`, `pms`, `supabase` |
| `/pms/[propertyId]/calendrier` | `pms` |
| `/pms/[propertyId]/chambres` | `calculations`, `pms` |
| `/pms/[propertyId]/channels` | `pms` |
| `/pms/[propertyId]/factures` | `calculations`, `pms` |
| `/pms/[propertyId]/frontdesk` | `calculations`, `pms` |
| `/pms/[propertyId]/groupes` | `calculations`, `pms` |
| `/pms/[propertyId]/guests` | `calculations`, `pms` |
| `/pms/[propertyId]/pos` | `calculations`, `pms` |
| `/pms/[propertyId]/rapports` | `calculations`, `pms`, `supabase` |
| `/pms/[propertyId]/rapports/forecast` | `calculations`, `pms` |
| `/pms/[propertyId]/rapports/heatmap` | `calculations`, `pms`, `supabase` |
| `/pms/[propertyId]/rapports/pickup` | `calculations`, `pms` |
| `/pms/[propertyId]/rapports/usali` | `calculations`, `pms` |
| `/pms/[propertyId]/reservations` | `calculations`, `pms` |
| `/pms/[propertyId]/reservations/[resId]` | `calculations`, `pms` |
| `/pms/[propertyId]/reservations/[resId]/folio` | `analytics`, `calculations`, `facturation`, `pms` |
| `/pms/[propertyId]/reservations/nouveau` | `calculations`, `pms` |
| `/pms/[propertyId]/setup` | `pms` |
| `/pms/[propertyId]/tarifs` | `calculations`, `pms` |
| `/pms/[propertyId]/tarifs/bulk` | `calculations`, `pms`, `supabase` |
| `/pms/proprietes/nouveau` | `pms` |
| `/portfolio` | `calculations`, `storage` |
| `/pricing` | Composants ou contenu à inspecter |
| `/pro-agences` | Composants ou contenu à inspecter |
| `/pro-agences/commissions` | `agency-mandates`, `calculations`, `errors` |
| `/pro-agences/crm` | `agency-mandates`, `calculations`, `crm`, `errors`, `supabase` |
| `/pro-agences/crm/contacts` | `calculations`, `crm`, `errors` |
| `/pro-agences/crm/contacts/[id]` | `calculations`, `crm`, `errors` |
| `/pro-agences/crm/contacts/[id]/matches` | `agency-matching`, `calculations`, `crm`, `errors`, `supabase` |
| `/pro-agences/crm/contacts/import` | `crm`, `errors` |
| `/pro-agences/crm/tasks` | `crm`, `errors` |
| `/pro-agences/crm/templates` | `crm` |
| `/pro-agences/fiche-bien` | `calculations` |
| `/pro-agences/mandats` | `agency-mandates`, `agency-xml`, `calculations`, `errors`, `supabase` |
| `/pro-agences/mandats/[id]` | `agency-diffusion`, `agency-mandates`, `agency-offers`, `agency-xml`, `calculations`, `crm`, `errors`, `supabase` |
| `/pro-agences/mandats/[id]/bon-de-visite` | `agency-mandates`, `calculations`, `crm`, `errors`, `profile` |
| `/pro-agences/mandats/[id]/matching` | `agency-mandates`, `agency-matching`, `calculations`, `crm`, `errors`, `supabase` |
| `/pro-agences/mandats/[id]/signatures` | `agency-mandates`, `agency-signatures`, `errors` |
| `/pro-agences/performance` | `agency-mandates`, `calculations`, `errors`, `supabase` |
| `/profil` | `data-export`, `errors`, `profile`, `profile-types`, `shared-links`, `supabase` |
| `/profil/api` | `api-keys`, `api-webhooks`, `errors`, `supabase` |
| `/profil/calendrier` | Composants ou contenu à inspecter |
| `/profil/confidentialite` | `activity-log`, `consents`, `errors`, `supabase` |
| `/profil/liens-partages` | `errors`, `shared-links`, `supabase` |
| `/profil/organisation` | `errors`, `orgs`, `supabase`, `vies` |
| `/profil/sauvegardes` | `backup` |
| `/propcalc` | Composants ou contenu à inspecter |
| `/propcalc/developers` | Composants ou contenu à inspecter |
| `/recherche` | `calculations`, `supabase` |
| `/signer/[token]` | `agency-signatures` |
| `/simulateur-aides` | `aides-logement`, `calculations`, `storage` |
| `/solutions` | `seo` |
| `/solutions/agence` | `seo` |
| `/solutions/banque` | `seo` |
| `/solutions/expert-evaluateur` | `seo` |
| `/solutions/hotel` | `seo` |
| `/solutions/investisseur` | `seo` |
| `/solutions/particulier` | `seo` |
| `/solutions/promoteur` | `seo` |
| `/solutions/syndic` | `seo` |
| `/status` | Composants ou contenu à inspecter |
| `/str` | Composants ou contenu à inspecter |
| `/str/arbitrage` | `calculations`, `str-calc` |
| `/str/compliance` | `calculations`, `str-calc` |
| `/str/compliance-eu` | Composants ou contenu à inspecter |
| `/str/forecast` | `errors`, `str-forecast` |
| `/str/observatoire` | `str-observatoire` |
| `/str/portefeuille` | `calculations`, `supabase` |
| `/str/pricing` | `calculations` |
| `/str/rentabilite` | `calculations`, `storage`, `str-calc` |
| `/syndic` | `calculations`, `market-data` |
| `/syndic/benchmark` | `coownerships`, `errors`, `orgs`, `supabase` |
| `/syndic/coproprietes` | `coownerships`, `errors`, `orgs`, `supabase` |
| `/syndic/coproprietes/[id]` | `coownership-portal`, `coownerships`, `errors` |
| `/syndic/coproprietes/[id]/annexes` | `calculations`, `coownership-accounting`, `coownership-annexes`, `coownerships`, `errors`, `profile` |
| `/syndic/coproprietes/[id]/appels` | `analytics`, `calculations`, `coownership-allocations`, `coownership-finance`, `coownerships`, `errors`, `facturation`, `profile` |
| `/syndic/coproprietes/[id]/archives` | `coownership-archives`, `errors`, `supabase` |
| `/syndic/coproprietes/[id]/assemblees` | `coownership-assemblies`, `coownerships`, `errors`, `profile`, `useAI` |
| `/syndic/coproprietes/[id]/assemblees/[assemblyId]` | `coownership-assemblies`, `coownerships`, `errors`, `profile` |
| `/syndic/coproprietes/[id]/assemblees/[assemblyId]/visio` | Composants ou contenu à inspecter |
| `/syndic/coproprietes/[id]/budget` | `calculations`, `coownership-accounting`, `coownership-allocations`, `coownership-budgets`, `coownerships`, `errors` |
| `/syndic/coproprietes/[id]/cles-repartition` | `coownership-allocations`, `coownerships`, `errors` |
| `/syndic/coproprietes/[id]/comptabilite` | `calculations`, `coownership-accounting`, `coownerships`, `errors` |
| `/syndic/coproprietes/[id]/fonds-travaux` | `calculations`, `coownerships` |
| `/syndic/coproprietes/[id]/messagerie` | `coownerships`, `supabase` |
| `/syndic/coproprietes/[id]/ocr-factures` | `analytics`, `calculations`, `syndic-ocr-parser` |
| `/syndic/coproprietes/[id]/rapprochement` | `analytics`, `calculations`, `coownership-finance`, `coownerships`, `errors`, `supabase`, `syndic-bank-import` |
| `/syndic/coproprietes/[id]/relances` | `calculations`, `coownership-reminders`, `coownerships`, `errors`, `profile` |
| `/syndic/coproprietes/[id]/sepa-virements` | `calculations`, `coownerships`, `errors`, `sepa-pain001` |
| `/syndic/coproprietes/[id]/travaux` | `calculations`, `coownerships`, `works-projects` |
| `/syndic/lettres-types` | `analytics`, `coownership-letter-custom`, `coownership-letter-export`, `coownership-letter-templates` |
| `/syndic/portefeuille` | `calculations`, `errors`, `supabase` |
| `/syndic/procuration` | Composants ou contenu à inspecter |
| `/tableau-bord` | `activity-log`, `agency-mandates`, `calculations`, `shared-links`, `storage`, `supabase` |
| `/terres-agricoles` | `agricultural`, `calculations` |
| `/transparence` | Composants ou contenu à inspecter |
| `/valorisation` | `asset-types`, `calculations`, `demographics`, `esg`, `evs-checklist`, `macro-data`, `market-data`, `narrative`, `profile`, `renovation-costs`, `storage`, `valuation` |
| `/vefa` | `calculations` |
| `/verify` | `errors`, `supabase`, `valuation-signatures` |
| `/wizard-particulier` | `calculations`, `estimation`, `market-data` |

Périodes des hôtels enregistrés et rapport propriétaire corrigés : résultats déclarés/sources, zéro distinct d’inconnu, authentification et réponses tardives, PDF cinq langues. Le tableau de groupe et les autres parcours connectés restent à vérifier.

Tableau de groupe hôtelier corrigé : totaux incomplets inconnus, prix d’acquisition distincts des CAPEX, fiches accessibles, états asynchrones et créations validées. Impayés, housekeeping et alertes restent à revoir.

Impayés hôteliers corrigés : intérêts documentés ACT/365, segments sourcés, pas de probabilités de recouvrement ni frais/taux automatiques. Housekeeping et alertes restent à revoir.

Housekeeping corrigé : tâches/temps/coûts employeur réels saisis, vacations entières, pas de semaine inventée ou de supervision imposée. Alertes à revoir : promesses de cron/email non étayées dans ce dépôt.

Alertes hôtelières corrigées comme configuration de règles : surveillance/notification non confirmées, écritures explicites contrôlées. À poursuivre : cohérence marketing/accueil/tarifs avec les capacités réelles et parcours PMS, location/syndic/agences.

Offre hôtelière publique et guide d’investissement repris : données/TVA/E-2/aides documentées, SEO traduit, 25 pages testées. Restent les contenus du hub hôtel, les offres PMS détaillées et les rapports/folios PMS.

PMS rapport mensuel corrigé en journal des écritures + inventaire observé, PDF cinq langues et lectures complètes/isolées. Restent les folios (taux et prix par défaut, auto-posting, facturation), les fonctions SQL associées et les autres parcours PMS.


## PMS — saisie documentée des prestations et fiabilité des folios

- Prix HT et TVA désormais saisis explicitement avec référence obligatoire, quantité visible, aperçu HT/TVA/TTC ; retrait des prix inventés et des taux imposés par catégorie. Un taux nul doit être justifié. Source : loi TVA 2026, annexe B (restauration distincte des boissons alcooliques).
- Arrondis exacts en centimes : HT arrondi avant calcul de TVA, limites et précision conformes aux colonnes SQL. Exemple : 1,15 × 8,01 = 9,21 HT ; 17 % = 1,57 ; TTC 10,78. Ventilations additionnées en centimes, salle de réunion classée hors F&B.
- Identité et propriété du folio ouvert contrôlées avant écriture ; verrou de formulaire et UUID stable pour reprise idempotente après erreur réseau. Une erreur conserve les saisies. Référence visible dans les lignes enregistrées.
- Consulter un folio ou le POS ne crée plus de folio ni de prestations automatiquement. L’ouverture explicite ne réouvre pas un folio soldé. Lecture des lignes paginée, erreurs/troncatures refusées ; changement de compte ou réservation isolé.
- Vérification : 1 295 tests / 121 fichiers (12 nouveaux tests, retrait de 3 tests qui consacraient les anciens taux incorrects), lint et build réussis. Dix parcours de composants réels avec services simulés, cinq langues, quatre largeurs ; références visibles, double clic, reprise réseau, changement d’identité et absence d’écriture à la consultation contrôlés. Débordement mobile du tableau des catégories corrigé. Aucune écriture de client réel pour la QA.
- Limites restant à traiter : règlement/auto-posting SQL, génération des factures, exhaustivité du sélecteur de réservations POS. Ces contrôles clients ne certifient pas les RPC/RLS de production. Accès CLI Supabase indisponible (authentification absente), aucune migration SQL appliquée.

Journal mensuel (db5191b) confirmé en production : CI 34394676709 réussie, Vercel dpl_9cdMsEtNPhTstKTNup4qE2dVdZy2 Ready, cinq parcours publics revérifiés.


## PMS — relevé PDF distinct d’une facture émise

- L’ancien bouton Factur-X du folio créait un numéro HOT dérivé de la réservation, une date du jour et une échéance de sortie, sans rattachement à une facture émise. Il inférait le régime Z à partir du seul taux nul et ajoutait une mention de TVA restauration incorrecte. Ce builder sans autre consommateur est retiré.
- Le téléchargement fournit désormais un relevé de prestations clairement identifié : aucun numéro de facture, échéance, XML ou revendication PDF/A/Factur-X. La fonction de consultation des factures émises reste distincte et doit encore être auditée. Sources consultées : PFI mentions obligatoires des factures et FNFE-MPE documentation Factur-X.
- Copie des montants enregistrés, somme exacte en centimes et rapprochement avec les totaux du folio. Doublons, lignes d’un autre folio, dates invalides, devise différente, données incohérentes et total partiel refusés. Aucun recalcul des taux historiques ; taxe et solde enregistré explicités sans preuve de paiement ni qualification automatique d’un taux nul.
- Document traduit dans les cinq langues avec toutes les lignes actives et leurs références, pagination automatique sans troncature ; cinq PDF de trois pages rendus et inspectés, sept références longues conservées dans chacun. Verrou anti-double-clic, erreur récupérable et abandon du téléchargement après changement de compte.
- Vérification : 1 300 tests / 122 fichiers, cinq tests de rapprochement nouveaux, lint ciblé réussi ; cinq parcours du composant réel avec services simulés et exports vérifiés. Revue complète du circuit d’émission et des RPC SQL encore nécessaire ; aucune migration appliquée et aucune donnée client modifiée pour la QA.

Saisie des prestations (af8a4b9) confirmée en production : CI 34397940733 success, Vercel dpl_CpVJdEXjGdcGBergPbJCwoegk3hN Ready ; dix parcours publics cinq langues/quatre largeurs revérifiés.


## Hub hôtellerie — explications et métadonnées

- Descriptions et six FAQ, y compris données structurées, alignées sur les outils actuels dans les cinq langues : capitalisation documentée sans taux/prix de chambre inventés ; GOP/EBITDA/réserve distingués ; retrait des taux F&B uniformes, taxes locales présumées, alertes envoyées, rétention RGPD automatisée et immutabilité fiscale non démontrées.
- iCal présenté avec ses limites de synchronisation ; préparation E-2, aides et qualification bancaire sans seuil automatique. Une empreinte SHA-256 n’est plus présentée comme signature ou expertise. Sources officielles TVA et E-2 accessibles.
- Métadonnées traduites réexportées dans les quatre routes locales ; lien groupe traduit ; contrôles des cinq pages, six FAQ structurées et quatre largeurs réussis, lint et build réussis.
- Vérification du code consommateur : les anciens textes solutions.hotel, fraisAcquisition.seo et energy.lenoz.seo ne sont plus rendus par leurs pages réécrites ; ils ne constituent pas des anomalies visibles de ces routes. Les autres guides et offres actives restent à vérifier.

Relevés PDF (8c9e0a2) confirmés en production : CI 34398958161 success, Vercel dpl_BpuYmFD5jDFWeELJqKG3n6xTFzuD Ready ; dix parcours publics cinq langues/quatre largeurs revérifiés.


## Guide frais de notaire — droits, émoluments et exemples séparés

- Guide actif entièrement repris dans les cinq langues : correction du double comptage 7 % + 1 % dans les métadonnées, retrait de l’ancien faux barème 2015 et des enveloppes non sourcées (honoraires, hypothèque, débours). Tableau de neuf tranches du barème 7 tiré des constantes déjà vérifiées du calculateur, avec limites cumulées et taux HT ; minimum, TVA et exclusions expliqués.
- Exemples limités explicitement aux droits ordinaires, deux acquéreurs éligibles à 50/50 avec soldes personnels complets. Minimum de 100 EUR conservé : 750 000 × 7 % = 52 500 ; crédit utilisé 52 400 ; droits résiduels 100, sans prétendre que c’est le décompte total. Cinq prix de 300 000 à 1 500 000 EUR vérifiés.
- VEFA : terrain/travaux existants/travaux futurs à distinguer, aucune TVA réduite automatique ; avantage de 50 000 EUR et habitation du propriétaire. Prêt : obligation, inscription sur garantie et émoluments distincts, aucune économie forfaitaire de mandat hypothécaire.
- Fiscalité locative corrigée : acquisition et financement ne suivent pas le même traitement, terrain exclu de l’amortissement ; aucune extrapolation globale à l’habitation personnelle. Sources PFI, Chambre des Notaires, ministère du Logement et ACD consultées et reliées. Plafond 40 000 confirmé sur PFI/Guichet ; hausse annoncée à 45 000 non assimilée à une entrée en vigueur vérifiée.
- Métadonnées réexportées dans quatre routes locales, date du guide 9 septembre 2026. Build/lint réussis ; cinq langues, deux tableaux (neuf et cinq lignes), six FAQ structurées, sources et quatre largeurs vérifiés.

Hub hôtellerie (0abe245) confirmé en production : CI 34399433885 success, Vercel dpl_4vWFWvR8ZCw68EpCf6GwgZAsPxyU Ready ; cinq pages revérifiées en quatre largeurs.


## Guide Bëllegen Akt — solde personnel, délais et restitution

- Les cinq versions distinguent le délai d’entrée dans le logement (deux ans, quatre pour terrain/immeuble en construction) et la durée de deux ans d’occupation continue. Dérogations/prorogations relevant de l’AED, engagements de l’acquéreur et justificatifs explicites ; suppression de l’application automatique sans démarche ni condition.
- Solde propre à chaque acquéreur, quote-part et absence de transfert de crédit entre personnes ; traitement résident EEE / hors EEE expliqué, avec avance puis restitution dans ce dernier cas. Remboursement d’un avantage indu reconstitue le crédit à hauteur du principal restitué, pas des intérêts ; revente après occupation requise ne restaure pas le crédit consommé.
- Cinq exemples pour un ou deux acquéreurs, minimum de 100 EUR préservé : deux soldes complets à 750 000 EUR => crédit 52 400, droits 100, solde cumulé 27 600. Aucun cumul d’aides garanti. Sources PFI conditions/délais et Guichet vérifiées.
- Métadonnées réexportées quatre langues et date mise à jour. Correction complémentaire du sommaire du guide notarial : clé FAQ inexistante remplacée par la traduction commune ; contrôle explicite de l’absence de clés brutes dans la page.
- Validation : build/lint réussis, dix pages des deux guides en cinq langues/quatre largeurs, tableaux et données structurées contrôlés. Le guide notarial 1b8bea5 avait CI 34400411294 réussie ; la vérification finale en production inclura ce correctif du sommaire.


## Guide TVA logement — plafond exact et procédures distinctes

- Les cinq langues corrigent les tableaux incohérents : à 400 000 EUR HT, TVA normale 68 000, faveur plafonnée 50 000, TVA due 18 000, TTC 418 000 ; à 500 000 HT, TVA due 35 000 et TTC 535 000. Exemples sans terrain ni postes exclus, tout éligible et plafond intégral disponible explicitement supposés. Aucun total d’économies cumulées inventé.
- Brochure AED 2025 et ministère du Logement vérifiés : création réservée à l’habitation principale du propriétaire ; rénovation possible pour celle d’un tiers ; rénovation dans les cinq ans de l’acquisition ou logement d’au moins dix ans, suppression de l’ancien seuil de vingt ans. Retrait du plafond de 400 m², règle d’usage mixte expliquée ; frais professionnels/meubles non confondus avec travaux éligibles.
- Application directe avec fournisseur avant travaux distinguée du remboursement après travaux. Devis minimal 3 000 EUR HT, factures de remboursement 1 250 EUR HT et ensemble 3 000 EUR HT, intervalle et prescription documentés ; usage/occupation et régularisation mentionnés. Avantage antérieurement consommé à vérifier, aucun nouveau plafond présumé par changement de propriétaire.
- Guide, six FAQ structurées, cinq exemples, métadonnées et date actualisés. Build/lint et cinq pages/quatre largeurs réussis. Aucun moteur fiscal ou PDF modifié dans ce lot.

Guides Bëllegen Akt/notaire (90e8308) confirmés en production : CI 34401078513 success, Vercel dpl_G6YiD4erXhSzvLfMAP3FF9MVGrYL Ready ; dix pages revérifiées, y compris traduction du sommaire.

Contrôle d’accès Supabase complémentaire : la session navigateur authentifiée ne donne pas accès au projet de la configuration Tevaxia et redirige vers une autre organisation. Aucun compte, permission, secret ou donnée modifié. L’absence d’accès empêche toujours de certifier/appliquer les changements SQL en production ; la revue des autres surfaces continue.


## Factures PMS — lecture complète et totaux par devise

- Suppression du plafond silencieux de 500 factures, y compris dans le fournisseur de sauvegarde qui réutilise cette lecture. Pagination par 500, nombre exact, ordre stable date/identifiant ; refus des résultats tronqués, doublons, changement du nombre de lignes ou périmètre incorrect. Plafond de sécurité de 200 000 provoquant une erreur explicite, jamais un total partiel.
- Identité contrôlée avant/après lecture et propriété filtrée par propriétaire. Cela complète les contrôles applicatifs sans certifier les RLS ni les RPC en production.
- Écran réinitialisé par utilisateur/établissement ; réponses tardives ignorées, déconnexion affichée immédiatement avec lien localisé ; erreur et bouton Réessayer distincts de la liste vide. Tableau contenu horizontalement sur mobile.
- Totaux en centimes signés, séparés par devise ; contrôle HT + TVA + taxe de séjour = TTC ; montants absents/incohérents refusés. Les libellés décrivent les factures émises et celles marquées manuellement payées, sans les assimiler à un rapprochement des encaissements. Retrait de l’affirmation globale de conformité/immutabilité non vérifiée sur cet écran.
- Huit tests supplémentaires : plus de 1 000 lignes, erreurs/vide, troncature, doublons/périmètre/changements, identité, devises/avoirs et montants invalides. Suite : 1 308 tests / 123 fichiers réussis. Émission, marquage payé, PDF et SQL restent à revoir séparément.

TVA logement (81ae7a2) confirmée en production : CI 34401827599 success ; Vercel dpl_Eq5QY8nP4S1VwHePzA7xemHMo865 Ready et domaine tevaxia.lu associé ; cinq pages/quatre largeurs réussies. Le projet Supabase public présent dans les scripts de production est bien dpynqvilgniohgtichbz, identique à la configuration locale et inaccessible avec la session disponible.


### Correction du périmètre des contrôles de routes PMS

Le contrôle renforcé des factures a révélé l’absence des alias des pages internes PMS en EN/DE/PT/LB (HTTP 404). Certains anciens tests anonymes reconnaissaient le lien de connexion de l’en-tête général sur la page 404 : leurs résultats ne prouvaient donc pas l’accessibilité des routes traduites. Les validations hors ligne des composants et des calculs restent distinctes et valides. Ajout de 92 alias pages/layouts vers les composants canoniques, avec reprise du noindex et du layout de propriété. Le test factures exige maintenant HTTP 200 et le titre exact du contenu ; un inventaire HTTP distinct contrôle les 21 pages dynamiques dans les cinq langues. Cette correction ne vaut pas certification des opérations connectées ni des autres pages du site.

Validation finale locale du lot factures/routes : build et lint réussis ; cinq écrans factures avec titre/statut HTTP vérifiés, quatre largeurs, erreur/retry/déconnexion/changement de compte testés sur composants réels avec services simulés ; 105 URL PMS vérifiées HTTP 200 sans contenu 404. Aucun test d’écriture en production.


## Relevé PDF des documents PMS — types, montants signés et périmètre explicite

- L’ancien export affichait systématiquement FACTURE, masquait les catégories négatives et annonçait une conformité fiscale non démontrée. Il utilisait les coordonnées actuelles de la propriété, sans original archivé ni détail des prestations par taux. Le bouton produit désormais un relevé des données enregistrées, distinct d’une émission, quittance ou validation fiscale.
- Le type standard/acompte/avoir/pro forma et le statut brouillon/émis/payé manuel sont reproduits. Contrôle de propriété, référence, client, dates calendaires, montants par catégorie et totaux au centime avant génération ; refus des incohérences. Les sommes signées sont conservées, aucune TVA ni qualification de taxe de séjour n’est reconstruite à partir de taux agrégés.
- Coordonnées actuelles clairement identifiées ; notes et mentions intégrales dans le flux paginé. Aucun faux numéro, taux, date d’émission ou classement fiscal ajouté. Les coordonnées et le contenu ne sont pas certifiés comme photographie historique à l’émission.
- Chargement PDF à la demande, verrou contre le double clic, erreur localisée, nouvelle tentative possible, export abandonné après changement de compte/rechargement ; URL de téléchargement libérée.
- Cinq PDF de deux pages (dix pages rendues/inspectées) : avoir de -147,32 EUR, trois catégories signées, notes et mentions longues préservées. Cinq tests métier supplémentaires ; suite 1 313 tests / 124 fichiers réussie. Tests de génération réelle du PDF avec services simulés : cinq langues, erreur, retry, double clic, déconnexion.
- Source de la limite de conformité : [AED — contenu obligatoire des factures](https://pfi.public.lu/fr/professionnel/tva/en-cours-activite-economique/que-doivent-contenir-factures.html), notamment date, identification, nature/quantité des prestations et ventilation par taux. L’émission SQL, l’immutabilité et les originaux archivés restent hors certification tant que la base n’est pas accessible.

Factures/routes bd1998f confirmées en production : CI 34404141074 success ; Vercel dpl_GBDVUT66pPAwH26JHUaPQs2dQAFZ Ready ; cinq pages factures avec titre/statut HTTP corrects et quatre largeurs ; 105 routes PMS HTTP 200 sans page 404. Ces contrôles remplacent les anciennes conclusions insuffisantes d’accessibilité multilingue du PMS.


## Routes internes multilingues et navigation

- Ajout des alias de 28 pages dynamiques agence/syndic/locataire/portails et de leurs layouts manquants : 148 fichiers. Les contrôles d’accès des composants canoniques et leurs métadonnées noindex sont repris ; aucune autorisation de données ajoutée. Inventaire HTTP avec identifiants fictifs : 140 adresses ont répondu sans page 404. Cela vérifie les routes, pas les opérations métier connectées.
- Les 19 destinations du menu PMS et les 15 du menu syndic, titres de sections et liens secondaires sont localisés en cinq langues. Descriptions non vérifiées retirées (TVA 3/17 universelle, annexes obligatoires, automatismes). Une seule rubrique active, basée sur la destination la plus précise, avec aria-current.
- Bouton de fermeture mobile placé au-dessus du panneau après découverte d’un recouvrement réel ; espace réservé en bas du menu, fermeture par Échap et état aria-expanded. Le layout syndic masque le menu après déconnexion, ignore les réponses anciennes et ne conserve pas le nom d’une précédente identité/copropriété ; suppression du main imbriqué.
- Dernière page canonique sans alias : /offline. Quatre alias ajoutés, titre/métadonnées et retour accueil localisés ; retrait de la promesse non garantie d’accès aux données récentes. Tous les chemins canoniques ont désormais des fichiers de route dans les cinq langues ; cela ne certifie pas la traduction exhaustive du contenu de chaque écran.
- Revue du service worker : le cache v3 stocke encore les réponses de navigation sans distinguer les pages privées et son fallback hors ligne est français. Correctif séparé à préparer ; aucun changement du service worker dans ce lot.

Relevé PDF fae95a2 confirmé en production : CI 34405527410 success ; Vercel dpl_BTfm29LzCDJwhZaKnNpu9qVmeVyN Ready ; cinq pages factures vérifiées avec titre/statut HTTP et quatre largeurs. Dix pages PDF fictives inspectées ; pas de modification de facture réelle ni de validation SQL.

Validation finale navigation : build/lint réussis ; dix menus testés (PMS/syndic × cinq langues), libellés/destinations, rubrique active unique, 320/390/768 px ouverture/fermeture et Échap, retour bureau, changement de compte/déconnexion syndic. Cinq pages /offline vérifiées HTTP, titre, métadonnées noindex et quatre largeurs. Les 140 URL dynamiques et 5 URL hors ligne sont accessibles ; aucune donnée réelle modifiée.


## Cache PWA — ne plus conserver les pages privées

- Le service worker v4 ne met plus en cache les navigations, même réussies, et ne rejoue jamais une ancienne page consultée. Il précache seulement les cinq écrans /offline et deux fichiers publics avec credentials omit ; cache des fichiers de build sous /_next/static et des fichiers publics explicitement désignés.
- Comparaison exacte de l’origine ; requêtes API, RSC, avec Authorization, méthodes non GET et fichiers hors périmètre non interceptés. Réponses private/no-store non stockées. Fallback hors ligne selon la langue de l’URL, depuis le cache courant uniquement, puis réponse 503 simple si le stockage est absent.
- Activation : suppression des anciennes versions tevaxia-vN, sans toucher aux autres caches. Le nouveau worker prend aussi le relais si le nettoyage du stockage échoue ; il ne consulte pas ces anciennes versions. Enregistrement updateViaCache none et en-tête HTTP no-cache/no-store sur /sw.js.
- Neuf tests supplémentaires, suite 1 322 tests / 125 fichiers réussie ; build, lint des fichiers TypeScript et vérification syntaxique du worker réussis (public/sw.js est exclu par la configuration ESLint du dépôt). Navigateur isolé : cache v3 fictif supprimé, cache étranger préservé, vraie coupure réseau dans cinq langues, aucune page privée ajoutée au cache v4 ; inspection visuelle du fallback.
- Aucun compte, aucune facture, aucun document métier en production modifié par ces essais. Le cache HTTP général du navigateur et les sauvegardes applicatives constituent d’autres mécanismes ; ce lot porte sur le service worker.

Navigation 400d356 confirmée en production : CI 34407231200 success ; Vercel dpl_Hc6tve1KeXoR7jQjrqb9VqGqp5Rs Ready ; 140 URL internes et cinq pages hors ligne avec métadonnées/noindex et quatre largeurs revérifiées. Menus connectés contrôlés séparément sur composants réels avec services simulés.


## Documents de facturation — statuts explicites et écritures contrôlées

- Écran renommé Documents de facturation ; type affiché et montants séparés par type ET devise. Factures standards, acomptes, avoirs et pro forma ne sont plus regroupés dans un seul montant qui pourrait être pris pour du chiffre d’affaires. Les montants restent ceux des documents, avec leurs signes, sans compensation/requalification implicite.
- « Marquer émis » remplace « Émettre » ; la confirmation décrit uniquement l’enregistrement d’un statut pour un original émis/contrôlé par l’utilisateur. Retrait de la promesse d’immutabilité. Le marquage payé reste déclaratif et n’est pas présenté comme un rapprochement des encaissements.
- Avant écriture : identité, propriété détenue par l’utilisateur, identifiant, référence, version updated_at et montants contrôlés. UPDATE conditionnel sur propriété/référence/version/statut antérieur ; le marquage payé exige un document déjà émis. Une nouvelle tentative ne réécrit pas un horodatage déjà enregistré. Zéro ligne modifiée provoque une vérification explicite du statut, et non un faux succès.
- Verrou UI partagé pour les actions de statut ; génération PDF et modification du statut ne se chevauchent plus. Erreur localisée prudente (« non confirmée »), relecture disponible, réponses anciennes ignorées après changement de compte. Aucun test d’écriture sur données réelles.
- Neuf tests métier supplémentaires et cinq essais de composants réels avec services simulés : annulation, double clic, échec/reprise, paramètres d’identité/version, changement de compte pendant une requête. Suite 1 331 tests / 126 fichiers réussie. Ces garde-fous applicatifs ne remplacent pas la vérification des politiques SQL/RPC, toujours inaccessible en production.

PWA 9168e0e confirmée en production : CI 34407993584 success ; Vercel dpl_AUYFPJfPghiRcQ9vaqQQRYoAQuxh Ready. Vrai navigateur isolé sur tevaxia.lu : cinq coupures réseau, fallback localisé, suppression du cache v3 fictif, cache étranger conservé, aucun cache de navigation privée, en-tête HTTP no-store du worker vérifié.


## 10 septembre — pied de page commun

Traduction des derniers libellés fixes (accroche, conditions, solutions, plan, contact) dans les cinq langues ; conservation des liens internes localisés. Textes secondaires portés à 14 px avant zoom global et opacité 75 % pour améliorer la lecture. Lien énergie remplacé par Klima-Agence (https://www.klima-agence.lu/fr, consulté le 10 septembre). Build et lint réussis ; navigateur : cinq langues, quatre largeurs 320/390/768/1440, libellés/liens/styles contrôlés, capture allemande inspectée. Aucun calcul modifié.

Le lot précédent ff435db est publié : CI 34409790040 réussie, déploiement dpl_Hh2nfATUGV8Ka3X3h2rpUSiAf4Gy Ready ; cinq pages factures vérifiées en production avec HTTP 200, titre exact, lien de connexion et quatre largeurs.


## 10 septembre — authentification de l’API de facturation

La route /api/v1/facturation/generate acceptait toute valeur non vide de clé. Elle utilise maintenant authenticateApiRequestAsync : contrôle des clés configurées ou actives en base et limite commune de requêtes. Clés free/sandbox refusées pour cet export annoncé Pro ; clés Pro/Enterprise admises. OPTIONS/CORS, réponses no-store, formats explicites et erreurs structurelles 400/422 ; détails des erreurs internes non exposés. Dix tests avec le véritable vérificateur de clés et un export simulé, dont refus avant lecture du corps, Bearer Enterprise et limite 60/min Pro. Suite 1 341 tests / 127 fichiers, lint et build réussis. Contrôle HTTP local réel : sans clé 401, clé fictive 401, sandbox 403, OPTIONS 204. Aucun export réel ni donnée client écrit en production pour ce test.

Périmètre limité à l’accès HTTP : le modèle fiscal, le schéma complet, les calculs XML et la conformité PDF/A/Factur-X ne sont pas validés par ce lot. Anomalies déjà repérées dans le générateur : allégations de conformité non démontrées, pagination absente et textes tronqués ; elles nécessitent une reprise séparée des documents et de leurs interfaces.

Le pied de page 9520bb3 est publié : CI 34410196241 réussie, dpl_9wn53Bt7MS52th1LFRjKwBvsZ9x4 Ready, cinq versions contrôlées en production.


## 10 septembre — validation commune des données de facturation

Validation robuste sur une entrée inconnue, sans coercition de chaînes en nombres ni plantage sur les objets incomplets : dates réelles, identités structurées, champs textuels/XML, montants finis, catégories/types/profils connus, bornes de remise et cohérence catégorie/taux. Le générateur XML partagé refuse les entrées invalides avant export, y compris les appels directs. Ce contrôle d’intégrité ne certifie ni le traitement fiscal ni le profil XML annoncé. Neuf nouveaux tests ; suite 1 350 tests / 128 fichiers, lint et build réussis. Cinq corps invalides testés sur le véritable serveur local avec une clé de test éphémère : tous 422, aucun document généré. Aucun changement de données de production.

Le contrôle des arrondis a reproduit une anomalie restante : quantité 1 × prix HT 1,005 devient 1,00 dans le moteur actuel. Les arrondis, remises XML et restitution PDF feront l’objet du lot suivant ; ils ne sont pas déclarés corrigés ici.

API d4fa6ba publiée : CI 34410562093 réussie, dpl_HVnGdw6hJiwvpyzDQYmRZXrxPsB8 Ready ; contrôle production sans clé/clé fictive/sandbox = 401/401/403, OPTIONS 204.


## 10 septembre — arrondis et cohérence écran/PDF/XML

Moteur décimal exact (BigInt) pour prix × quantité × remise, arrondi de chaque ligne au centime, somme des lignes arrondies et TVA arrondie par catégorie/taux. Cas 1,005 → 1,01 corrigé ; résidus binaires éliminés. XML : prix unitaire net après remise et quantités/taux sans réduction silencieuse à quatre/deux décimales. PDF : mêmes montants de lignes, prix et quantités saisis conservés. Plafond opérationnel de conversion : 9 999 999 999,99 ; dépassement affiché indisponible et export bloqué dans le formulaire.

Écran : affichage monétaire selon les cinq langues, remise visible/modifiable, taux enregistré hors liste conservé au lieu d’afficher une autre option ; champs numériques vides invalides, non transformés en zéro. Grille plus lisible, entête mobile sans débordement et libellés accessibles explicites.

Dix tests nouveaux ; suite 1 360 tests / 129 fichiers, ciblés 52, lint et compilation réussis. Navigateur réel cinq langues × quatre largeurs : taux 20 conservé, remise 10 → 20 → 10 modifiant le TTC, montant effacé bloquant l’export, dépassement géré. PDF technique d’une page rendu et inspecté : lignes 1,01 / 0,60 / 0,02, HT 1,63, TVA 0,33, TTC 1,96. XML embarqué identique au standalone, totaux réconciliés. Exemple arithmétique fictif, pas une validation de l’application territoriale du taux. Aucun téléchargement ni sauvegarde de facture client exécuté pour la QA navigateur.

Références des équations consultées : https://docs.peppol.eu/poacc/billing/3.0/rules/ubl-tc434/BR-CO-10/ et https://docs.peppol.eu/poacc/billing/3.0/rules/ubl-tc434/BR-CO-17/. Ce lot ne certifie pas le format Factur-X/Peppol ; revendications PDF/A, pagination/textes longs, modèles métier et historique restent à reprendre. Validation 61b45b0 publiée : CI 34411171766 réussie, dpl_Ha6EMwu83rsLKEdBjmP8vsGTK34B Ready.


## 10 septembre — PDF/A, pagination et présentation de la facturation

Le PDF partagé embarque désormais des polices Source Sans Pro (licence OFL jointe), un profil sRGB, des identifiants et des métadonnées XMP UTF-8 avec déclaration du schéma Factur-X. Les noms accentués et les documents longs sont conservés ; pagination sans troncature, titres selon le type 380/381/384/386 et cinq langues. Chargement du générateur à la demande dans les trois écrans concernés. XML : ordre des adresses et des échéances corrigé, description conservée dans le nom du produit pour BASIC, référence de paiement et conditions sans échéance conservées.

Contrôle externe Mustang CLI 2.26.0 (veraPDF et schémas/Schematron inclus) : cinq cas BASIC fictifs, TVA standard, identités complètes, huit lignes avec arrondis/remise et longues descriptions/notes, trois pages chacun. Les cinq fichiers effectivement téléchargés dans le navigateur passent les contrôles PDF/A et XML ; XML embarqué identique au fichier séparé et textes identiques au rendu Node. Quinze pages rendues et inspectées. Ces résultats portent sur ce corpus, pas sur tous les profils, régimes TVA ou exigences des destinataires. Les contrôles d’entrée restent des contrôles d’intégrité ; modèles métier, mentions fiscales et autres profils restent à revoir.

La page d’accueil facturation et les textes actifs de préparation/historique distinguent préparation, émission, transmission et conservation d’un original. Suppression des promesses générales non établies de conformité, d’indexation automatique et d’archivage ; liens officiels DGFiP, Guichet.lu et FNFE-MPE. Métadonnées localisées et vérification des trois liens internes. Cinq langues × quatre largeurs sans débordement, scénarios interactifs d’arrondis toujours réussis. Les téléchargements QA utilisent des données fictives, exclusivement en local avec trafic Supabase bloqué.

Validation : suite 1 364 tests / 130 fichiers réussie, quatre tests PDF ciblés repassés après correction du typage, lint sans erreur et build 1 347 pages réussi. Aucune vulnérabilité de dépendance de production signalée par npm audit au contrôle de ce lot.

Références : https://fnfe-mpe.org/factur-x/implementer-factur-x/ ; https://github.com/ZUGFeRD/mustangproject/releases/tag/core-2.26.0 ; https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees ; https://guichet.public.lu/fr/entreprises/gestion-juridique-comptabilite/marche-public-concession/facturation/emission-facture-electronique-marche-public-contrat-concession.html.

Arrondis 062bfdb publiés : CI 34412816970 réussie ; dpl_22pXmA9ACUE455odp9PJPPPTBX7s Ready, cinq langues contrôlées sur la production.


## 10 septembre — historique de facturation et sauvegarde complète

Lecture par pages avec curseur d’identifiant, filtre explicite user_id et contrôle du compte avant/après les requêtes. Les limites 200/500 deviennent des tailles de pages ; aucun résultat partiel n’est présenté comme complet en cas d’erreur. La sauvegarde ZIP utilise l’utilisateur de son contexte. Une limite opérationnelle de 100 000 entrées entraîne une erreur explicite, pas une troncature. La lecture n’est pas un snapshot transactionnel si les données changent simultanément.

Enregistrement lié au compte capturé avant la génération ; un document commencé anonymement n’est pas enregistré dans un compte connecté plus tard. Échec de sauvegarde signalé. Suppression filtrée par propriétaire et identifiant, avec vérification d’une ligne réellement supprimée. L’historique est remonté séparément pour chaque utilisateur : annulation des anciennes lectures, erreurs visibles avec reprise, actions mutuellement verrouillées, erreur PDF gérée, contrôle d’identité après génération, URL de téléchargement libérée après délai. Montants localisés, dates civiles sans décalage de fuseau, entête mobile et libellés accessibles améliorés.

Sept tests service nouveaux ; suite 1 371 tests / 131 fichiers réussie, lint sans erreur et build réussi. Cinq langues en navigateur isolé : lecture en échec puis reprise, absence de faux historique vide, double clic PDF et erreur, annulation/échec de suppression, isolation au changement de compte et déconnexion. Les services de ces scénarios sont simulés : aucune donnée client modifiée. Les politiques RLS réelles et l’ancien brouillon local partagé restent hors de cette validation.

PDF 6daf17b publié : CI 34415552734 réussie ; dpl_99ovP9AWSk55MSypRvWke8uSaxup Ready. Page facturation, métadonnées/liens, quatre largeurs et interactions de calcul vérifiées en production dans les cinq langues.


## 10 septembre — brouillons de facturation isolés et récupérables

L’éditeur attend la résolution de l’authentification et remonte un état distinct par compte/visiteur. Les brouillons sont enregistrés sous des clés séparées ; l’historique et le préremplissage locatif utilisent la même destination. L’ancienne clé commune est conservée, sans chargement automatique ; restauration volontaire avec confirmation d’appartenance. Une structure illisible bloque l’enregistrement automatique et permet d’exporter les données brutes avant réinitialisation. Champs numériques temporairement vides conservés invalides, non transformés en zéro. Échec de stockage signalé au lieu d’être masqué.

Génération protégée contre les doubles clics ; champs verrouillés pendant l’export. Résultat tardif abandonné après changement de compte/démontage, contrôle du propriétaire avant téléchargement authentifié, libération différée des URL. Ce stockage local n’est pas un coffre chiffré ; les règles de TVA du préremplissage locatif et les modèles métier ne sont pas certifiés par ce lot.

Neuf tests nouveaux : suite 1 380 tests / 132 fichiers, lint sans erreur et build réussis. Cinq langues en navigateur isolé : deux comptes et visiteur, restauration annulée puis acceptée, ancien original préservé, double clic/génération et changement d’identité, brouillon corrompu non écrasé, quota de stockage signalé. Cinq téléchargements réels sur serveur local compilé avec trafic Supabase bloqué ; scénarios de calcul et quatre largeurs toujours réussis. Aucun enregistrement client de production exécuté.

Historique f80eebe publié : CI 34416090971 réussie ; dpl_EiiDcqiAKWWubsNECZaYGQLtCxZb Ready. Accès anonyme, lien de connexion et quatre largeurs vérifiés dans les cinq langues sur la production.


## 10 septembre — profils XML réellement disponibles

Contrôle externe du même cas complet dans les cinq profils annoncés : BASIC, EN 16931 et EXTENDED validés ; MINIMUM et BASIC WL échouent aux schémas (structure spécifique incompatible avec les lignes et notes générées). Ces deux profils sont désormais refusés explicitement par la validation commune, donc par le formulaire et l’API. Aucun changement silencieux de profil. Un sélecteur de profil permet de corriger un ancien brouillon tout en conservant ses données. Les trois profils disponibles restent soumis aux mentions requises et à la validation du destinataire ; le passage d’un exemple complet n’est pas une certification générale.

Cinq tests supplémentaires ; suite 1 385 tests / 132 fichiers, lint sans erreur et build réussis. Validateur utilisé : Mustang CLI 2.26.0, contrôles XML/schémas/Schematron, sources et traces dans work/facturx-validation/profile-*.log. Cette correction ne traite pas encore les motifs d’exonération ni toutes les identités fiscales requises.

Brouillons e62cc49 publiés : CI 34416743081 réussie ; dpl_2n47tS86gohHK9Z6DYPwEurfygDa Ready. Cinq langues en production, brouillon visiteur, interactions de calcul et quatre largeurs vérifiés.

Navigateur réel : cinq langues, ancien MINIMUM conservé et export bloqué, choix BASIC/EN 16931/EXTENDED enregistrés et export activé, quatre largeurs sans débordement.


## 10 septembre — modèles sans présomption fiscale et dates civiles

Les modèles fournissent des libellés traduits mais ne préremplissent plus un prix, un taux, une exonération ou une qualification professionnelle. Suppression des mentions automatiques CGI/TVA LU/ILAT/TEGOVA/EVS dans ces modèles. Le modèle syndic concerne des prestations de gestion, pas une conversion d’appel de fonds en facture. La catégorie reste éditable et un taux numérique explicite est requis ; saisie libre pour les taux absents des anciennes listes nationales. Les données déjà enregistrées conservent leurs valeurs. Les nouveaux documents ne reçoivent plus systématiquement le numéro F-26-00001 : l’utilisateur attribue sa référence selon sa séquence.

Date par défaut calculée selon le jour civil au Luxembourg ; ajout des trente jours sur des dates civiles, sans décalage UTC/DST. Les modèles préservent dates, références et parties existantes. Sept tests nouveaux : suite 1 392 tests / 133 fichiers réussie, lint sans erreur et build réussi.

Profils b284e4f publiés : CI 34416998109 réussie ; dpl_CjrRyk1aAP9qRVr2HJXeMBkU2oaq Ready. Cinq langues et quatre largeurs, profil incompatible conservé/bloqué et trois profils disponibles vérifiés en production. Les mentions fiscales obligatoires et la conversion directe des appels syndic restent des travaux distincts.

Contrôle navigateur cinq langues : nouveau numéro et taux vides, cinq modèles nécessitant prix/taux, absence de notes juridiques automatiques, taux personnalisé 19 % produisant 119 EUR pour 100 EUR HT. Quatre largeurs et anciens scénarios d’arrondis/remises réussis.


## 10 septembre — appels de fonds distincts des factures fiscales

Retrait des boutons de conversion Factur-X individuelle/groupée et du générateur qui attribuait automatiquement une exonération TVA et des références CGI/LTVA aux appels de fonds. Le PDF d’appel de fonds existant et ses actions individuelle/groupée sont conservés. Un texte localisé précise la nature du document. Ce lot ne certifie ni les règles de répartition ni le traitement fiscal propre à chaque syndicat.

Référence sur la nature provisionnelle des appels en France : https://www.service-public.gouv.fr/particuliers/vosdroits/F20586. Le retrait des assertions fiscales LU/FR repose sur l’absence des informations nécessaires dans la conversion, sans appliquer un régime français au Luxembourg.

Lint sans erreur (une directive existante inutile), build réussi. Cinq langues testées sur l’écran réel avec services/rendu PDF simulés : texte de portée, absence des boutons fiscaux, actions PDF individuelle/groupée conservant le montant et le nom du fichier. Aucun PDF client ni opération financière produit par ces tests. Le rendu existant de l’appel n’a pas été modifié.

Modèles e141499 publiés : CI 34417387221 réussie ; dpl_33mUwmg8eW6Rh3LhPSzzktNwTCKt Ready. Cinq langues, modèles sans taux implicite, taux personnalisé et quatre largeurs vérifiés en production.


## 10 septembre — préremplissage locatif à vérifier avant facturation

Le préremplissage utilise désormais le propriétaire, le lot, l’année et le mois du paiement réel ; il refuse les identités discordantes, périodes invalides, montants négatifs/non finis et totaux incohérents. Les deux montants enregistrés sont conservés, sans présumer le pays ou la TVA. Numéro et pays laissés à compléter, taux requis, aucune référence CGI ajoutée et aucun nom de partie inventé. Date de préparation au jour civil luxembourgeois, échéance du 5 exprimée comme date civile de la période. Libellés et action traduits ; enregistrement du brouillon sous le compte initiateur, échec visible.

Neuf tests nouveaux ; suite 1 401 tests / 134 fichiers, lint sans erreur et build réussis. Cinq langues en navigateur isolé avec lecture simulée : montants/période/libellés conservés, destination localisée et brouillon par compte, TVA non supposée, refus sans écriture ni navigation pour un paiement d’un autre compte. Ni les quittances, ni le calcul des loyers, ni le stockage global des lots ne sont certifiés par ce lot.

Appels de fonds f11163c publiés : CI 34417797988 réussie ; dpl_4SsVGeVhZwx33gFx4mJMKQ7xw5Gx Ready. Les scénarios connectés de ce module ont été vérifiés avec des services simulés, pas avec des données client de production.
