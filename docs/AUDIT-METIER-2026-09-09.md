# Tevaxia — audit énergie du 9 septembre 2026

## Communauté énergétique
Le précédent calcul mélangeait l’économie des consommateurs et les revenus du producteur, déduisait le taux de partage du nombre de membres et affichait 99 ans en l’absence de retour positif. Le nouveau scénario sépare les flux :
- consommateurs = énergie partagée × (prix variable évité − prix du partage − charges résiduelles) ;
- producteur = paiements du partage + vente du surplus − coûts annuels ;
- collectif = somme des deux ; les paiements internes s’annulent.
Le volume partagé est saisi et doit être inférieur ou égal à la production et à la consommation. Il doit être justifié par une étude des profils simultanés. Les ratios portent sur ce volume réel, sans confondre production annuelle et demande couverte. Prix, devis avec taxes non récupérables, aide confirmée initiale et coûts annuels sont explicites. Les hypothèses initiales sont des exemples. Les flux négatifs restent visibles ; aucun retour fictif de 99 ans. La moyenne par consommateur n’est pas une clé contractuelle.
Exemple testé : production 28 500 kWh, consommation 27 000 kWh, partage 14 000 kWh ; consommateurs 1 540 €/an, producteur 2 615 €/an, collectif 4 155 €/an. Modifier le prix interne déplace les montants individuels sans changer le total collectif.
La page ne fait plus appel au backend Java historique ni à une production PVGIS assimilée à une mesure réelle. Un lien vers PVGIS permet d’obtenir une estimation externe ; aucun statut de conformité ni gain CO2 automatique n’est délivré.

## EPBD
Retrait des dates de non-conformité, risques et décotes de prix dérivés de la seule lettre CPE. Trois catégories distinctes : résidentiel existant (trajectoire moyenne nationale), non résidentiel existant (seuils des fractions les moins performantes du parc de référence), constructions neuves (objectif émissions nulles). L’application nationale et les exemptions restent à vérifier pour le bâtiment concerné. La date générale de transposition ne vaut pas diagnostic individuel.

## Sources consultées
- [ILR — autoconsommation et partage](https://www.ilr.lu/secteurs-activites/energie/electricite/energie-renouvelable-partage/autoconsommation-partage-delectricite/).
- [MyILR — raccordement et contrats](https://www.myilr.lu/mes-questions/energie/produire-autoconsommer-et-partager-delectricite/).
- [Directive UE 2024/1275](https://eur-lex.europa.eu/eli/dir/2024/1275/oj).
- [Commission européenne — EPBD](https://energy.ec.europa.eu/topics/energy-efficiency/energy-performance-buildings/energy-performance-buildings-directive_en).
- [Ministère de l’Économie — ressources techniques](https://meco.gouvernement.lu/fr/domaines-activites/energie/efficacite-energetique/informations-techniques.html).
- [ILR — consultation du 14 août au 27 septembre 2026](https://www.ilr.lu/consultations/consultation-publique-du-14-aout-au-27-septembre-2026/), identifiée comme consultation, sans la présenter comme texte déjà adopté.

## Validation
1 140 tests dans 89 fichiers passent, dont 8 nouveaux tests de cohérence du partage. Lint ciblé et compilation réussis. Parcours des deux pages et des trois catégories EPBD vérifiés dans les cinq langues, aux largeurs 320, 390, 768 et 1440 pixels. Douze PDF générés : cinq bilans de partage, cinq synthèses EPBD résidentielles et deux autres catégories en français ; dix-sept pages rendues et inspectées. Espaces numériques du PDF normalisés. Locale numérique explicite pour le luxembourgeois après constat de différences entre Node et Chromium qui provoquaient une erreur d’hydratation.

## Périmètre restant
Ce lot ne certifie pas la transposition exhaustive des dispositions EPBD au Luxembourg, n’établit pas un CPE et ne calcule pas les taxes ou tarifs réglementés individuels. L’ancien service Java, les autres modules énergétiques et les modules professionnels restent à auditer. L’audit global de Tevaxia demeure ouvert.

