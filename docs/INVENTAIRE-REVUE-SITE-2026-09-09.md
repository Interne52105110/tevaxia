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
