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
