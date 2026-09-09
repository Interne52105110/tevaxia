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


## CPE — préparation du dossier et relevés
L’ancien questionnaire associait arbitrairement des points à six réponses, puis une lettre CPE, une consommation, une facture au tarif fixe de 0,22 €/kWh et des émissions avec un facteur de 0,300 kg/kWh. Aucun modèle thermique justificatif n’étant présent, ces résultats ont été retirés.
La page conserve six rubriques déclaratives (type, époque, chauffage, isolation, fenêtres, ventilation) avec une réponse inconnue possible, puis une synthèse destinée à l’expert. Le seul calcul est le quotient de l’énergie livrée renseignée sur douze mois par la surface correspondante. Aucune correction climatique, conversion énergie primaire ou classification n’est appliquée. Données absentes, négatives ou surface nulle ne produisent pas de ratio.
La navigation, la présentation sur l’accueil énergie et les métadonnées sont alignées sur la préparation du CPE. Les exigences techniques et le dossier sont renvoyés à la [démarche officielle Guichet.lu](https://guichet.public.lu/fr/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html), consultée le 9 septembre 2026. La page ne délivre pas de certificat.
Validation : 1 143 tests / 90 fichiers réussis, dont trois tests du quotient mesuré. Lint ciblé réussi. Le déploiement et les contrôles de production sont consignés dans le suivi opérationnel.

## Portefeuille énergétique — inventaire fiable
Le portefeuille appliquait des coefficients fixes de valeur par classe, fabriquait une consommation et des émissions à partir d’une lettre, puis en déduisait un risque réglementaire. La formule d’impact mélangeait en outre une valeur déjà ajustée et une valeur de référence, produisant un double effet de classe. Ces résultats et l’analyse IA qui les réutilisait ont été retirés, avec leur ancienne version PDF.

Le module présente désormais les valeurs et surfaces déclarées, leur somme et la répartition des surfaces par classe, sans fabriquer de classe CPE moyenne. Les classes A+ et inconnue sont acceptées. Les limites d’une répartition mêlant logements et bâtiments non résidentiels sont explicites. Les scénarios de valeur et les objectifs EPBD renvoient aux pages dédiées déjà revues.

La structure et la clé des portefeuilles sauvegardés sont conservées. Les données illisibles ou invalides ne sont pas écrasées et peuvent être téléchargées dans leur forme originale. Les échecs de sauvegarde sont signalés. L’import fonctionne aussi depuis un portefeuille vide ; le lecteur CSV reconnaît le séparateur, les virgules décimales dans les fichiers à point-virgule, les champs entre guillemets et les noms multilignes. Les lignes invalides sont signalées sans générer de valeurs de remplacement. Le formulaire refuse les valeurs non finies, négatives, les surfaces nulles et les années invalides.

Exemple de contrôle : 880 000 EUR en G + 1 200 000 EUR en A+ + 500 000 EUR sans classe = 2 580 000 EUR, inchangés par les lettres. Sur 400 m², les trois parts valent 25 %, 50 % et 25 %. Le PDF reprend exactement les données de l’inventaire et garde chaque fiche de bien sur une même page.

Sources revérifiées le 9 septembre 2026 : [Guichet.lu — CPE](https://guichet.public.lu/fr/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html) et [Commission européenne — EPBD](https://energy.ec.europa.eu/topics/energy-efficiency/energy-performance-buildings/energy-performance-buildings-directive_en). Cette correction n’établit ni certificat CPE ni conformité réglementaire individuelle.

Validation technique : 1 151 tests dans 91 fichiers, dont huit nouveaux tests métier/CSV/sauvegarde ; compilation et lint ciblé réussis. Cinq PDF de deux pages générés, totaux extraits et dix pages inspectées visuellement. Les contrôles d’interface et de production sont consignés ci-dessous après leur achèvement.

## Financement et CPE — comparaison de conditions explicites
L’onglet attribuait des ajustements fixes de taux et de LTV selon une classe CPE, assortis de justifications non établies (échéance EPBD, éligibilité verte, absence de risque). Il citait aussi à tort la circulaire CSSF 22/811 comme référence LTV. La source pertinente vers laquelle le nouvel outil renvoie est le [règlement CSSF 20-08](https://www.cssf.lu/fr/Document/reglement-cssf-n-20-08-du-3-decembre-2020/), vérifié le 9 septembre 2026. Le simulateur ne certifie pas l’admissibilité réglementaire d’un dossier.

L’onglet « Conditions de financement » compare maintenant deux taux nominaux et deux ratios prêt/valeur saisis, pour un capital et une durée identiques. Les valeurs initiales sont explicitement un exemple, identique entre A et B, sans attribution à une banque. Le taux et le plafond ne sont plus fabriqués à partir du CPE. La formule d’annuité utilise log1p/expm1 pour rester stable près de zéro ; le taux nul donne capital / nombre de mois. Le total d’intérêts est distinct du total remboursé, qui inclut le capital. Les plafonds valeur × ratio sont séparés des mensualités ; un capital dépassant le plafond déclenche une indication explicite, sans prétendre à une offre disponible ou à une capacité d’emprunt calculée.

Le périmètre exclut assurance, frais, taxes, aides et remboursement anticipé. Aucun TAEG n’est annoncé dans ce nouvel onglet. Les saisies invalides masquent les résultats. Les conditions réelles doivent provenir de l’offre et de l’analyse du dossier.

Validation : 1 142 tests dans 91 fichiers réussis ; les seize tests de l’ancien barème ont été remplacés par sept tests significatifs (annuité indépendante, intérêts, capital identique, plafond, taux nul/proche de zéro, limites). Lint et compilation réussis. Interface vérifiée dans cinq langues à 390, 320, 768 et 1440 pixels, sans erreur JavaScript de page observée. Aucun PDF n’existait dans cet onglet, aucun export n’y est ajouté.

Ce lot ne valide pas les autres onglets bancaires : comparateur d’offres nommées, références de taux et autres formules restent à reprendre, ainsi que le questionnaire d’audit énergétique et les modules non encore contrôlés.

## Comparateur de propositions — coûts et assurance
Les taux nommément attribués à Spuerkeess, BIL et BGL sans justificatif ont été retirés. Trois scénarios identiques, explicitement illustratifs et non attribués à une banque, servent de point de départ. Les coûts à zéro sont présentés comme des champs à compléter.

Le capital est commun aux trois propositions. Chaque proposition précise son taux fixe nominal, sa durée entière, la prime d’assurance initiale, les primes mensuelles constantes, les autres frais initiaux et les autres frais mensuels constants. Les coûts initiaux sont payés au départ et comptés une seule fois ; les coûts mensuels sont appliqués sur la durée entière. La formule réutilise l’annuité stable déjà contrôlée. Le coût hors capital est la somme des intérêts, assurances et autres frais saisis ; le total payé ajoute le capital. Le modèle ne traite pas les primes variables, les frais financés, les variations de taux, différés, remboursements anticipés ou la fiscalité, et n’annonce aucun TAEG réglementaire. L’ancien calcul inutilisé d’un pseudo-TEG a été supprimé.

À durée identique, le coût saisi le plus faible est signalé avec gestion des ex æquo, sans prétendre comparer les garanties contractuelles. Si les durées diffèrent, les résultats restent disponibles sans désigner une meilleure proposition. Toute saisie invalide masque le tableau.

L’ancien encadré de fourchettes de taux fixes et variables, avec attribution BCL/Switchr non établie et taux BCE de secours, a été retiré des trois onglets où il était utilisé. Un lien vers les [statistiques officielles BCL](https://www.bcl.lu/fr/statistiques/series_statistiques_luxembourg/03_marche_capitaux_interets/index.html), vérifié le 9 septembre 2026, rappelle la distinction entre moyennes et propositions individuelles. La [page officielle sur l’assurance solde restant dû](https://logement.public.lu/fr/proprietaire/fiscalit/assurance-solde-restant-du.html) est également liée. La mention générique « assurance obligatoire » et la promesse globale de conformité du sous-titre sont retirées. Les blocs SEO contenant des taux, garanties, conditions CPE et pénalités non justifiés sont retirés de la page.

Contrôle numérique indépendant : capital 120 000 EUR, taux nul, 10 ans, prime initiale 2 400 EUR, prime mensuelle 20 EUR, frais initiaux 600 EUR et mensuels 5 EUR : mensualité du prêt 1 000 EUR, sortie mensuelle 1 025 EUR, dépenses initiales 3 000 EUR, assurance totale 4 800 EUR, autres frais 1 200 EUR, coût hors capital 6 000 EUR, total payé 126 000 EUR.

Validation : 1 149 tests dans 92 fichiers passent, dont sept nouveaux tests. Lint et compilation réussis ; parcours vérifiés dans cinq langues à 390/320/768/1440 pixels, avec contrôles des coûts, égalités, durées différentes, saisies invalides et liens sources dans trois autres onglets. Aucun export PDF ne figurait dans le comparateur et aucun n’est ajouté.

L’historique graphique des taux, les autres calculs bancaires (capacité, remboursement, LTV, DSCR), le questionnaire énergétique et les modules restants demeurent à contrôler. Ce lot ne valide pas l’ensemble des outils bancaires.

## Capacité d’emprunt et remboursement anticipé
La capacité d’emprunt affichait une assurance calculée séparément sans la déduire du budget disponible pour rembourser le prêt. Le nouveau module retranche les engagements existants, l’assurance et les autres frais mensuels avant de convertir le budget résiduel en capital. Le ratio initial de 40 % est une hypothèse modifiable, sans prétention à un plafond légal universel. Les coûts mensuels sont saisis en euros d’après les devis, et non déduits automatiquement d’un pourcentage du capital. Le dépassement du budget est explicite et la capacité est nulle lorsque le budget est épuisé. Les anciennes additions d’apport fixes présentées comme budgets d’achat sont retirées.

Le remboursement anticipé intervient immédiatement après l’échéance mensuelle sélectionnée, sans arrondi silencieux du mois. Deux modalités restent possibles : conserver la mensualité et réduire la durée, ou conserver la durée restante et réduire la mensualité. Les résultats distinguent le capital restant, le montant effectivement remboursé, l’excédent non utilisé, les liquidités mobilisées avec frais, la dernière échéance éventuellement partielle et les intérêts futurs. Un remboursement à la dernière échéance n’applique aucun montant ni frais supplémentaires. Les frais de l’opération sont appliqués seulement lorsqu’un capital est effectivement remboursé.

L’indemnité par défaut égale à six mois d’intérêts a été remplacée par un montant en euros provenant du décompte bancaire, avec zéro présenté comme hypothèse à confirmer. Le texte reprend les limites indiquées par la [CSSF sur les contrats de crédit immobilier](https://www.cssf.lu/fr/contrats-credit-immobilier/), consultée le 9 septembre 2026 : conditions d’habitation effective et principale pendant au moins deux ans sans interruption, et exclusion du plafond pour la fraction cumulée des remboursements anticipés dépassant 450 000 EUR. Le calcul ne détermine ni l’indemnité légale applicable ni l’éligibilité du dossier.

Le gain affiché est limité aux intérêts évités moins les frais saisis. Le délai de couverture des frais utilise les intérêts évités sur toute la durée résiduelle initiale, même après extinction du prêt raccourci et en cas de remboursement total. Il ne constitue pas un délai de récupération du capital mobilisé. Les anciennes recommandations automatiques sont retirées. Assurance, fiscalité, actualisation, rendement alternatif de l’épargne et taux variables restent exclus ; les soldes doivent être rapprochés du décompte bancaire.

Contrôles indépendants : revenus 5 000 EUR, engagements 500 EUR, ratio 40 %, assurance 100 EUR et frais mensuels 50 EUR donnent un budget du prêt de 1 350 EUR ; à taux nul sur dix ans, capital de 162 000 EUR. Un prêt de 12 000 EUR sur douze mois à taux nul, remboursé de 3 500 EUR après la deuxième échéance, laisse 6 500 EUR : sept échéances en conservant une mensualité de 1 000 EUR, dont une dernière de 500 EUR ; ou dix mensualités de 650 EUR en conservant la durée.

Validation : 1 147 tests / 92 fichiers réussis. Treize tests significatifs remplacent les quinze anciens tests liés à ces fonctions. Cas couverts : budget assurance comprise, dépenses supérieures au budget, deux stratégies, échéance partielle, remboursement total, montant excédentaire, date finale, remboursement nul, délai de couverture après la fin du prêt raccourci et saisies invalides. Les anciennes fonctions retirées n’avaient pas d’autre appel dans le code. Aucun PDF n’était proposé dans ces deux onglets ; aucun export n’y est ajouté.

Contrôles d’interface de ce lot : compilation et lint réussis. Les deux onglets ont été vérifiés dans cinq langues à 390/320/768/1440 pixels : budget après assurance, budget dépassé, deux modalités de remboursement, échéance finale, surplus inutilisé, capital totalement remboursé et saisies invalides. Aucun message d’erreur JavaScript de page observé. Mise en ligne et contrôles de production consignés dans le suivi opérationnel.


## Ratios LTV/DSCR et amortissement bancaire

Le ratio LTV utilise la valeur et le prêt saisis, sans transformer ses seuils en verdict d’acceptation ou en éligibilité à une garantie. Une valeur nulle/invalide bloque le résultat. La part de valeur non couverte et le prêt excédant la valeur sont distingués, hors frais d’acquisition. Le lien au règlement CSSF 20-08 replace le calcul dans le dossier bancaire.

Le DSCR conserve un revenu net négatif, exige un service de dette strictement positif et distingue revenu d’exploitation et solde après dette. Les périodes sont annuelles et les charges excluent le prêt et ses intérêts pour éviter leur double comptage. Les seuils prétendument universels de 1,2/1,5 et les verdicts de solvabilité sont retirés.

L’annuité utilise une formule stable à taux presque nul. Le tableau conserve le capital et solde la dernière échéance. Les saisies invalides masquent les résultats et l’export ; le consommateur agence de cette même fonction est protégé contre une saisie invalide. Le PDF n’invente plus de valeur immobilière, d’apport, de LTV à 80 % ou de taux d’endettement : il contient les paramètres du prêt, les totaux et chaque année du tableau. Le total capital + intérêts est nommé explicitement, hors assurance/frais. Les écarts de centimes liés aux arrondis bancaires restent possibles.

Le graphique historique des taux, alimenté par des séries sans références ligne par ligne et une année 2026 estimée, a été retiré de cette page ; le lien aux statistiques BCL le remplace. Les autres utilisations de macro-data restent à contrôler et sont inscrites dans l’inventaire de revue.

Validation : 1 152 tests dans 93 fichiers réussis, compilation TypeScript/Next et lint ciblé réussis. Contrôle des trois onglets dans cinq langues et à 320/390/768/1440 pixels, cas invalides et ratios négatifs inclus, sans erreur JavaScript observée. Cinq PDF d’amortissement ont été générés et inspectés visuellement. Exemple indépendant : 12 000 EUR à 12 % nominal sur douze mois, mensualité 1 066,185464 EUR et intérêts 794,225570 EUR. Mise en ligne suivie dans le journal opérationnel.
