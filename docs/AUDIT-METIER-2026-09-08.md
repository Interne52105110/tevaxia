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
