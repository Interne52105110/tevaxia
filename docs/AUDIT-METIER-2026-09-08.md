# Tevaxia — revue métier du 8 septembre 2026

Revue en cours. Les tests techniques précédents ne validaient pas l’exactitude des hypothèses fiscales et réglementaires.

## Lot coefficients de réévaluation
Tableaux ACD de l’article 102(6) LIR, millésimes 2015 à 2026, extraits des publications annuelles et vérifiés pour leur continuité. L’ancien tableau était erroné : 2020 valait 1,95 et 2026 valait 1,48 ; dans le millésime 2026, ces valeurs sont respectivement 1,15 et 1. Le loyer et la plus-value sélectionnent désormais le millésime de l’année renseignée. Les années de liquidation proposées dans ces deux écrans sont limitées aux tableaux disponibles.

Source principale : [ACD, textes LIR annuels](https://impotsdirects.public.lu/fr/legislation/LIR.html), [table 2026, page 144](https://impotsdirects.public.lu/dam-assets/fr/legislation/LIR/texte-coordonn-en-vigueur-au-1er-janvier-2026-ver-08052026.pdf). Chaque millésime conserve son URL source dans le fichier de données.

Contrôles : 1 008 tests réussis après correction des anciennes attentes erronées. Achat 2010 à 300 000 €, cession 2025 à 600 000 € : prix réévalué 378 000 € (coefficient 1,26), gain avant autres frais 222 000 €. Ce test contrôle la réévaluation ; la liquidation fiscale complète est revue dans le lot plus-value.

## Suite prioritaire identifiée
- Loyer : vétusté légale de 2 % par période de deux années après quinze ans, terrain exclu, acquisition antérieure présumée déjà décotée, entretien imputable, supplément mensuel mobilier 1,5 % des factures de moins de dix ans. Ancienne majoration automatique de 10 % incorrecte. Sources : [loi bail coordonnée au 1er août 2024](https://logement.public.lu/dam-assets/documents/legislation/lois/bl-loi-modifiee-du-21-09-2006-accessible.pdf), [FAQ ministère](https://logement.public.lu/fr/support/faq/faq-bail-loyer.html).
- Plus-value : vérifier durée de spéculation, acquisitions gratuites, résidence principale, abattements disponibles, taux global et contribution au fonds pour l’emploi. Les seules années ne suffisent pas aux frontières de durée.
- Estimation : justifier ou retirer les affirmations de calibration et de précision ; distinguer coefficients éditoriaux et résultats validés sur transactions réelles.
- Acquisition, aides, valorisation, projections et autres modules : revue à poursuivre. Aucun constat de conformité exhaustive à ce stade.

## Lot loyer — formule, explications et usages secondaires
- Acquisition d’un logement achevé : prix et frais admissibles ; terrain distinct (à défaut forfait 20 % du prix et frais) ; améliorations réévaluées à leur millésime propre. Travaux postérieurs au millésime exclus.
- Décote 2 % par période de deux années révolues après quinze ans, terrain exclu. Le prix d’achat est présumé déjà décoté ; pas de nouvelle décote des années précédant l’achat. Les améliorations ne remettent pas l’âge de tout le logement à zéro.
- Entretien/réparations : imputation du solde justifié réévalué disponible, surplus reportable affiché dans le moteur. Ne pas ressaisir des dépenses déjà imputées lors d’adaptations précédentes.
- Mobilier : supplément mensuel distinct de 1,5 % des factures de moins de dix ans. Suppression de la majoration arbitraire de 10 %. Pour éviter d’appliquer rétroactivement la loi d’août 2024, le mode meublé est limité aux millésimes 2025–2026.
- Explications corrigées dans les cinq langues ; retrait de la prétendue réforme à 3,5 %. PDF cohérent avec le loyer de base et le supplément mobilier. Historique sans mobilier ni report d’entretien, clairement indiqué.
- L’ancien assistant et les fiches locatives n’ont pas les justificatifs et l’année de construction nécessaires : résultat signalé comme partiel et renvoi vers le calculateur détaillé ; aucune certification de conformité ou de dépassement. Aucune majoration meublée inventée sur ces fiches.
- Exemple 2 du vademecum ministériel : construction 1970, achat 2000 de 380 000 € + frais 28 000 €, terrain frais compris 81 600 €, amélioration 15 000 € en 2000, référence 2020. Capital réévalué brut 592 200 €, décote 95 592 €, capital net 496 608 €, plafond mensuel 2 069,20 €.

Source du cas chiffré : [vademecum ministère, exemple 2](https://logement.public.lu/dam-assets/documents/publications/bail/Brochure-capital-investi-Calcul-du-plafond-legal-du-loyer.pdf). Ce document ancien sert uniquement à vérifier cet exemple, pas les dispositions modifiées depuis. Source juridique : article 3 du texte coordonné au 1er août 2024 cité plus haut.

Contrôles : 1 028 tests réussis ; compilation et contrôle TypeScript réussis. Cas aux frontières de périodes, entretien, mobilier, travaux futurs et saisies invalides. Second build réussi ; cas ministériel reproduit dans le navigateur et via l’API (2 069,20 €), erreurs de saisie, cinq langues et mobile 390 px vérifiés sans erreur JavaScript. Menu de langues compact sur mobile et grille du calculateur corrigée.

Limites : les périodes sont estimées à partir des années saisies ; vérifier les dates exactes d’achèvement, d’achat et d’adaptation à une frontière de période. Ce plafond n’autorise pas automatiquement une hausse : limites et délais d’adaptation du bail à contrôler. Construction par le propriétaire, transmissions gratuites et baux hors champ ne sont pas liquidés par ce mode d’acquisition.

## Lot plus-value — IR 2025–2026 et provision des contributions
- Barème classe 1 corrigé selon l’article 118 : seuil 13 230 €, tranches exactes jusqu’à 42 %. L’ancien tableau annoncé 2025 était erroné. Classe 2 calculée par splitting.
- Dates exactes requises ; cinq ans en régime courant, deux ans jusqu’au 30 juin 2025 et jusqu’au 30 septembre 2025 si compromis enregistré à l’AED au plus tard le 30 juin. Test du jour anniversaire et du lendemain. Fraction 1/4 ou 1/2 en bénéfice de cession selon ce régime.
- Succession et donation : prix et date du dernier achat à titre onéreux du détenteur antérieur. Suppression du step-up fictif à la valeur de transmission et de la durée calculée depuis le décès.
- Frais d’achat et travaux réévalués à leur année ; frais de vente déduits sans réévaluation. Une tranche de travaux dans l’écran, tableau de tranches possible dans le moteur/API.
- Abattement décennal : déduction des utilisations des dix années antérieures. Abattement successoral personnel confirmé et disponible, avant le décennal. Pas d’abattement de cession en spéculation. Bénéfice spéculatif annuel strictement inférieur à 500 € exonéré dans ce mode à une seule opération.
- Revenu ordinaire ajusté obligatoire, zéro accepté. Suppression des taux automatiques 40 % et 20 %. Arrondi de base à 50 €, cote d’IR à l’euro inférieur, taux spécial au centième de pourcentage, comparaison au tarif normal (art. 131, revenus extraordinaires > 250 €).
- Fonds pour l’emploi : différence de cotes majorées pour la spéculation, avec raccordement ACD de 931,80 € en classe 1 / 1 863,60 € en classe 2. En cession, affichage explicite d’une provision : 7 % de l’IR, fourchette 7–9 % au-delà du seuil de revenu. **La ventilation exacte du fonds pour les revenus extraordinaires élevés n’est pas validée ; ne pas assimiler cette provision à une liquidation définitive.**
- Dépendance : pour résident bénéficiaire uniquement, taux 1,4 % après abattements, seuil annuel 24,79 € évalué avec les autres bases patrimoniales positives saisies. Résidence principale exonérée exclue.
- Distinction gain fiscal / produit de vente après frais et provision. Le produit ne déduit ni prix d’achat historique ni dette restant à rembourser. PDF par impression conservant les données de départ. Suppression des diagnostics RP, report et cession de titres insuffisamment justifiés ; périmètre résident classe 1/2, 2025–2026, une seule opération, hors mécanismes particuliers explicitement affiché.

Sources : [ACD vente](https://impotsdirects.public.lu/fr/az/v/vente_immeuble.html), [modèle 700 F 2025, p. 3–4, incluant prolongation](https://impotsdirects.public.lu/dam-assets/fr/formulaires/pers_physiques/2025/700F-2025.pdf), [article 118 et barème](https://impotsdirects.public.lu/fr/az/t/tarif_pers.html), [exemple demi-taux global](https://impotsdirects.public.lu/fr/az/d/demi_txglob.html), [formules ACD 2025, feuilles Classe 1/2, cellule B34](https://impotsdirects.public.lu/dam-assets/fr/baremes/bareme-2025-format-excel.xlsx), [CADEP1, p. 6–8](https://impotsdirects.public.lu/content/dam/acd/fr/legislation/legi09/Circulaire_CADEP_1_du_23_octobre_2009.pdf), articles 99bis/99ter/102/126/130/131 du LIR 2026 cité plus haut.

Contrôles : 1 053 tests réussis. Exemple ACD 50 000 € ordinaires + 100 000 € gain imposable : cote fictive 46 590 €, IR sur gain 15 530 €. Build et TypeScript, navigateur cinq langues et mobile, API valeurs attendues/erreurs 400, impression avec dates et données d’entrée contrôlés. Aucun résultat d’impôt n’est affiché pour des dates invalides. Les corrections n’établissent pas une validation fiscale exhaustive de tous les dossiers.


## Données communales et estimation — lot septembre 2026

Remplacement des moyennes arrondies non justifiées et des prix de quartiers sans provenance par les quatre fichiers XLS officiels publiés le 25 juin 2026 (CC0), période glissante du 1er avril 2025 au 31 mars 2026. 100 communes, total de 3 538 ventes existantes et 569 VEFA réconcilié au fichier source. Les prix masqués (*) restent à null : seuil de 10 ventes enregistrées, 30 annonces dans ces fichiers. Recherche par quartier conservée uniquement comme rattachement géographique à la commune, sans prix inventé. Les noms Luxembourg-Ville, Petange, Erpeldange, Préizerdaul et Redange-sur-Attert sont normalisés pour le rapprochement des sources.

Les prix enregistrés avec annexes restent dans les vues de marché. L’estimation utilise la série affinée hors annexes ; le supplément parking de 4 % est une hypothèse visible, pas une statistique officielle. VEFA : pas de cumul avec les suppléments d’état neuf et d’énergie ; pas de remplacement automatique par l’ancien lorsque la série VEFA est masquée. La TVA de 3 % avec faveur fiscale limitée à 50 000 € est rappelée comme convention de la source. Maisons exclues, surfaces invalides refusées. Les moyennes avec et sans annexes ne sont plus moyennées comme deux évaluations comparables.

Les marges ±18/25 % sont conventionnelles, sans probabilité ni précision garantie. /transparence ne présente plus les métriques de 20 exemples synthétiques comme preuve de performance. Les coefficients sont explicitement des hypothèses internes et non des coefficients officiels.

Sources exactes (import dans src/lib/market-data-2026t1.json) :
- https://download.data.public.lu/resources/prix-de-vente-des-appartements-par-commune/20260625-075922/prix-moyen-au-metre-carre-enregistre-par-commune-2026t1.xls
- https://download.data.public.lu/resources/prix-de-vente-des-appartements-prix-affines-hors-annexes-par-commune/20260625-080045/prix-affine-au-metre-carre-par-commune-2026t1.xls
- https://download.data.public.lu/resources/prix-annonces-des-logements-par-commune/20260625-080844/vente-appartement-2025-26.xls
- https://download.data.public.lu/resources/loyers-annonces-des-logements-par-commune/20260625-081047/location-appartement-2025-26.xls

La revue des autres modèles, des tendances reconstituées et des contenus secondaires reste à poursuivre. Le retrait des allégations de précision ne constitue pas une calibration du modèle.

SHA-256 transactions : `178d37250eefa024c962ac34953a7873fbf0486fa53d12918417e4b60f64a26a`.

SHA-256 affines : `ffd6e9728146f8c518ea079edff3bae1877652c450906dda7a1b0c7105f74e39`.

SHA-256 annonces : `b31167af2cc402f8f45e6359aa4090bab02db348b0a0f8202acc106b839bba7a`.

SHA-256 loyers : `61ae31831f3bbb111a3ff8c735858e0778479d6720fc523ee030a7839f3e4b19`.


## Cohérence des estimateurs et guides

/hedonique utilise désormais le même moteur et les mêmes contrôles que /estimation : retrait du second jeu de coefficients, erreurs-types et significativités sans échantillon de ventes justificatif. Les textes de présentation associés sont corrigés dans les cinq langues. L’export PDF reçoit désormais la source et les limites ; parcours PDF authentifié non testé de bout en bout dans cette session. Une modification de la recherche invalide la sélection précédente ; le mode emphytéotique ne produit plus une estimation en pleine propriété.

Guides /guide/plus-value-immobiliere et /guide/regle-5-pourcent-loyer réécrits avec règles datées, sources précises et exemple de loyer 2020 réconcilié à 2 069,20 €/mois. Suppression des anciennes illustrations 2015×2,07 et du quart de taux présenté comme régime ordinaire 2026. Les cinq langues passent les contrôles mobiles, liens aux calculateurs et textes ; build et lint ciblé réussis.


## Acquisition — lot tarif, crédit personnel et hypothèque

Barèmes notariaux 7 (vente de gré à gré, minimum 99,16 € HT) et 5 (obligation avec garantie, minimum 61,97 € HT), selon les tranches successives du tableau officiel. Émoluments HT et TVA 17 % séparés. Exemple de vente à 750 000 € : 1 900,23 € HT + 323,04 € de TVA. Copies, débours et diligences exceptionnelles non chiffrés.

Hypothèque : enregistrement de l’obligation à 0,24 % du principal ; inscription à 0,05 % du montant garanti, accessoires compris si saisis. Prêt ordinaire non exonéré. Exemple de principal 400 000 €, garantie 480 000 € : droits 960 € + 240 €, émoluments 928,19 € HT + 157,79 € de TVA, soit 2 285,98 € hors débours et frais bancaires.

Bëllegen Akt : minimum de perception 100 €, soldes personnels et quotes-parts distincts ; aucune transférabilité entre acquéreurs ; société exclue. Non-résident EEE pouvant s’installer : crédit possible ; hors EEE, avance des droits puis remboursement éventuel explicités. Le régime publié confirme 40 000 € ; annonce de 45 000 € du 16 juillet 2026 identifiée comme projet au Conseil du 24 juillet, entrée en vigueur non confirmée et non incorporée.

Réduction temporaire : aucune application sur la seule date ; confirmation d’éligibilité requise, et enregistrement du compromis/réservation avant juillet pour la prolongation juillet–septembre 2025. VEFA : prix hors TVA, sans construction déjà réalisée à l’acte, avantage TVA entièrement disponible et construction éligible supposés ; limites visibles et retournées par l’API. Le taux de TVA renvoyé est effectif après plafond. Le parcours simplifié ne chiffre plus une VEFA sans ventilation et dirige vers le détail. Ce lot ne liquide pas les projets déjà commencés, exonérations hypothécaires, reports partiels d’avantage TVA ou tous les cas immobiliers particuliers.

PDF : crédit imputé ajouté au détail et limites transmises ; les émoluments transmis sont TTC. Téléchargement authentifié non testé de bout en bout.

Sources :
- https://www.notariat.lu/notaire/reglement-revision-tarifs (art. 4, 5, 6 et 19 n° 58/61/89 ; tableau visualisé dans le texte coordonné joint à l’avis 51.123 du Conseil d’État).
- https://conseil-etat.public.lu/dam-assets/fr/avis/2015/05/19_05_2015/51_123/51123-Texte.pdf
- https://pfi.public.lu/fr/citoyen/hypotheques.html
- https://pfi.public.lu/fr/citoyen/enregistrement/tarif.html
- https://pfi.public.lu/fr/citoyen/enregistrement/credit-impot.html
- https://guichet.public.lu/fr/citoyens/logement/aides/aides-indirectes-avantages-fiscaux/credit-impot-actes-notaries.html
- https://guichet.public.lu/fr/citoyens/actualites/2025/juin/04-mesures-fiscales-logement.html
- https://gouvernement.lu/fr/actualites/toutes_actualites/communiques/2026/07-juillet/24-conseil-gouvernement.html


## Aides individuelles au logement — contrôle du 8 septembre 2026

Le moteur précédent attribuait des plafonds sans vérifier les revenus, une prime d’épargne forfaitaire, des économies d’intérêts non amorties et des pourcentages énergétiques non justifiés. Ces calculs sont remplacés par des résultats conditionnels, avec montants inconnus explicitement exclus du sous-total.

- Prime d’accession pour acte 2026 : articles 16 et 32, annexe III de la loi modifiée du 7 août 2023 (texte coordonné au 1er mars 2026). Revenu net moyen 2024/2025, indice moyen 952,30, composition réelle du foyer, majorations 15/40 %, pots personnels restants. Le tableau ministériel confirme le plafond de 52 233,65 EUR pour une personne seule. L’annexe prévoit +1 000 EUR de plafond de prime par enfant au-delà du troisième ; le titre simplifié 500–10 000 EUR n’a pas remplacé la formule légale. Cas sans deux années ordinaires de revenus non chiffrés.
- Épargne : accroissements annuels réels par bénéficiaire, 10 %, plafond 500 EUR/an sur dix ans, accès conditionné à la prime d’accession, à l’investissement de 90 % et au délai. Pot partagé de 35 000 EUR/personne après autres aides et prime d’accession.
- Intérêt : taux de l’annexe IV, revenu net 2025 (indice moyen 960,17), arrondi au huitième de point inférieur, correction des prêts sous 1,5 %, plafonnement au taux nominal. Seule la mensualité initiale d’un premier nouveau droit est estimée sur le capital plafonné 200 000 + 20 000/enfant, maximum 280 000 EUR. Seuil mensuel de 10 EUR ; aucune projection forfaitaire à 10/25 ans. Anciens droits, amortissement ultérieur et réexamens nécessitent un dossier.
- Bëllegen Akt : soldes/quotes-parts explicitement confirmés, minimum de perception de 100 EUR, avantage fiscal séparé des primes en capital pour éviter une seconde déduction dans le parcours d’acquisition.
- TVA : base HT admissible et solde restant exigés ; différence de 14 points et plafond commun au logement, sans addition de deux faveurs construction/rénovation. Pour les bailleurs, la possibilité en rénovation est signalée sans attribution automatique.
- Klimabonus, conseil, complément social, prêt climatique, primes fournisseurs et communes : pas de montant calculé à partir du seul budget. Dossier technique, devis, dates et règles de cumul requis ; liens vers les démarches actuelles. Les aides énergétiques ne sont pas exclues automatiquement pour un bailleur.
- UI dans les cinq langues, sous-total ponctuel distinct de la mensualité, qualification du résultat conservée à la sauvegarde et au PDF. Suppression des tableaux et de la veille non étayés (dont le faux plafond de 42 500 EUR). Les aides ne sont pas présentées comme accordées.

Sources primaires :
- https://logement.public.lu/dam-assets/documents/legislation/lois/aides-loi-07-08-2023-accessible.pdf (annexes III–V inspectées ; tableau III rendu et lu)
- https://logement.public.lu/fr/proprietaire/obtenir-aide-achat-construction/prime-accession-propriete.html (plafonds 2024/2025)
- https://guichet.public.lu/fr/citoyens/logement/aides/aides-directes-capital/prime-epargne.html
- https://guichet.public.lu/fr/citoyens/aides/logement-construction/aides-interet/subvention-interet.html
- https://pfi.public.lu/fr/citoyen/enregistrement/credit-impot.html
- https://pfi.public.lu/fr/citoyen/tva/logement.html
- https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement.html

Validation : 1 104 tests/86 fichiers réussis, cas de plafonds et de non-cumul ajoutés. Compilation et lint ciblé réussis. Parcours navigateur acquisition/épargne/revenus exclus/mensualité/entrée invalide dans les cinq langues, largeurs 320/390/768/1440, sans débordement. PDF réellement généré (4 pages), contrôlé par extraction et rendu : inconnus conservés, mensualité séparée, lignes non coupées de leur description. Authentification/téléchargement utilisateur non testés de bout en bout.

Périmètre restant : les autres pages de rénovation résidentielle/hôtelière utilisent leurs propres moteurs et doivent encore être corrigées ; la présente validation ne les couvre pas. Elle ne constitue pas une revue exhaustive de tous les modules de Tevaxia.


## Rénovation résidentielle et guide Klimabonus — 8 septembre 2026

Le scénario du site ne déduit plus de subventions du seul saut de classe CPE et ne promet plus de plus-value immobilière automatique. Les hypothèses de coût, consommation, énergie primaire/finale, CO2 et aides de l’ancien calcul ont été retirées de ce parcours lorsqu’elles ne disposaient pas d’un fondement adapté au bien.

Nouveau moteur `renovation-scenario.ts` : devis et frais TTC saisis, aides documentées uniquement (zéro retenu par défaut ne signifie pas inéligibilité), année de versement, factures annuelles avant/après, entretien additionnel, évolution des dépenses énergétiques et taux d’actualisation paramétrables. Flux de fin d’année, hausse à compter de l’année 2. Aucun gain de revente ni valeur résiduelle implicite. Un emprunt amortissable facultatif calcule mensualité, intérêts et budget de première année, séparément de la VAN/TRI du projet. TRI négatifs préservés ; aucun TRI fictif si les flux ne relèvent pas du cas conventionnel à solution unique pris en charge. Récupération de la mise selon les flux cumulés réels du scénario, sans faux délai à 99 ans. Pas de dépendance à l’ancien moteur Java dans ce parcours navigateur.

Guide Klimabonus réécrit dans cinq langues : conditions techniques et dates, distinction du conseil gratuit d’orientation et de la mission agréée, accord préalable et procédure distincte pour mesure isolée, plafonds et cumul à examiner. Suppression des montants/faux seuil social de 60 000 EUR, multiplicateur automatique 150 %, audit systématiquement gratuit et crédit 0 % présenté comme garanti. Exemple de trésorerie purement arithmétique : 100 000 EUR TTC et 20 000 EUR d’aides confirmées = 80 000 EUR nets, mais 100 000 EUR à avancer si la prime arrive ensuite. Sources Guichet 2026 et AED déjà citées dans le lot aides.

Validation : 1 125 tests / 87 fichiers, build et lint ciblé réussis. Navigateur dans les cinq langues : aide différée, prêt sans effet sur la VAN du projet, prêt à taux zéro, facture après travaux supérieure, données invalides, guide et écrans 320/390/768/1440. PDFs réels de 20/50 ans générés, extraction et rendu contrôlés (3/4 pages), en-tête du tableau répété, aucune ligne tronquée. Parcours d’authentification PDF non vérifié de bout en bout.

Limite : `energy-api` Java autonome garde l’ancienne API de rénovation ; son déploiement indépendant n’est pas couvert. Le site utilise désormais le moteur de scénario local. Les autres outils énergétiques et la rénovation hôtelière restent à contrôler séparément.


## Rénovation hôtelière — 8 septembre 2026

Suppression des taux automatiques de subvention par poste (20–50 %) : le calcul ne présume plus que Klimabonus résidentiel couvre un hôtel. Montant d’aides confirmées saisi par l’utilisateur, zéro retenu par défaut, sans conclure à l’inéligibilité. Les modalités des aides aux entreprises sont renvoyées à la démarche officielle : https://guichet.public.lu/fr/entreprises/financement-aides/aides-environnement/industrie-services/aide-protec-environnement.html .

Budget total de devis facultatif, remplaçant les ratios illustratifs par chambre. La répartition entre postes est comptable et proportionnelle aux ratios, explicitement non contractuelle. La consommation requise est l’énergie finale facturée, pas un indice d’énergie primaire. À défaut de cible technique, le scénario de réduction est illustratif et multiplicatif ; aucune garantie de performance. Une cible plus énergivore reste une économie négative. Aucune économie ni effet commercial attribué en l’absence de travaux sélectionnés.

Gain RevPAR fixé à zéro par défaut, supprimant la promesse non documentée d’un gain de label. Un gain commercial saisi est converti en contribution après coûts variables via une marge explicite ; il n’est plus traité comme un bénéfice intégral. Entretien additionnel déduit avant payback et VAN. VAN de flux constants sur dix ans, actualisés à 4 %, aides supposées immédiates. Dette, fiscalité, TVA récupérable, remplacements et valeur résiduelle exclus et signalés. Pour délais d’aides/financement : renvoi au scénario détaillé.

Validation : 1 137 tests / 88 fichiers réussis, build et lint ciblé réussis. Nouveaux cas d’aides saisies, réconciliation des coûts, marge, entretien, absence de travaux, surconsommation, occupation nulle et données invalides. QA navigateur cinq langues et largeurs 320/390/768/1440 réussie ; inspection visuelle du rendu.
