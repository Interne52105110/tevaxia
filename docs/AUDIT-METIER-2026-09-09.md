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


## Fiches immobilières des agences

L’ancien forfait d’émoluments « 1,3 % + 500 EUR » est remplacé par la fonction tarifaire déjà vérifiée. Le calcul automatique est réservé au logement existant en vente ordinaire, avant Bëllegen Akt : 6 % d’enregistrement + 1 % de transcription et émolument de vente TVA 17 % comprise. Hypothèque, débours, copies, honoraires d’agence et frais bancaires sont exclus et visibles. À 750 000 EUR : droits 52 500 EUR + émolument TTC 2 223,27 EUR = sous-total 54 723,27 EUR. Pour terrain, local commercial, bureau ou VEFA, le PDF n’applique aucun sous-total résidentiel et invite à obtenir le décompte adapté.

La valeur saisie n’est plus appelée « estimation indépendante » ou « modèle hédonique ». Son inclusion devient optionnelle ; la fourchette est explicitement un pourcentage choisi par l’agence, sans intervalle de confiance. Les descriptions commerciales préremplies sont supprimées. Les classes CPE et isolation sont distinctes, A+ est disponible, les valeurs par défaut sont non renseignées et aucune conformité réglementaire n’est certifiée par la fiche.

Le PDF utilise maintenant la langue sélectionnée et les montants à deux décimales. L’apport sur prix et les frais chiffrés sont distingués ; le modèle de crédit exclut assurance et frais bancaires. Les saisies incohérentes bloquent l’export et les erreurs de génération sont affichées sans effacer les champs.

Validation : 1 152 tests réussis, lint et compilation réussis, cinq langues et quatre largeurs vérifiées. Dix pages PDF de référence inspectées visuellement ; cinq autres PDF ont été réellement téléchargés via le formulaire local et leur contenu contrôlé. Contrôles d’interface : valeur optionnelle, A+/isolation distinctes, forfait supprimé, exclusion terrain/VEFA, taux zéro, champs invalides et bouton bloqué.


## Questionnaire énergétique

Les vingt questions sont conservées comme recueil déclaratif avant une étude professionnelle. L’ancien score, sa conversion en CPE A–G, les recommandations chiffrées sans métrés, les pourcentages forfaitaires Klimabonus et les gains additionnés puis plafonnés à 85 % sont supprimés. Le budget, l’occupation ou l’intention de rénover ne changent plus artificiellement une classe énergétique.

Chaque question admet « je ne sais pas ». Le dossier final distingue les réponses renseignées des inconnues, conserve toutes les réponses et fournit une liste de documents à examiner avec le professionnel. Un avancement de questionnaire n’est pas présenté comme une note énergétique. La navigation est explicite, sans temporisation susceptible de sauter une question après plusieurs clics. Modification et remise à zéro sont disponibles. Les métadonnées dans les cinq langues et la carte d’accueil énergie sont alignées.

Source : Guichet.lu, certificat de performance énergétique des bâtiments d’habitation et documents nécessaires, consulté le 9 septembre 2026. Le questionnaire ne détermine pas les aides : les critères techniques, dates, démarches et confirmations du dossier restent nécessaires.

Validation : 1 140 tests / 93 fichiers réussis. Quatre tests de recueil remplacent seize tests qui validaient les anciennes hypothèses arbitraires (classe et aides). Compilation et lint réussis. Parcours des vingt questions, toutes réponses inconnues, modification, remise à zéro, métadonnées et responsive contrôlés dans cinq langues.


## Chauffage / HVAC

Le calcul précédent comportait une erreur d’unité de facteur 1 000 dans la conversion de puissance et heures en consommation. Il combinait également des tableaux de puissance non démontrés « EN 12831 », des prix et caractéristiques de catalogues sans devis de modèle précis, un forfait d’eau chaude par nombre de pièces, des aides automatiques et une déduction TVA appliquée aux coûts sans base fiscale cohérente.

Le module compare maintenant deux scénarios explicitement documentés : chaleur utile annuelle, facteur saisonnier, prix de l’énergie, entretien et autres coûts annuels. Énergie achetée = chaleur utile / facteur saisonnier. Exemple : 18 000 kWh / 0,9 = 20 000 kWh ; 18 000 / 3 = 6 000 kWh. À 0,10 et 0,25 EUR/kWh avec 200 et 250 EUR d’entretien : coûts 2 200 et 1 750 EUR, économie 450 EUR. Les hausses de coût restent négatives. Aucune performance saisonnière n’est déduite d’un COP ponctuel.

Le détail conserve sept lots et ajoute les autres frais, saisis d’après les devis TTC. Les aides sont confirmées par le dossier, zéro sinon ; elles ne peuvent dépasser les devis et ne comprennent pas une économie TVA déjà incluse au prix TTC. Le retour simple et le solde nominal utilisent l’horizon saisi, avec prix constants, sans crédit/actualisation/remplacement. Aucun devis signifie budget incomplet et retour non calculé, sans ancienne valeur fictive de 99 ans.

La charge thermique et la puissance disponible sont renseignées depuis l’étude et les fiches aux mêmes conditions. Leur différence n’est pas une certification de dimensionnement : pas d’autosélection de produit, débit VMC, validation de modulation, appoint ou émetteurs. Le guide officiel Klima-Agence de planification des pompes à chaleur est lié ; aucun taux d’aide historique de ce guide n’est repris. Métadonnées et carte d’accueil adaptées.

Validation : 1 144 tests / 94 fichiers réussis, compilation et lint ciblé réussis. Les cinq langues et quatre largeurs ont été vérifiées, avec unités, coûts négatifs, aides excessives, facteurs invalides et horizon de retour. Cinq PDF (dix pages) ont été générés et inspectés ; les montants et kWh correspondent au scénario. Ancien générateur PDF HVAC devenu inutilisé supprimé. La mise en ligne est suivie au journal opérationnel.

## LENOZ

Les médailles et le score simplifié sans dossier sont remplacés par la vérification des seuils des quatre classes officielles : 85/40 %, 70/35 %, 55/30 % et 40 % global sans minimum catégoriel. Le second seuil s’applique séparément aux catégories économie, écologie, bâtiment/installations techniques et fonctionnalité ; implantation et société n’ont pas ce minimum. Le pourcentage global doit provenir du dossier complet, il n’est pas la moyenne des quatre saisies.

Les résultats restent une lecture des seuils déclarés et ne délivrent aucun certificat ni droit à aide. Les valeurs absentes, non finies et hors de 0 à 100 % empêchent le résultat et le PDF. Les métadonnées et l’accueil énergie sont adaptés dans les cinq langues. Les sources sont le ministère du Logement (classification et dossier LENOZ) et Guichet.lu, consultés le 9 septembre 2026.

Validation : 1 148 tests / 95 fichiers réussis, compilation et lint ciblé réussis. Les transitions entre les quatre classes et l’absence de classe ont été vérifiées pour chaque minimum catégoriel. Parcours navigateur dans les cinq langues, de 320 à 1 440 pixels, réussi ; le titre allemand a été corrigé pour éviter un débordement. Cinq PDF d’une page ont été générés et inspectés. L’ancien PDF fondé sur les médailles a été supprimé.

## Taxonomie UE — activité 7.7, atténuation

La voie CPE pour l’ancien accepte A/A+, pas B. Les seuils top 15 % et nZEB luxembourgeois sans source sont supprimés : le seuil et son justificatif doivent venir du dossier. La comparaison du récent utilise 90 % du seuil nZEB saisi ; elle ne suffit pas seule à remplir la contribution substantielle. Au-delà de 5 000 m², les justificatifs d’enveloppe et de GWP sont demandés. Au-delà de 290 kW pour le non-résidentiel, le suivi et l’évaluation de la performance sont requis. Les limites exactes 5 000 m² et 290 kW sont testées. La date pertinente est à établir avec les pièces et la FAQ (demande de permis).

Le DNSH de 7.7 porte ici sur l’adaptation selon l’appendice A ; les quatre axes eau/circularité/pollution/biodiversité sont N/A pour cette activité, sans supprimer les autres obligations légales. Les garanties minimales sont une revue des procédures de l’entreprise selon l’article 18, pas quatre cases assimilées à une certification. Le score 40/40/20 et le verdict d’alignement automatique sont supprimés. Le résultat distingue déclarations satisfaites, non satisfaites et inconnues, avec revue professionnelle nécessaire. Le changement de régime ou de voie réinitialise les seuils et leurs justificatifs.

Sources consultées le 9 septembre 2026 : règlement délégué 2021/2139 consolidé au 1er janvier 2026, annexe I sections 7.1 et 7.7 et appendice A ; communication Commission 2023/267, notamment FAQ 140–145 ; règlement 2020/852 articles 3 et 18. Le renvoi de 7.7 vers 7.1 vise la contribution substantielle et ne réimporte pas le DNSH de 7.1 (FAQ 141).

Validation : 1 144 tests / 95 fichiers réussis ; six tests remplacent dix anciens tests validant notamment la classe B et le score arbitraire. Compilation et lint réussis. Parcours cinq langues, seuils inclusifs, invalides, changement de voie, réinitialisation des preuves, métadonnées et affichage 320/390/768/1440 px vérifiés. Aucun PDF n’était proposé sur cette page. Accueil ESG et métadonnées mis à jour.

## Trajectoires énergie/carbone et accueil ESG

Les anciennes courbes prétendument CRREM « v3.0 2024 », les facteurs LU non étayés, le mélange chaleur utile/électricité des PAC, les rénovations forfaitaires et la date « net zéro » obtenue depuis la cible sont retirés. Les fausses obligations de location E en 2030 et D en 2033 sont également supprimées. Une année de dépassement n’est ni une interdiction de louer ni une estimation de perte de valeur.

Le module calcule les intensités depuis un bilan annuel documenté (kWh/surface et kg CO₂e/surface). La comparaison conserve deux graphiques et le détail annuel, mais repose sur cinq colonnes fournies par le dossier : année, cible énergie/carbone, bâtiment énergie/carbone. Toutes les années doivent être consécutives ; aucun zéro n’est inventé pour une cellule vide, aucune interpolation ou extrapolation n’est appliquée. Les évolutions du réseau, des consommations et des travaux appartiennent explicitement au scénario fourni. Le premier dépassement strict de chaque critère et le premier des deux sont conservés, même si le bâtiment revient ensuite sous la cible. Sans dépassement, le résultat vaut uniquement pour la période fournie. L’exemple optionnel est identifié comme fictif, sans données CRREM.

Limite d’intégration : la bibliothèque officielle CRREM consultée le 9 septembre 2026 publie les données et la méthode, mais exige un accord License Partner pour leur intégration commerciale. Aucun accord n’a été retrouvé dans le projet. Les données propriétaires ne sont donc pas embarquées et Tevaxia ne se présente pas comme un outil CRREM certifié. Le lien vers la bibliothèque officielle et le guide est conservé. Une intégration officielle complète reste conditionnée à la licence et à la validation contre les exemples de référence du fournisseur.

L’accueil ESG expose les deux outils opérationnels avec des liens conservant la langue ; les promesses de reporting SFDR/CRR, la décote automatique et les modules futurs sans date vérifiée sont retirés de la présentation. Métadonnées traduites alignées.

Validation : 1 137 tests / 95 fichiers réussis ; cinq tests remplacent douze tests de l’ancienne approximation. Lint et compilation réussis. Cinq langues et quatre largeurs contrôlées, bilan de 23 500 kWh / 150 m² et 4 200 kg / 150 m², dépassement strict, retour sous cible, années manquantes, champs vides, référence absente, décimales avec virgule et imports tabulés vérifiés. Les graphiques, le détail annuel, les métadonnées et les liens localisés de l’accueil ont été contrôlés. Cette page ne proposait pas de PDF.

## Valorisation — onglet environnement / ESG

Le score automatique, les niveaux A–E, les primes/décotes forfaitaires par CPE, risque, équipement, âge et certificat sont supprimés. Le relevé distingue désormais inconnu, présent et absent ; aucune réponse manquante ne devient une absence de risque. Le CPE A+ à I, les certifications et les sources du dossier sont déclaratifs. Les compteurs indiquent uniquement les réponses renseignées sur sept, pas une note ESG. L’outil explicite les dimensions environnementales couvertes et ne prétend pas couvrir seul social et gouvernance.

Une sensibilité de valeur séparée applique uniquement le pourcentage saisi à une valeur fournie, avec justification obligatoire pour tout ajustement non nul. Exemple : 1 000 000 EUR et −5 % donnent −50 000 EUR et 950 000 EUR ; +6 % donne 1 060 000 EUR. Changer le CPE ou la PAC n’altère pas ces montants. Le texte rappelle le besoin de comparables et le risque de double comptage dans loyers/rendement/travaux. Le résultat n’alimente pas automatiquement la réconciliation ni le PDF d’évaluation.

Source professionnelle : RICS, ESG and sustainability in commercial property valuation, quatrième édition 2026, entrée en vigueur le 30 avril 2026, consultée le 9 septembre. Aucun pourcentage de marché n’est déduit de ce standard.

Validation : 1 130 tests / 95 fichiers réussis ; trois tests remplacent dix tests de l’ancien score. Lint et compilation réussis. Cinq langues et quatre largeurs testées, états inconnus, indépendance CPE/valeur, ajustements positifs/négatifs, justification manquante et entrées invalides. Un débordement préexistant du titre allemand de la valorisation a été corrigé par retour à la ligne du groupe titre/badge.

## Valeur résiduelle après rénovation et coûts automatiques

La valeur résiduelle repose désormais sur une hypothèse de valeur après travaux, des devis TTC, honoraires, financement, provision choisie et aides confirmées. Les valeurs principales sont vides au départ ; aucune aide de 40 000 EUR n’est préremplie. Le dossier et la date de valeur doivent être référencés. Le résultat est présenté comme une sensibilité aux coûts, pas comme une décote de marché démontrée ou une conformité EVS/CRR. Le besoin de vérifier calendrier, actualisation et autres coûts est explicite.

La fonction refuse coûts négatifs/non finis, valeur nulle, provision hors de 0–100 % et aides supérieures au budget, au lieu de plafonner silencieusement ces dernières. Une valeur résiduelle négative reste visible. Exemple : 800 000 EUR de valeur après travaux ; 80 000 + 8 000 + 3 000 EUR de coûts ; provision 10 % = 9 100 EUR ; budget 100 100 EUR ; solde 699 900 EUR sans aide ou 739 900 EUR avec 40 000 EUR confirmés. Le changement des étiquettes CPE ne modifie aucun coût.

L’ancien estimateur déduisant les travaux, leurs prix et leur durée d’un saut de classe et d’une surface habitable est supprimé, ainsi que ses deux usages. Sur la page d’estimation, un renvoi général accessible sans connexion conduit au comparateur de rénovation documenté. Les détails d’estimation restent soumis au contrôle de connexion existant. Le texte d’aide automatique « jusqu’à 62,5 % » n’est plus affiché dans ce bloc.

Validation : 1 127 tests / 94 fichiers réussis ; ajout de trois tests sur les coûts/grants/invalides, suppression de six tests de l’estimateur sans source. Compilation et lint réussis. Cinq langues, quatre largeurs, budgets, aides excessives, montants négatifs et liens localisés contrôlés. Aucun nouveau PDF ni transfert automatique vers la réconciliation. La première vérification du lien a révélé qu’il était dans le bloc protégé : le renvoi général a été déplacé en dehors, sans modifier le contrôle d’accès.

## Disponibilité HTTP — contrôle transversal

Un contrôle en lecture seule des 160 routes statiques sans paramètre ni groupe de route a été effectué en production. Aucune réponse 4xx/5xx ni erreur réseau. Ce contrôle ne valide pas les calculs, l’authentification ou les parcours des routes dynamiques ; la revue métier reste ouverte.

## Terme et réversion — rendement équivalent

Le rendement équivalent était égal au loyer de marché divisé par la valeur : ce rapport est le rendement réversionnaire simple. Il est désormais résolu comme le taux commun actualisant les loyers en place et la réversion vers la même valeur. Le rendement initial simple et le rendement réversionnaire restent affichés séparément, hors frais d'acquisition. Convention explicite : loyers annuels à terme échu, années entières et réversion perpétuelle constante ; hypothèses de départ illustratives à justifier.

Exemple indépendant : 36 000 EUR pendant cinq ans au taux de terme de 4 %, puis 42 000 EUR capitalisés à 5 % et différés cinq ans : valeur 818 427,58 EUR ; rendement équivalent 4,9738 %, réversionnaire 5,1318 %, initial 4,3987 %. Le calcul accepte le terme nul et la réversion immédiate, refuse les durées fractionnaires et les valeurs invalides. La réconciliation reçoit la valeur calculée et efface cette entrée lorsque le scénario devient invalide.

Référence méthodologique : [RICS, APC valuation competency advice](https://ww3.rics.org/uk/en/journals/property-journal/apc-valuation-competency-advice.html). Validation : 1 131 tests / 94 fichiers réussis, compilation et lint réussis ; cinq langues et quatre largeurs, restitution des flux, taux nuls, loyer nul, durée nulle, invalides et transfert vers la réconciliation contrôlés. Aucun nouveau PDF.

## Estimation — provenance des informations complémentaires

Retrait des cinq comparables fictifs calculés autour du résultat de l'estimation et datés comme des transactions. Retrait de la courbe communale obtenue en multipliant une série nationale par le prix ajusté du bien, ainsi que du profil démographique sans provenance vérifiable par valeur. Les références communales officielles et le calcul déjà audités le 8 septembre restent utilisés ; aucune nouvelle série n'est inventée.

Un bloc public explique l'absence de ventes individuelles et de série historique communale dans ce résultat et les éléments nécessaires à une expertise. Il renvoie à STATEC pour les statistiques et aux outils bancaires contrôlés pour préparer le financement. Le crédit à 3,3 %, les charges fixes de 250 EUR et l'impôt de 15 EUR par mois ne sont plus présentés comme un budget du bien ; les frais réels à ajouter sont explicités. Le contrôle de connexion des détails est conservé.

Source vérifiée : https://data.public.lu/fr/datasets/prix-de-vente-des-appartements-par-commune/ — publication du 25 juin 2026, données communales agrégées, période avril 2025 à mars 2026. Validation : compilation et lint réussis, cinq langues et quatre largeurs, absence des anciens blocs et navigation bancaire localisée contrôlées. Les formules et le PDF d'estimation ne sont pas modifiés par ce lot.

## Estimation — historique local et liens partagés

L'historique JSON est validé avant utilisation : forme du tableau, champs textuels, date, valeurs positives finies, identifiants uniques et limite de 50 entrées. Une corruption n'écrase pas l'original. Les entrées lisibles restent consultables, les modifications sont bloquées et un téléchargement restitue le contenu original exact avant une éventuelle suppression confirmée. Les erreurs de quota ou d'accès au stockage sont signalées ; l'interface ne prétend plus avoir enregistré une modification qui a échoué.

Les liens partagés choisissent une commune exacte ou une recherche non ambiguë, jamais la première proposition d'une liste ambiguë. Les textes de récupération et de suppression sont traduits dans les cinq langues. Validation : 1 135 tests / 95 fichiers réussis, compilation et lint réussis ; cinq langues, quatre largeurs, export exact, annulation puis confirmation de suppression, ajout/suppression, lien ambigu et échec de stockage contrôlés dans des sessions de navigateur de test isolées.

## DCF — revenu de sortie, hypothèses et entrées invalides

Correction du revenu de sortie : les loyers et charges de l'année N+1 sont projetés séparément à leurs taux respectifs. L'ancien calcul appliquait l'indexation des loyers au NOI de l'année N, donc aussi aux charges, même si leur progression différait. Exemple indépendant : loyer initial 10 000 EUR, vacance 10 %, charges 2 000 EUR, croissance respective 10 % et 20 %, horizon deux ans : NOI 7 000 puis 7 500 EUR, NOI de sortie 8 010 EUR ; capitalisation 10 %, frais 10 %, produit net 72 090 EUR. Avec actualisation nulle : valeur 86 590 EUR.

Les flux annuels et la revente sont explicitement en fin d'année. Les valeurs initiales sont des exemples ; les travaux, financement, fiscalité et acquisition non modélisés sont signalés. Le TRI établi à partir du prix DCF lui-même est retiré de l'affichage : il retrouve par construction le taux d'actualisation pour les flux conventionnels et ne constitue pas une rentabilité indépendante. L'API conserve ce taux pour les flux conventionnels et renvoie null si des pertes intermédiaires rendent cette lecture inappropriée. La fonction IRR partagée avec d'autres outils n'est pas modifiée.

Validation des montants, taux, durée entière de 1 à 50 ans et revenu de sortie positif nécessaire à cette capitalisation. Les saisies vides et invalides ne produisent plus de résultat, y compris via l'API (400). Les taux de la matrice de sensibilité conservent leur précision ; le graphique en proportions qui devenait trompeur avec des flux négatifs est retiré. La valeur est transmise après calcul à la réconciliation et effacée quand le scénario devient invalide.

Référence : https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/discounted-cash-flow-valuation . Validation : 1 139 tests / 95 fichiers, compilation et lint réussis ; cinq langues, quatre largeurs, calcul indépendant, taux nul, champ vide, durée fractionnaire, sortie négative et API vérifiés. Aucun nouveau PDF.

## Valeur prudentielle — suppression des assimilations réglementaires

L'ancien calcul retranchait trois pourcentages par défaut (5 + 3 + 2 %) puis présentait le solde comme une MLV et fournissait une grille universelle de pondérations CRR2. Les données saisies ne permettent ni une évaluation prudentielle réglementaire ni une détermination du risque de crédit. Le règlement (UE) 2024/1623 a notamment modifié les articles 124–126 et 229 ; les régimes et conditions ne sont pas représentés par cette ancienne grille.

Le nouvel onglet permet une sensibilité additive documentée de la valeur issue de la réconciliation : trois décotes initiales nulles, référence et justification requises, total limité à 100 %, résultat identifié comme scénario non réglementaire. Aucun prêt maximal ni pondération de risque n'est inventé. Les exigences d'expertise indépendante, critères conservateurs, plafonds applicables et dossier bancaire sont expliquées sans prétendre les valider automatiquement. Aucun transfert automatique vers le rapport.

L'API authentifiée /api/v1/mlv conserve son chemin et ses champs numériques historiques pour compatibilité, mais marque explicitement le résultat non réglementaire et la méthode documentée. ltvBands est désormais vide ; les mentions de conformité et bases légales présentées comme certification sont retirées. L'authentification et la journalisation restent en place. Les corps null/tableaux et montants invalides sont refusés par 400.

Sources : https://eur-lex.europa.eu/eli/reg/2024/1623/oj ; https://www.eba.europa.eu/publications-and-media/publications/asset-side-0 . Validation : 1 144 tests / 96 fichiers réussis, compilation et lint réussis ; cinq langues, quatre largeurs, référence obligatoire, calcul 840 000 × (1 − 10 %) = 756 000 EUR, limite 100 %, invalides et absence de grille contrôlés. Trois tests de l'API utilisent une authentification simulée dans un environnement isolé, sans appel authentifié réel ni modification de données de clients.

## Présentation de l'API bancaire

La page /api-banques et ses cinq versions linguistiques décrivent désormais le contrat réellement implémenté : URL https://tevaxia.lu/api/v1/estimation, vrais champs de requête et enveloppe success/data/meta. L'exemple de réponse inventant nombre de comparables, précision, LTV recommandé et MLV est supprimé. Les annonces non démontrées de conformité TEGOVA, erreur inférieure à 8 %, latence inférieure à 200 ms, hébergement LU/EU, conservation garantie de 90 jours et délais garantis de mise à jour sont retirées.

Les limites de l'estimation communale et de la sensibilité prudentielle sont exposées. Les conditions d'intégration, confidentialité et service sont à documenter ; la journalisation observée dans le code est décrite sans prétendre valider l'ensemble du traitement des données. Les métadonnées sont traduites. Validation : compilation et lint réussis, cinq langues et quatre largeurs, vrais champs, liens localisés et métadonnées contrôlés. Aucune formule modifiée par ce lot. La documentation OpenAPI et l'endpoint batch font l'objet du lot suivant.

## Estimation API — contrat unitaire, batch et OpenAPI

Un validateur commun aligne les paramètres par défaut et les erreurs des endpoints unitaire et batch. Les types JSON sont contrôlés sans coercition : booléens textuels, champs inconnus, anciennes clés d'ajustement non reconnues, classes sans hypothèse dans ce modèle et maisons sont refusés au lieu de produire un calcul avec un paramètre ignoré. Les propriétés facultatives omises utilisent les valeurs documentées. A+, H, I et classe inconnue ne sont pas assimilées à D ; leur intégration nécessite un choix méthodologique distinct.

Le batch valide son corps même s'il est null, conserve les index et détaille les échecs par ligne ; sa méthode et ses limites sont identiques à celles de l'endpoint unitaire. Un même appartement avec les mêmes entrées renvoie exactement le même résultat. L'authentification et la journalisation sont préservées.

OpenAPI 1.1.0 corrige les champs, énumérations, valeurs par défaut et limites des schémas estimation, batch, sensibilité historique MLV et DCF annuel. Les promesses de certification, exemple de MLV avec champs inexistants et description du DCF comme multi-locataires sont retirés. Les autres endpoints de la spécification restent à revoir. La documentation web explique le contrat strict, les succès partiels et la vérification de response.ok ; ses métadonnées sont reprises dans les cinq langues. La clé sandbox publique ne déborde plus sur mobile.

Validation : 1 148 tests / 97 fichiers réussis, compilation et lint réussis. Un test lit directement le YAML publié et soumet son exemple, ses énumérations et ses valeurs par défaut au vrai traitement avec authentification simulée. Contrôles de types invalides, corps null, communes ambiguës, concordance unitaire/batch et succès partiel. Cinq langues, quatre largeurs, métadonnées, spécification servie et maintien de la réponse 401 sans clé vérifiés. Aucun appel avec une clé de client.

## Capitalisation directe — revenus, ratios et invalides

Les montants, taux, ERV facultative et limites numériques sont validés. Un taux nul, un revenu net non positif ou un dépassement numérique ne produit plus une valeur présentée comme exploitable. Les sensibilités à des taux impossibles sont omises au lieu d'afficher zéro. Le formulaire transmet sa valeur après calcul et efface l'entrée de réconciliation lorsque le scénario devient invalide.

Les bases sont explicites : vacance sur le loyer brut ; gestion et provision sur le brut avant vacance ; autres charges annuelles. Exemple indépendant : 10 000 EUR de loyer brut, vacance 10 %, charges fixes 1 000 + 200 + 100 EUR, gestion 5 % et provision 1 % : charges totales 1 900 EUR, NOI 7 100 EUR, capitalisation à 5 % = 142 000 EUR. Les ratios brut/net sont distingués ; le ratio ERV après vacance reste avant charges. L'ERV vide signifie inconnue, zéro signifie un loyer de marché nul. Des loyers égaux ne sont plus qualifiés de surloyer.

Le contrat OpenAPI de capitalisation décrit les vrais paramètres et fractions de taux, et son accès public actuel. Les champs historiques de ratios de l'API conservent leur formule documentée. Une protection contre l'infini est également ajoutée au DCF pour un taux de sortie extrêmement petit.

Validation : 1 153 tests / 97 fichiers réussis, compilation et lint réussis. Cinq langues, quatre largeurs, NOI, ERV vide/nulle/négative, taux nul, champs vides, transfert et effacement en réconciliation, API valide/400 contrôlés. Aucun nouveau PDF dans ce lot.


## Réconciliation et cohérence des rapports

La pondération normalise uniquement les méthodes disponibles et retenues ; poids non finis, négatifs ou supérieurs à 100 refusés. Une absence de méthode ne devient plus une valeur immobilière fictive de 750 000 EUR. La valeur centrale et les poids persistent entre réconciliation et sensibilité prudentielle et alimentent le PDF, le DOCX, la sauvegarde et les données de partage. Aucun export n'est proposé lorsque le résultat est absent ou invalide. Une signature antérieure n'est plus réutilisée si son contenu de calcul a changé. Les parcours externes de signature et de partage n'ont pas été exécutés avec des données réelles.

Les faux seuils EVS de dispersion, jauges de confiance fondées sur le seul nombre de méthodes, récits automatiques de conformité et sensibilités arbitraires sont supprimés de ce parcours. Les variations basse et haute sont explicitement arithmétiques, facultatives et non exportées. La note de travail doit être reprise dans le dossier final par le rédacteur. Les rapports ne déclarent plus automatiquement indépendance, conformité ou prime/décote universelle liée au CPE.

Une erreur d'unité est corrigée dans le PDF : le prix moyen au m² des références était divisé une seconde fois par la surface du bien. Les montants des rapports conservent désormais deux décimales, comme l'écran. Les quatre modèles utilisent la même valeur pondérée et affichent les poids effectifs.

Validation : 1 156 tests / 97 fichiers réussis ; compilation et lint réussis. Parcours dans cinq langues et quatre largeurs : deux valeurs 840 000 et 86 590 EUR, pondérations 25/75, résultat 274 942,50 EUR ; transfert prudentiel identique, poids conservés, zéro/vides/invalides et retrait des exports contrôlés. Quatre PDF fictifs totalisant 32 pages générés, textes vérifiés et toutes les pages inspectées visuellement ; DOCX généré et contenu XML contrôlé. Les autres parcours de rapports et la conservation des saisies propres à chaque méthode restent à examiner.


## Comparaison — références documentées et validation

Le formulaire n’invente plus un comparable en multipliant une moyenne communale par la surface et en lui attribuant le mois courant comme date de vente. Chaque nouvelle référence est vide ; adresse, source vérifiable, mois de vente non futur, prix, surface et justification sont requis. Les statistiques d’appartements existants restent un repère distinct, sans application automatique aux maisons, terrains ou locaux professionnels. Les repères de quartier et guides d’ajustement non vérifiés sont retirés de ce parcours.

Le calcul utilise des ajustements additifs et des poids relatifs explicites. Surfaces/prix non positifs, nombres non finis, poids hors 0–100, poids tous nuls et prix ajustés non positifs sont refusés. Un poids nul exclut la contribution de la référence. Aucun arrondi intermédiaire n’est appliqué lors du transfert PDF. Le calcul central réagit à la surface même lorsque l’onglet comparaison est fermé. Les références incomplètes ne sont pas envoyées aux exports ; dates, sources et justifications des références valides sont reprises dans les PDF et DOCX.

Source méthodologique : https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/comparable-evidence-in-real-estate-valuation (première édition toujours applicable pendant la consultation de la deuxième édition). Le logiciel ne certifie pas la réalité des ventes saisies.

Validation : 1 160 tests / 97 fichiers réussis, compilation et lint réussis. Exemple indépendant : 600 000/75 m² ajusté de +10−5 %, poids 1, et 400 000/60 m² sans ajustement, poids 3 ; surface évaluée 90 m², résultat 639 000 EUR. Cinq langues, quatre largeurs, références vides, invalides, sources et date requises, liaison réconciliation et changement de surface depuis un autre onglet contrôlés. DOCX téléchargé dans le navigateur avec montant, dates et sources vérifiés. Quatre PDF de test, 32 pages, régénérés avec une référence descriptive longue et toutes les pages inspectées.


## Valorisation — conservation des saisies pendant la session

Les méthodes visitées restent montées et masquées lors du changement d’onglet. Le passage calculateur/rapport conserve également les formulaires et le brouillon. La capitalisation directe et le terme/réversion ont désormais des résultats séparés ; le dernier onglet de revenu consulté détermine la méthode retenue, identifiée dans la réconciliation et les libellés exportés. Ouvrir une autre méthode ne réinitialise plus les saisies précédentes.

Le bouton Réinitialiser efface maintenant tous les formulaires du parcours : méthodes, notes, scénarios, brouillon, signatures, références, résultats et paramètres généraux reviennent à leur état initial. Ce maintien de saisie concerne la session de page ; il ne promet pas une sauvegarde durable après rechargement ou fermeture.

Validation : compilation et lint réussis ; parcours dans cinq langues et quatre largeurs. Loyers, taux, notes et brouillon conservés après plusieurs allers-retours ; valeurs directe et terme/réversion distinctes ; DCF conservé ; réinitialisation des champs et retrait des anciens exports vérifiés. Aucune formule numérique modifiée par ce lot.


## Périmètre de valorisation et export réel du brouillon

La page et ses métadonnées, dans les cinq langues, ne promettent plus une conformité automatique TEGOVA/EVS. Le sélecteur de base qui changeait seulement l’étiquette en loyer, liquidation ou MLV sans changer les calculs est retiré du calculateur. Le périmètre est un scénario indicatif de valeur en capital. Le type d’actif identifie le dossier sans imposer des taux ; les fourchettes de référence non justifiées, décotes MLV automatiques et score de conformité issu du remplissage sont retirés. Une surface vide, nulle, non finie ou supérieure à 10 millions de m² bloque réconciliation et exports de calcul.

Le brouillon de dossier dispose maintenant de son propre export HTML lisible et imprimable. Il reprend les valeurs actuelles des champs, les commentaires, les cases cochées ou non, les douze sections même repliées et les références de comparaison validées. Les PDF/DOCX de calcul sont explicitement distincts du brouillon rédactionnel. Le choix d’annexes constitue une liste de pièces à joindre : aucun fichier n’est attaché automatiquement.

Les états inconnus ne sont plus préremplis comme des faits : qualification REV, indépendance, compétence, six déclarations de certification, classe D, année 1990, état bon, propriété pleine, occupation libre et valeurs de conclusion sont supprimés comme valeurs par défaut. Les classes A+, H et I sont proposées avec un état non renseigné. Une valeur manuelle nulle n’est plus remplacée par la réconciliation. Le brouillon ne présente plus celle-ci comme une valeur CRR ni comme un financement à 80 %. Les boutons qui inventaient des faits de voisinage, d’urbanisme, d’ESG ou une incertitude sans données suffisantes sont retirés de ce parcours.

Validation : compilation et lint réussis ; cinq langues et quatre largeurs contrôlées. Export HTML téléchargé pour chaque langue, douze sections présentes, texte d’une section repliée conservé, source de comparaison présente, champs inconnus et cases non précochées vérifiés. Une saisie contenant des balises script reste du texte échappé ; le fichier ne contient ni script ni contrôle interactif. Impression de contrôle du brouillon : 17 pages inspectées visuellement. Les dernières corrections de libellés retirent des références normatives impropres et distinguent la case capitalisation directe de terme/réversion. Ce lot ne constitue pas une validation professionnelle des déclarations de l’utilisateur.


## DCF multi-locataires — flux mensuels déterministes et exports alignés

Le moteur abandonne les tirages aléatoires et les loyers annuels entiers pour les baux partiels. Les mois de début et fin sont inclus, la franchise et la contribution d’aménagement suivent le début réel du bail. Le loyer déclaré est courant à la date de valeur (initial pour un bail futur), sans réindexation rétroactive. Les paliers futurs sont appliqués à leur échéance. Une date de break déclarée devient une hypothèse explicite de sortie exercée. Après sortie, le loyer attendu combine ERV, probabilité d’occupation et vacance, sans seuil artificiel à 80 % et sans double perte.

Les remboursements de charges sont compensés par une dépense identique. Les charges fixes et la réserve CAPEX sont déduites ; la valeur terminale utilise le flux récurrent réellement projeté en N+1. Les contributions d’aménagement connues en N+1 sont déduites ponctuellement. Le périmètre précise que les changements ultérieurs ne sont pas projetés et que ce calcul ne mesure pas un rendement d’investissement. Le TRI circulaire, les scénarios aléatoires et les indications automatiques non étayées sont retirés.

Le formulaire démarre sans baux inventés ; un exemple fictif reste disponible sur demande. Les champs vides ou incohérents bloquent le calcul et ses exports. Import CSV atomique avec guillemets, décimales à virgule et zéros conservés, dates et paliers validés. Les CSV de baux et flux mensuels et le PDF utilisent le même moteur. Le PDF détaille les hypothèses, les baux et les flux annuels ; ses libellés généraux historiques restent en français, les explications du modèle sont traduites. Les cinq interfaces et métadonnées sont mises à jour.

Validation : 1 172 tests dans 98 fichiers, compilation et lint réussis. Parcours dans cinq langues et quatre largeurs (320 à 1440 px), import invalide sans remplacement de la liste, champs invalides sans résultat et téléchargements contrôlés. Cas indépendant juillet-décembre : 6 000 € de loyers, 2 000 € de franchise, 2 400 € d’aménagement, flux net 1 600 €, valeur 121 600 € à taux d’actualisation nul et taux de sortie 10 %. Les 600 € de remboursements de charges restent neutres ; une réserve CAPEX de 1 000 € réduit la valeur à 110 600 €. Cinq PDF de quatre pages inspectés visuellement, sommes du CSV vérifiées indépendamment.


## Projection mensuelle STR — calendrier, nuitées et portée statistique

Le revenu historique conserve désormais les nuitées déclarées, y compris zéro. Si elles sont absentes, l’estimation utilise l’occupation et les jours réels du mois, années bissextiles comprises. Les projections suivent également le calendrier. Le périmètre est un logement disponible tous les jours ; il ne convient pas à une agrégation de plusieurs unités ou à une disponibilité partielle. Les recettes sont brutes avant charges, commissions et fiscalité.

Import CSV atomique : mois uniques consécutifs, dates, montants, occupation, pourcentages explicites (1 % = 0,01), décimales à virgule avec séparateur point-virgule et nuitées entières contrôlés. Un fichier invalide ne remplace pas les données existantes. L’exemple est déterministe, entièrement fictif, identifié à l’écran et dans le CSV ; aucune attribution AirDNA/observatoire non étayée n’est conservée dans son code.

Les mentions de fiabilité déterminées seulement par la longueur de l’historique et de backtest sur des ajustements internes sont retirées. À partir de 24 observations, le modèle utilise Holt-Winters additif à paramètres fixes ; entre 6 et 23, une moyenne constante sans tendance. La fourchette est une variation arithmétique de revenu explicitement choisie, initialement nulle, sans probabilité ni intervalle à 95 %. Le besoin de saisons complètes pour initialiser la saisonnalité est documenté par le NIST : https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc435.htm ; cette référence ne valide pas la précision du modèle ni ses paramètres fixes.

Le CSV indique jours, nuitées, origine déclarée/estimée/projetée, données utilisateur/démonstration et variation. Les cinq interfaces et métadonnées sont alignées. La bannière globale de cookies permet maintenant le retour à la ligne de ses boutons sur mobile ; son lien de confidentialité respecte la langue courante.

Validation : 1 176 tests dans 98 fichiers, compilation et lint réussis. Cas indépendant janvier-juin 2024 : revenu total 7 000 €, février estimé à 1 450 € sur 29 jours, mars déclaré zéro, juillet projeté à 1 550 €. Variation ±10 % : 1 395–1 705 €. Contrôles navigateur et CSV dans cinq langues et quatre largeurs, conservation après import invalide, blocage des hypothèses invalides et identification de la démonstration.


## Prévisions hôtelières — données réelles, RevPAR et scénarios

Le parcours ne propose plus d’enregistrer un historique fictif dans un hôtel. Les anciennes lignes forecast_seed sont exclues des calculs et signalées sans être supprimées. Les imports CSV et saisies manuelles sont validés intégralement avant écriture : dates réelles non futures, doublons, occupation 0–100 %, ADR/RevPAR finis et non négatifs, pourcentages explicites et décimales à virgule. La fonction d’enregistrement refuse les sources de démonstration et exige une session authentifiée. Les droits de base existants restent en place ; aucune migration ni modification de dossier réel n’a été effectuée.

Le RevPAR est cohérent avec occupation × ADR ; un RevPAR fourni en contradiction au-delà de deux centimes est refusé lors de l’enregistrement. Sa projection combine occupation et ADR projetés, au lieu d’une troisième série indépendante. Définition professionnelle : https://www.costar.com/products/str-benchmark/resources/glossary et glossaire STR https://str.com/sites/default/files/us_hotel_forecast_review_sample.pdf. Les séries nécessitent au moins 14 jours uniques et consécutifs, sans valeur manquante pour la métrique retenue ; les jours manquants ne sont plus comprimés comme des jours adjacents.

Le prétendu backtest MAPE interne et les bandes à 95 % sont retirés de la présentation. La bande est une variation arithmétique choisie, initialement nulle, bornée selon la métrique. La méthode et ses paramètres fixes sont explicités ; aucune précision prédictive n’est garantie. Les moyennes sont identifiées comme des moyennes simples des jours, non des ratios pondérés par chambres. Les champs manuels ne préremplissent plus 75 % et 120 € comme des faits ; les montants affichent les centimes. Le changement d’hôtel vide immédiatement les anciens chiffres et ignore les retours de requêtes dépassées.

Validation : 1 181 tests dans 98 fichiers, compilation et lint réussis. Cas constant : occupation 50 %, ADR 100 €, RevPAR 50 €, variation ±10 % = 45–55 €. Tests de cohérence des projections, dates impossibles/futures, doublons, jours absents, valeurs nulles/invalides, données fictives et validation avant persistance. Dix rendus isolés de composant (cinq langues, séries complètes et incomplètes), quatre largeurs, formulaires et tableaux vérifiés ; capture française inspectée. Ces essais utilisent des fixtures locales, sans authentification à un dossier client et sans écriture de données réelles. La vérification des écritures de bout en bout avec un compte client réel n’a pas été effectuée.

Contrôle public : barrière de connexion et liens localisés préservés, descriptif du hub aligné dans les cinq langues.


## Carte et communes — population officielle RNPP

Les chiffres démographiques arrondis et estimés sans références par ligne sont remplacés par l’extrait CTIE du registre national des personnes physiques au 1er juillet 2026, publié le 6 juillet. Source officielle CC0 : https://data.public.lu/fr/datasets/registre-national-des-personnes-physiques-rnpp-population-par-commune-population-per-municipality/. L’extrait est administratif ; il n’est pas présenté comme une statistique STATEC de population résidente.

Les 100 communes, noms et quatre effectifs (majeurs/mineurs par sexe) concordent entre les versions CSV et XML officielles téléchargées indépendamment. Population = majeurs + mineurs, total des 100 lignes : 693 913. Exemples : Luxembourg 138 215, Esch-sur-Alzette 38 323, Redange/Attert 3 170. Le nom Redange du jeu immobilier est rapproché explicitement du code 0809. Les noms inconnus ne reçoivent aucun repli national ou estimation.

Le même composant affiche population, majeurs, mineurs, date et lien source sur la carte et les fiches communales, dans les cinq langues. Les revenus médians, taux d’emploi, proportions d’étrangers, densités et croissances non justifiés sont retirés. Les helpers cantonaux inutilisés de l’ancien jeu estimatif sont supprimés. Le fichier source original Windows-1252 est conservé avec empreinte SHA-256, métadonnées et désactivation de la conversion de fins de ligne pour préserver son intégrité sur Windows et en CI Linux.

Validation : 1 177 tests dans 98 fichiers, compilation et lint réussis. Les tests couvrent 100 codes uniques, additions, somme nationale, exemples indépendants, source/empreinte, correspondance de toutes les communes immobilières et absence de champs économiques inventés. Parcours carte et trois fiches dans les cinq langues et quatre largeurs. Le nom Grevenmacher de la carte par canton peut maintenant se couper sur petit écran, supprimant un débordement à 320 px.


## Indices immobiliers — série annuelle officielle et observations communales

Les graphiques partagés par /indices, /carte, les fiches /commune et /marche utilisent désormais les observations Eurostat prc_hpi_a pour LU, achats TOTAL, indice annuel moyen I15_A_AVG et variation RCH_A_AVG. La réponse source, mise à jour le 2 juillet 2026, est conservée dans docs/sources. Elle couvre les achats de logements neufs et existants par les ménages : https://ec.europa.eu/eurostat/web/housing-price-statistics. Tableau : https://ec.europa.eu/eurostat/databrowser/view/prc_hpi_a/default/table?lang=en.

Le graphique d’indice utilise les niveaux publiés : 100 exactement en 2015, 165,14 en 2025. Il ne cumule plus les pourcentages annuels arrondis, et n’applique plus la hausse 2015 à sa propre année de base. Les variations publiées comprennent -9,1 % en 2023, -5,2 % en 2024 et +1,6 % en 2025. Aucune observation annuelle 2026 n’est inventée. La portée nationale, les années, les données tabulaires et la source sont disponibles dans les cinq langues.

La page /indices retire le composite de santé du marché à composantes non étayées, les classements de hausses/baisses et les tendances déduites de l’écart prix annoncés/prix enregistrés. Cette différence entre échantillons ne mesure pas une évolution dans le temps ni une décote négociable. Le prix moyen national précédemment obtenu par moyenne simple des communes n’est plus affiché. La page présente l’indice national officiel et les observations communales de transactions existantes avec leur période, recherche, tri et CSV de la sélection. Les données absentes restent absentes, sans zéro fictif, et se trient en fin de liste. Les métadonnées ne promettent plus un indice mensuel ou des tendances locales non mesurées.

Validation : 1 180 tests dans 99 fichiers, compilation et lint réussis. Chaque point est comparé à la réponse JSON-stat source, avec contrôle des unités, du pays, du champ TOTAL, de l’année de base et de l’absence de 2026. Vérifications navigateur dans cinq langues, quatre pages consommatrices et quatre largeurs, tableaux, recherche, tri, lien communal localisé et CSV téléchargé.

Limite de ce lot : le module d’ajustements temporels ancien demeure dans un composant orphelin non utilisé par les pages ; il n’alimente plus les graphiques publics. Les autres indicateurs du marché commercial et les commentaires locaux font l’objet de la suite de la revue.


## Carte, fiches communales et PDF — observations distinctes et valeurs absentes

La carte et les fiches communales présentent maintenant le même bloc d’observations : moyennes enregistrées existant/VEFA, prix annoncés, loyers annoncés et leurs effectifs respectifs, période et liens directs vers les sources de l’Observatoire de l’Habitat. Les prix absents sont « non publiés », tout en conservant les effectifs disponibles. Les montants sont affichés avec centimes.

Le score de marché et les commentaires automatiques attribuant une qualité au volume de transactions ou une remise négociable à l’écart annonces/transacté sont retirés de ces pages. Le ratio loyer/prix brut est nommé comme tel : il combine des moyennes de biens différents et ne déduit pas vacance, charges, travaux, frais ou impôts ; il ne constitue pas le rendement d’un investissement précis. Une recherche sans résultat sur la carte n’affiche plus toutes les communes. Les liens vers estimation et valorisation respectent la langue courante.

Le PDF de carte reçoit les mêmes observations, libellés et dates que l’écran. Il ne présente plus le prix annoncé comme médiane, ni une décote artificielle de 15 % et un prix VEFA comme fourchette de valeur. Une moyenne non publiée n’est jamais remplacée par zéro, y compris sur la couverture. Les liens de sources sont cliquables. Les libellés et explications métier sont traduits en cinq langues ; le pied de page et l’avertissement commun historique restent en français.

Validation : compilation, lint et suite de tests réussis. Dix PDF (Luxembourg et Beaufort, cinq langues), trente pages inspectées visuellement ; montants, centimes, période, effectifs, mentions de données absentes et trois liens source vérifiés. Contrôles navigateur des deux communes et de la carte, cinq langues et quatre largeurs, retrait des scores, recherche inconnue et liens localisés. Les cartes de montants utilisent une colonne sur petit écran pour conserver les centimes lisibles avec le zoom général de 10 %. Aucun nouveau modèle financier n’est introduit : le bloc et le PDF exposent les observations existantes sans fabriquer de médiane ou d’intervalle.

### Scénarios de prix immobiliers — 9 septembre, 15:00
- Suppression de l’historique communal fictif interpolé depuis une ancienne série nationale et du CAGR associé. Suppression du prix de secours à 7 500 €/m².
- Prix et mois de départ déclarés, référence communale facultative avec période/source exacte, copie explicite et absence de prix respectée. Changer de commune efface la saisie précédente.
- Trois taux annuels constants déclarés, initiaux neutres à zéro, ordre et bornes contrôlés. Calcul exact prix × (1+taux/100)^(mois/12), sans arrondi intermédiaire. Aucune probabilité ni intervalle de confiance.
- Tableau mensuel accessible, affichage monétaire localisé à deux décimales, cinq langues et quatre largeurs de 320 à 1440 pixels. Libellés et métadonnées corrigés.
- Vérification : 1175 tests / 99 fichiers, build et lint réussis ; cinq parcours navigateur réussis (référence manquante, copie, changement de commune, capitalisation, champs vides/invalides et responsive).
- Lot communal précédent a654fa9 : CI 34351228936 réussie, déploiement dpl_CNgSody7KFBPkdZoysJjGmDvJHwo prêt, cinq parcours de production réussis.

### Page marché et export par commune — 9 septembre
- Résidentiel : huit observations, période/source, conservation des zéros publiés et des valeurs absentes, tri des valeurs manquantes en fin de liste dans les deux sens. CSV de la sélection avec sources. Liens localisés.
- PDF : export des communes séparément, suppression de la moyenne simple présentée comme nationale et du champ VEFA étiqueté « maisons ». Montants à deux décimales. Nouveau document en cinq langues, polices PDF standard pour éviter une corruption des caractères lors de générations successives ; cette correction concerne ce document, les autres générateurs restent à examiner sur ce point.
- Bureaux : six repères du rapport Cushman & Wakefield Office MarketBeat Q2 2026. Commerce : quatre repères du Retail MarketBeat H1 2026. Prix prime distingués des moyennes et take-up distingué des ventes. Chaque CSV précise période, source, URL, page et périmètre.
- Terrains : ventes retenues 2023/2024 (326/565) et variation hédonique 2022–2024 (−14,9 %) du rapport 19, p.5, publié le 10 octobre 2025. Suppression des prix par zone non justifiés.
- Logistique et macro : absence de série vérifiée explicitée, sans anciens loyers/stocks/taux non documentés ; accès aux séries BCL/STATEC. La bibliothèque historique market-data-commercial n’alimente plus la page publique.
- Rapports vérifiés : https://content.cushmanwakefield.com/api/public/content/85790d9d1da645ec8a369dfc2d0885c1?v=0ebfb4e7 ; https://content.cushmanwakefield.com/api/public/content/7bff92eb9e6f411abc223f57882307ca?v=0e941721 ; https://logement.public.lu/dam-assets/documents/publications/observatoire/rapport-analyse-19.pdf . Empreintes et pages dans docs/sources/commercial-market-references-2026-09-09.json.
- Contrôles : 1175 tests / 99 fichiers ; six onglets × cinq langues × quatre largeurs, filtres/tris et 20 CSV vérifiés. PDF de deux communes dans cinq langues (20 pages) plus export des 100 communes (102 pages), pages rendues et contrôlées visuellement, bornes et liens vérifiés.
- Scénarios de prix d88d481 : CI 34354070104 réussie, déploiement dpl_4T5cJbKyLJ6DwyyExEd1bCekU9AW prêt et cinq parcours de production réussis.

### Budget de construction documenté — 9 septembre
- Remplacement des coûts unitaires et pondérations prétendument STATEC/Batiprix, des majorations CPE automatiques et des honoraires par défaut par un bordereau de postes documentés. Dix-sept suggestions de libellés conservées, sans prix présumé.
- Quantité propre à chaque poste (unité/forfait, m², m³, m ou h), prix TTC, distinction travaux/frais, référence obligatoire. Surface brute facultative utilisée seulement pour le ratio final. Ajout/suppression de postes ; champ vide distinct de zéro.
- Montants calculés en centimes avec arithmétique entière et arrondi par ligne ; provision déclarée sur travaux uniquement, justification si positive. Aucune aide ni récupération de TVA automatique, total limité aux postes saisis.
- Nouveau CSV et PDF utilisant le même calcul, avec références, quantités, prix et hypothèses. PDF en polices standard, cinq langues, 15 pages rendues et vérifiées. Metadonnées et mentions d’intégration tarifaire sur accueil/pages promoteurs corrigées.
- Méthodologie primaire : https://statistiques.public.lu/fr/donnees/methodologie/methodes/economie-totale-prix/prix-construction.html ; l’indice mesure une évolution des prix, hors TVA et terrain, et ne constitue pas un devis.
- Vérification : 1180 tests / 100 fichiers réussis, build réussi, lint sans erreur (un avertissement existant dans calculateur-loyer). Cinq parcours navigateur et cinq CSV : 12,5 × 80,12 = 1001,50 € travaux, 200 € frais, 10 % aléas sur travaux = 100,15 €, total 1301,65 €. Cas vide/zéro/référence manquante et largeurs 320/390/768/1440 contrôlés.
- Marché bf64d1f : CI 34355538434 réussie, déploiement dpl_9mXNPPsXk4QyR17NGnmPax6MMEge prêt, cinq parcours de production réussis.

### VRD : métrés explicites et budget documenté — 9 septembre
- Suppression des prix unitaires présumés Batiprix/CTG/Creos, des valeurs de projet fictives et des coefficients pente/sol rocheux non justifiés. Neuf suggestions de lots conservées pour le classement.
- Bordereau TTC commun avec le budget de construction, prix et références requis ; aucune quantité/prix par défaut ne produit un résultat complet. Les dimensions d’un métré transféré restent dans le libellé.
- Calcul géométrique facultatif : longueur × largeur ; volume = longueur × largeur × épaisseur en cm / 100. Quantité arrondie à quatre décimales, bornes et valeurs invalides contrôlées. Aucune prétention au dimensionnement de réseaux/chaussée, ni foisonnement/compactage automatique.
- CSV et PDF réutilisent le moteur de totaux en centimes. Cinq PDF (15 pages) rendus et contrôlés. Les anciens générateurs ConstructionDoc/VrdDoc de ToolsPdf sont désormais sans appel depuis ces pages et restent hérités.
- Vérification : 1183 tests / 101 fichiers, build réussi, lint sans erreur (avertissement existant calculateur-loyer). Cinq parcours VRD et cinq parcours de non-régression construction réussis à 320/390/768/1440 px ; cinq CSV vérifiés. Cas : 100 × 6 × 20/100 = 120 m³ ; 120 × 22 = 2640 € TTC.
- Construction 110e281 : CI 34356811700 réussie, déploiement dpl_58h2QQ7HXktoEtdvsFSMPiyb1BNw prêt et cinq parcours de production réussis.


## Commandes PDF communes — contrôle du parcours et des erreurs
- Chargement de session et génération en cours désactivent les actions ; verrou synchrone contre les doubles générations.
- Fenêtre de connexion native accessible et traduite dans les cinq langues, lien de connexion localisé, fermeture par Échap et retour du focus.
- Échecs de génération, fichiers vides et fenêtres bloquées signalés sans exposer de détails techniques. Une fenêtre de prévisualisation fermée ou déjà naviguée n’est pas réutilisée.
- Validation : 1 183 tests / 101 fichiers, build de production, lint du composant ; fixture isolée des actions autorisées et parcours public réel dans les cinq langues / quatre largeurs. Aucun compte réel ni donnée client utilisé pour les tests authentifiés simulés.
- Ces contrôles portent sur la commande commune, pas sur l’exactitude de tous les rapports PDF encore à revoir.


## Bilan promoteur — recettes et coûts documentés, résiduel et bénéfice distincts
- Remplacement du modèle à coûts et honoraires présumés, financement sur une assiette erronée et calendrier VEFA fixe. Le nouveau bilan démarre sans chiffres : chaque recette/dépense, mois et référence doit être saisi.
- Terrain connu : bénéfice = recettes − dépenses − terrain − frais fixes/proportionnels d’acquisition ; écart à la marge cible distinct du bénéfice. Compte à rebours : budget après coûts, cible et frais fixes, puis prix compatible après frais proportionnels. Budget négatif conservé sans inventer de taxe négative.
- Arrondis monétaires au centime ; calcul des pourcentages en entiers. Recettes positives, autres montants explicitement nuls ou positifs, limites 200 lignes/120 mois et références obligatoires.
- Base économique déclarée : hors TVA effectivement récupérable, TVA non récupérable incluse. Pas de calcul automatique de droits, d’aides ou d’impôt sur le résultat. Les frais financiers sont les montants documentés de l’opération.
- Échéancier de budget, uniquement pour terrain connu, dépenses avant recettes dans chaque mois ; acquisition au mois du terrain. Le solde final rejoint exactement le bénéfice. Le déficit est celui de cette convention, pas un calcul de crédit/equity ni une trésorerie bancaire avec décalages de TVA.
- Export CSV avec références et soldes, dossier JSON complet et import validé atomiquement, PDF de tous les paramètres et lignes. Les anciens scénarios locaux ne sont ni écrasés ni présentés comme compatibles. Les anciennes commandes de partage et extraction liées au schéma incomplet ont été retirées de cette page ; les liens déjà émis restent sur leur lecteur historique.
- Textes d’accueil, descriptifs professionnels et métadonnées alignés ; suppression des annonces de TVA automatique, tornado et Gantt qui ne correspondent plus au calcul proposé.
- Sources : https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/valuation-of-development-property ; https://guichet.public.lu/fr/citoyens/logement/acquisition/aspects-contractuels/acquerir-bien-a-construire.html . Aucun label de conformité RICS n’est attribué au résultat.
- Validation : six tests métier dédiés, suite de 1 189 tests/102 fichiers ; parcours navigateur cinq langues/quatre largeurs, export/rechargement complet et rejet sans perte des dossiers invalides. Dix PDF, 35 pages rendues et inspectées visuellement, montants/références/limites de pages contrôlés.
- Cas chiffré : recettes 1 000 000 €, coûts 620 000 €, terrain 200 000 €, acquisition 24 000 € → bénéfice 156 000 €, cible 150 000 €, écart 6 000 €. En résiduel : budget 220 000 €, prix terrain 205 607,47 € avec frais proportionnels déclarés à 7 %.


## Chargement initial de session
- Abonnement aux événements d’authentification avant lecture de la session initiale ; un événement récent prend la priorité sur une réponse initiale tardive.
- Une erreur de lecture initiale est interceptée et libère l’état de chargement. Le démontage du composant désabonne et empêche les mises à jour tardives.
- Fixture React hors ligne du composant réel : session normale, rejet initial, connexion/déconnexion/rafraîchissement prioritaires, démontage et absence de promesse rejetée non traitée. Aucun compte réel utilisé. Suite 1 189 tests, lint du composant.


## Terres agricoles — suppression des prix présumés et série officielle
- Retrait de la grille région/qualité sans transactions identifiées, de la décote forfaitaire de bail 30 %, des valeurs bâtiments 150 €/m² et des coûts automatiques 80/45 €/m². Une cessation d’exploitation ne déclenche plus une démolition calculée.
- Calcul documenté : hectares × prix/ha + bâtiments conservés − démolition − remise en état ; chaque montant et le périmètre des droits/TVA doivent être explicités. Pas de valeur de marché certifiée ni de contrôle juridique de parcelle revendiqué.
- Conversion 1 ha = 10 000 m², surface à quatre décimales d’hectare, prix/coûts à deux décimales, arrondi monétaire en entiers au centime ; zéros explicites, données absentes bloquantes, résultats nets négatifs conservés.
- Série SER/LUSTAT DF_D2121 : 66 observations nationales 2003–2024, trois séries distinctes (arables, prairies, médiane combinée). Publication indiquée 23/08/2025, extraction 09/09/2026. Source liée par le portail ministériel : https://lustat.statec.lu/rest/data/LU1,DF_D2121,1.0/all .
- Périmètre : transactions d’agriculteurs, usages non agricoles exclus. Note officielle : hors TVA, frais de notaire inclus et, depuis 2015, TVA sur ces frais incluse. Aucune moyenne reconstituée, aucune projection 2026 et aucune application automatique à la parcelle.
- CSV et structure SDMX conservés avec SHA-256 et attributs Git de préservation des octets ; toutes les observations recoupées et labels lus dans CL_D2121_SPECIFICATION. Source de méthode : https://agriculture.public.lu/de/agrarstatistik/landwirtschaftliche-preise-und-indizes.html .
- Validation : cinq tests métier/source, suite 1 194 tests/103 fichiers, build et lint, cinq langues/quatre largeurs et CSV contrôlés. Cas 2,5 ha × 40 000,25 €/ha = 100 000,63 € ; +10 000 −2 000 −3 000 = 105 000,63 €.


## Compte d’exploitation hôtelier documenté
- Retrait du modèle par catégorie qui ajoutait recettes restauration/annexes, ratios de charges, croissance et réserve 4 % sans justificatifs, et présentait le résultat après réserve comme EBITDA.
- Nouveau compte d’une période déclarée de 1 à 366 jours ; jours calendaires réels, capacité disponible saisie et plafonnée à chambres × jours, chambres-nuits vendues cohérentes. Ratios indéfinis conservés comme tels en l’absence de dénominateur ; occupation zéro autorisée, plus de plancher 5 %/plafond 95 % inventé.
- Onze catégories obligatoirement documentées, y compris zéro : recettes chambres/F&B/autres, personnel départemental et général séparé des autres charges, management, produits/charges non opérationnels et réserve. Pas de salaires ajoutés une seconde fois dans les autres charges.
- GOP puis EBITDA avant réserve, puis EBITDA après réserve clairement séparés. Exclusions des intérêts, impôt sur résultat et amortissements explicites ; pas de certification USALI ou benchmark de solvabilité HVS/PwC.
- Export CSV avec unités de chaque compteur/ratio/montant, toutes les lignes et références. Le titre générique de colonne du CSV promoteur a également été corrigé (valeur plutôt qu’EUR pour des cellules contenant des pourcentages ou textes).
- Textes du hub, descriptifs professionnels, métadonnées et guide IA alignés. Les anciennes fonctions usali.ts ne sont plus utilisées par la page et restent uniquement dans les tests historiques.
- Sources : https://www.costar.com/products/str-benchmark/resources/glossary ; https://www.hftp.org/downloads/documents/usali/resources/usali_faqs.pdf .
- Validation : cinq tests dédiés, suite 1 199 tests/104 fichiers, cinq langues/quatre largeurs ; cas de février 2024 (29 jours), capacité réelle, zéro vente/disponibilité, pertes et données manquantes. Cas recettes 35 000 €, personnel 10 000 €, GOP 18 000 €, EBITDA 16 000 €, après réserve 14 000 €.


## Valorisation hôtelière — méthodes distinctes et preuves saisies
- Retrait de l’estimation des recettes/charges par catégorie, du taux et du prix/chambre présumés, de la moyenne automatique entre méthodes et de la fourchette ±15 %. Le calcul revenu/taux est désormais nommé capitalisation directe, pas DCF.
- Revenu annuel stabilisé et taux documentés sur un même périmètre de droits ; revenu nul/négatif conservé, sans assimiler absence de valeur par capitalisation à un bien valant zéro.
- Comparaison : transactions identifiées, sources, prix, nombres de chambres entiers, dates au plus tard à la date de valeur, ajustements justifiés et poids explicites. Calcul prix/chambre ajusté puis moyenne pondérée sans arrondis intermédiaires, appliquée aux chambres du sujet.
- Les deux méthodes peuvent être utilisées séparément ou affichées ensemble ; aucune réconciliation automatique. Droits immobiliers, mobilier et exploitation doivent être distingués.
- CSV des hypothèses, transactions, références, dates, poids normalisés, unités et résultats séparés ; les anciens liens déjà partagés restent des lectures historiques et ne sont pas recalculés par cette page.
- Sources : https://ww3.rics.org/uk/en/journals/property-journal/valuation-approaches-methods-models.html ; https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/discounted-cash-flow-valuation .
- Cinq tests métier ; suite 1 204 tests/105 fichiers. Cas 100 000 €/an à 5 % → 2 M€. Comparables 100 000 €/chambre +10 %, poids 1, et 120 000 €/chambre −5 %, poids 3 → 113 000 €/chambre, soit 2,26 M€ pour 20 chambres.
- Validation navigateur finale de la valorisation hôtelière : cinq langues/quatre largeurs, méthodes indépendantes, export CSV, transactions futures refusées et zéro poids bloquant ; build et lint passent.

## Couverture de dette hôtelière — revue du 9 septembre 2026

La page /hotellerie/dscr utilise désormais un emprunt à mensualités constantes documenté : capital, taux nominal annuel, durée entière en mois, frais mensuels et frais initiaux distincts. Le flux disponible annuel et son origine sont saisis explicitement ; il n'est pas assimilé automatiquement à l'EBITDA. Le scénario dégradé exige son propre flux et sa référence. Le LTV repose sur une valeur immobilière documentée, pas sur le coût du projet. Le seuil de DSCR appartient au dossier et ne vaut pas décision bancaire.

L'annuité présentée est annualisée sur douze mois ; l'échéancier regroupe les mois réellement remboursés, y compris la dernière période incomplète. Le flux de chaque période est réparti uniformément au prorata des mois, hypothèse explicitée. Un service nul produit un ratio indisponible ; les flux négatifs restent négatifs. La capacité mathématique résout la même formule d'annuité en déduisant les frais récurrents. Les frais initiaux sont séparés du DSCR récurrent et inclus dans le total payé. Les exports CSV conservent les hypothèses, références, unités et échéances.

Périmètre : prêt fixe à échéances de fin de mois, sans différé, ballon, remboursement anticipé ni taux variable. Ce modèle ne remplace pas les dates, arrondis et conventions contractuels. Référence de contexte : EBA, Guidelines on loan origination and monitoring (2020), sans seuil automatique présenté comme réglementaire.

Validation : 1 210 tests sur 106 fichiers, compilation et lint réussis ; navigateur dans cinq langues et quatre largeurs (320, 390, 768, 1 440 px), export CSV contrôlé. Cas de référence : 120 000 EUR sur 120 mois à taux nul = 1 000 EUR/mois ; flux 15 000 EUR/an = DSCR 1,25. Avec 100 EUR/mois de frais : service 13 200 EUR/an, capacité 108 000 EUR pour un seuil de 1,25 ; 200 EUR initiaux portent le total payé à 132 200 EUR. Cas sept mois, absence de prêt, champs manquants et flux négatifs vérifiés. L'ancien module dscr.ts, désormais sans consommateur public dans cette page, et les anciens liens partagés ne sont pas recalculés.

## Pré-acquisition hôtelière — revue du 9 septembre 2026

La page /hotellerie/pre-acquisition remplace les multiples EBITDA et prix par chambre non sourcés, la moyenne automatique de valorisations et le score go/no-go par un scénario de trésorerie documenté. Les flux avant dette sont saisis séparément pour 1 à 30 années complètes ; ils intègrent, sous la responsabilité du rédacteur et avec référence, charges, impôts, besoin en fonds de roulement et investissements. Ils ne sont pas assimilés automatiquement à l'EBITDA, ni extrapolés par des taux cachés.

Le financement initial est équilibré : prix + frais initiaux (financement compris) + investissements initiaux − dette = apport initial. Une dette supérieure au besoin est rejetée. Le prêt utilise les mensualités constantes vérifiées ; son service et ses frais cessent à l'échéance, même en cours d'année. La sortie en fin de dernière année utilise un prix et des frais/impôts documentés, puis déduit le capital restant après les échéances de l'année. Le prix de sortie n'est pas une estimation automatique de marché.

Les flux nets négatifs sont des apports complémentaires ; les flux positifs sont les distributions. Le multiple est distributions/apports cumulés, sans double comptage du capital initial. La VAN utilise le taux explicite des fonds propres. Le TRI est calculé par dichotomie uniquement pour une séquence partant d'un apport négatif et avec un seul changement de signe ; aucun chiffre n'est inventé pour plusieurs changements de signe, absence d'apport ou absence de racine dans le domaine numérique. Les modèles restent annuels, à flux de fin d'année, sans financement intrannuel automatique.

CSV : entrées, références, unités et échéances. JSON : sauvegarde complète et restauration validée avant remplacement du scénario ; fichier incompatible/invalide refusé sans effacer le travail courant. Les anciens enregistrements locaux ne sont ni effacés ni interprétés comme ce nouveau modèle. Aucun score ne vaut décision bancaire ou conseil d'achat. La présentation du module sur le hub est alignée.

Validation : 1 217 tests sur 107 fichiers ; lint et compilation finale réussis. Cas métier : prix 100 000 EUR, frais 10 000 EUR, investissements 10 000 EUR, dette 60 000 EUR à 0 % sur 24 mois ; apport 60 000 EUR, mensualité 2 500 EUR. Deux flux annuels de 40 000 EUR, sortie 110 000 EUR moins 10 000 EUR de coûts : distributions 120 000 EUR, multiple 2, gain 60 000 EUR. Tests de maturité 7/12/120 mois, frais, pertes, apports complémentaires, TRI absent et import incompatible. Les contrôles navigateur couvrent cinq langues, quatre largeurs et les exports CSV/JSON. Référence méthodologique de contexte : RICS, Discounted cash flow valuation ; aucun agrément RICS du logiciel n'est revendiqué. Ancien pre-acquisition.ts désormais sans appel dans la page publique, non refondu.

## E‑2 : dossier documentaire, sans score d'éligibilité

La page /hotellerie/score-e2 ne calcule plus de probabilité d'acceptation ni de diagnostic favorable/rejet probable à partir d'un ratio de capital, d'un revenu minimal présumé ou du nombre d'emplois. Le modèle précédent utilisait des seuils arbitraires (30/50/75 % de capital, cinq emplois, revenu x1/x2) qui ne peuvent pas remplacer l'examen des conditions E‑2.

Le nouveau parcours prépare le dossier d'un investisseur principal : nationalité conventionnée, nationalité de l'entreprise, origine/contrôle des fonds, engagement/risque, entreprise réelle, investissement substantiel, non-marginalité, développement/direction et intention de départ. Chaque rubrique débute à documenter ; les états « pièce renseignée » exigent une référence, sans que cette saisie atteste la validité du document. Aucun score ni avis automatique ne résulte d'un dossier rempli. Le périmètre exclut la prétention à couvrir toutes les conditions d'admission, les salariés et les familles ; les instructions consulaires et l'examen individuel restent nécessaires.

Sources officielles consultées le 9 septembre 2026 : Department of State, 9 FAM 402.9 (version CT:VISA-2190, 17 février 2026), sections 4 et 6, page Treaty Trader & Treaty Investor et liste des Treaty Countries. Le FAM précise l'absence de minimum universel en dollars et de pourcentages fixes pour le caractère substantiel ; la non-marginalité peut reposer sur une contribution économique significative et la capacité future est généralement appréciée dans les cinq années du début normal d'activité. La propriété conventionnée de 50 % et la capacité personnelle de contrôle sont distinguées. La page précise qu'une dette garantie par les actifs de l'entreprise ne constitue pas le capital à risque de l'investisseur.

Références : https://fam.state.gov/fam/09FAM/09FAM040209.html ; https://travel.state.gov/content/travel/en/us-visas/employment/treaty-trader-investor-visa-e.html ; https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/treaty.html . Le FAM a été récupéré directement sur le domaine officiel après échec de l'outil de lecture web ; aucun miroir USCIS non officiel n'a été retenu.

Exports CSV et JSON : neuf états et références, sans score ; import validé avant remplacement et conservation du dossier en cas d'erreur. Aucun document n'est transmis par cette page. Validation : 1 221 tests, 108 fichiers, compilation et lint réussis ; cinq langues, quatre largeurs, saisies de références, exports et import incompatible vérifiés. L'ancien e2-score.ts reste orphelin de la page, ses anciens tests ne constituent pas une validation juridique de ses seuils.

## Accès aux détails : clavier, langue et conservation des saisies

AuthGate masque maintenant ses commandes au clavier et aux technologies d'assistance avec inert/aria-hidden tant que la session est en cours de vérification ou anonyme. L'état de chargement affiche un message traduit et pas d'invitation prématurée à se connecter. L'invitation et son lien respectent les cinq langues. Les enfants restent montés lors des transitions de session afin de préserver leurs saisies. Ce composant de présentation ne remplace pas les autorisations serveur des données privées.

Le composant ToggleField autorise le retour à la ligne des longs libellés ; le débordement constaté sur le simulateur d'aides allemand à 320 px est corrigé. Les fils d'Ariane hôteliers des pages exploitation, DSCR, pré-acquisition et E‑2 ont des libellés traduits.

Validation : composant réel testé hors ligne dans les cinq langues (chargement, navigation Tab, lien localisé, connexion/déconnexion simulées, un seul montage et maintien des saisies). Compilation finale et lint réussis. Navigateur sur simulateur d'aides : cinq langues, quatre largeurs, contrôle des attributs d'accessibilité, manipulation des interrupteurs, navigation vers connexion et fil d'Ariane E‑2. Aucun compte client réel n'a été modifié pour ces essais.

## Comparatif hôtelier : volumes documentés et indices cohérents

/hotellerie/compset ne fournit plus de grille de 21 zones/catégories attribuée sans publication précise à STR, Horwath ou à un observatoire Tevaxia. Le modèle part de données saisies et référencées sur une période commune (1 à 366 jours), avec justification de l'échantillon. Il exige des chambres-nuitées disponibles/vendues cohérentes avec la capacité physique et des recettes de chambres en euros sur une même base hors TVA. Les personnes-nuitées et les recettes de restauration ne doivent pas y être substituées.

Les ratios agrégés utilisent les sommes des volumes : ADR = recettes/vendues ; occupation = vendues/disponibles ; RevPAR = recettes/disponibles. Un hôtel étudié optionnel est exclu de l'échantillon concurrent. ARI, MPI et RGI utilisent son indicateur divisé par l'indicateur agrégé × 100. Les dénominateurs nuls donnent un résultat indisponible ; une occupation nulle avec une capacité disponible réelle demeure zéro. Aucun chiffre ne prétend représenter tout le Luxembourg ou une statistique sous licence STR.

Validation : 1 226 tests sur 109 fichiers, lint et compilation finale réussis, cinq langues et quatre largeurs, CSV/JSON complets et import invalide sans perte de saisie. Cas de référence : concurrents A (100 disponibles, 50 vendues, 5 000 EUR) et B (300 disponibles, 240 vendues, 36 000 EUR) : ADR 141,379310... EUR, occupation 72,5 %, RevPAR 102,50 EUR. La moyenne simple des ADR aurait donné 125 EUR, ce qui ne représente pas l'ADR de ce groupe. L'hôtel étudié (100 disponibles, 70 vendues, 9 800 EUR) reste exclu et ses indices satisfont RGI = ARI × MPI / 100. Les doublons d'identifiant, plusieurs hôtels étudiés, période invalide, ventes excessives et recettes sans vente sont rejetés.

Référence des définitions : https://www.costar.com/products/str-benchmark/resources/glossary . Ancien compset-lu.ts désormais sans consommateur public ; ses chiffres présumés ne sont pas repris dans le nouveau modèle.

## Observatoire hôtelier : remplacement par trois séries Eurostat vérifiées

/hotellerie/observatoire-lu utilise désormais les séries mensuelles Eurostat tour_occ_nim (nuitées), tour_occ_arm (arrivées) et tour_occ_mnor (occupation nette des chambres). Périmètre : Luxembourg, hôtels et hébergements similaires NACE I55.1, résidents et non-résidents réunis ; occupation avec accomunit=BEDRM, distinct des lits. Trois réponses JSON originales, paramètres de requête et empreintes SHA-256 sont conservés. Données mises à jour le 31 août 2026 et extraites le 9 septembre.

Les 43 mois de janvier 2023 à juillet 2026 comprennent 42 observations publiées et juillet 2026 sans valeur dans chaque série. Aucune valeur absente n'est remplacée par zéro. Janvier 2023 : 106 284 nuitées de personnes, 57 791 arrivées et 33,04 % d'occupation nette des chambres. Total des douze mois de 2025 : 2 019 907 nuitées. Juin 2026 : 172 461 nuitées, 100 244 arrivées, 40,92 % d'occupation. Le cumul 2026 couvre six mois et se compare aux mêmes six mois de 2025, jamais à l'année entière.

La page distingue nuitées de personnes et chambres-nuitées, arrivées et visiteurs uniques. Aucun ADR, RevPAR, détail par étoiles/origines ou taux annuel obtenu par moyenne simple des mois n'est reconstitué. Les anciennes séries présumées et grilles tarifaires ne sont plus affichées. Les descriptions de liens vers les modules hôteliers repris sont alignées avec leur contenu effectif.

Validation : 1 230 tests sur 110 fichiers, lint et compilation finale réussis ; chaque observation comparée aux réponses originales et chaque empreinte contrôlée. Navigateur : cinq langues, quatre largeurs, année pleine/partielle, mois absent, variation non disponible sans période antérieure et CSV contrôlés. Sources exactes dans docs/sources/eurostat-tourism-*-2026-09-09.json et src/lib/data/tourism-eurostat.json ; méthodologie https://ec.europa.eu/eurostat/cache/metadata/en/tour_occ_esms.htm . Ancien statec-tourism.ts sans consommateur public après remplacement de cette page ; ses tests historiques ne valident pas la provenance de ses données.

## Transactions hôtelières : sélection de communiqués vérifiés

La page /hotellerie/transactions remplace la grille de prix et rendements non corroborés par deux opérations documentées en Belgique et Allemagne. Elle ne prétend pas être un échantillon représentatif du Luxembourg ou de la Grande Région. Les dates d'accord et de réalisation sont distinctes ; aucun montant total de marché ni taux de capitalisation n'est calculé.

- Crowne Plaza Antwerp : Pandox annonce la réalisation le 2 février 2026, après accord annoncé le 2 décembre 2025 ; environ 19 M EUR pour l'immeuble hôtelier ET l'exploitation, 262 chambres. Source : https://www.pandox.se/media/press-releases/2026/pandox-has-completed-the-previously-announced-divestment-of-crowne-plaza-antwerp/ .
- Pullman Cologne : accord annoncé le 6 mars 2025, réalisation le 1er avril 2025 ; environ 66 M EUR DROITS DE MUTATION INCLUS, immeuble loué à AccorInvest, 275 chambres. Sources : https://www.pandox.se/media/press-releases/2025/pandox-acquires-a-hotel-property-in-cologne-germany/ et https://www.pandox.se/media/press-releases/2025/pandox-has-completed-previously-announced-acquisition-of-hotel-pullman-cologne/ .

Le montant par chambre divise le montant approximatif publié par les chambres de l'opération ; son périmètre (droits, exploitation) est conservé et il ne devient pas un comparable ajusté ou un prix immobilier hors droits. Le filtre Luxembourg indique qu'aucune opération corroborée n'est retenue dans cette sélection, sans affirmer une absence de transactions dans le pays.

Validation : compilation et lint réussis, cinq langues/quatre largeurs, filtres pays/absence de données, montant de 66 M EUR / 275 = environ 240 000 EUR par chambre, dates et CSV avec périmètres et liens vérifiés. La suite générale de référence comporte 1 230 tests ; ce lot de données publiées a fait l'objet de contrôles ciblés de rendu et d'export. L'ancien hotel-transactions.ts n'est plus appelé par la page ; ses anciennes lignes ne sont pas présentées comme validées.


### Consolidation du comparatif RevPAR — 9 septembre 2026

Les cinq anciennes routes `/hotellerie/revpar-comparison` redirigent définitivement vers le comparatif documenté de leur langue. Le menu, les liens contextuels, le plan du site et le sitemap pointent directement vers ce comparatif ; la carte doublonnée du hub est retirée. Cela supprime de l’interface publique l’ancien diagnostic arbitraire et le manque à gagner calculé sur 365 jours sans période documentée. Le comparatif conservé exige des volumes et des références sur une période commune et exclut l’hôtel étudié de son groupe de comparaison.

Le lot transactions adbd224 est confirmé en production : CI 34373327389 réussie, déploiement dpl_5roUyQVJWM1iJJJzYwzKBHVmN6w3 Ready, vérifications des montants, périmètres, dates, filtres, CSV et quatre largeurs dans les cinq langues réussies.

Validation de la consolidation : compilation de production et lint réussis ; réponse HTTP 308, destination dans la même langue et formulaire du comparatif vérifiés dans les cinq langues en local. Les redirections sont déclarées dans next.config.ts pour précéder le rendu diffusé de la page.


### Benchmark des hôtels enregistrés — période commune et données absentes

Le tableau connecté exige une date de début et de fin explicites. Chaque hôtel est interrogé sur ces deux dates exactes ; aucune dernière période choisie par tri textuel ne se substitue à la période demandée. Les hôtels sans enregistrement restent affichés avec un statut explicite. Les doublons pour une même période, comme les erreurs de lecture, déclenchent une erreur plutôt qu’une sélection silencieuse.

Suppression du score arbitraire (35 % occupation + 30 % ADR normalisé + 35 % marge) et des moyennes simples présentées comme indicateurs du groupe. Le tableau est alphabétique et affiche les ratios enregistrés, sans les certifier ni les recalculer depuis des volumes absents. Le comparatif documenté reste accessible pour agréger des volumes réellement renseignés. Zéro reste zéro ; les valeurs absentes/non finies et l’occupation hors 0–100 % sont rendues indisponibles. Les marges négatives sont conservées.

Les chargements sont associés à l’utilisateur, l’organisation et les dates ; les réponses obsolètes sont ignorées. Déconnexion, changement de sélection et erreurs ne laissent pas apparaître l’ancien tableau comme résultat courant. Tous les liens internes conservent la langue. Les erreurs sont affichées avec une nouvelle tentative ; le tableau est défilable au clavier sur petit écran.

Validation ciblée : composant réel exécuté avec services simulés dans les cinq langues, périodes exactes contrôlées dans les requêtes, absence de requête avant saisie, zéro/absence/marge négative, changement rapide d’organisation, erreur/nouvelle tentative, déconnexion et lien de connexion localisé. Aucun compte client ni donnée réelle n’a été modifié. Lint réussi. Les parcours connectés réels et leurs droits serveur ne sont pas certifiés par cette simulation.

Compilation de production réussie. Contrôle public local aux largeurs 320/390/768/1440 dans les cinq langues : service de comptes non configuré localement, aucune ligne protégée affichée. Les liens de connexion et états connectés ont été contrôlés dans la simulation ; le contrôle public en production est effectué après déploiement. Le message de service indisponible est traduit sans exposer de noms de tables ou de migrations.


### Budget MICE — hypothèses explicites et capacité

L’ancien modèle appliquait deux personnes par chambre, des marges fixes 45/25/75 %, des recettes annuelles présumées et une saisonnalité non sourcée, jusque dans le prompt d’analyse. Il est remplacé par un budget de période de 1 à 366 jours : groupes attendus (fractionnaires autorisés), nuitées-chambres, unités de restauration et journées-salles par groupe, tarifs, coûts directs par groupe et coûts fixes documentés. Aucun résultat initial ni référence de marché inventée.

Les capacités disponibles pour cette activité sont saisies et contrôlées séparément pour les chambres et les salles. Les journées-salles représentent une salle pendant une journée ; les nuitées-chambres ne sont pas des nuitées-personnes. Les unités de restauration doivent être définies dans les hypothèses. Recettes = groupes × volume par groupe × tarif, arrondies au centime par ligne via entiers BigInt ; les coûts directs sont calculés par groupe, les coûts fixes une seule fois sur la période. Le solde est nommé contribution après coûts saisis, sans assimilation au GOP/EBITDA/bénéfice net. Les coûts fixes restent dus avec zéro groupe et la marge est indisponible si les recettes sont nulles.

Tous les champs, y compris zéro, et les références sont requis. Précision 4 décimales pour quantités, 2 pour euros ; montants non finis/négatifs et capacités dépassées bloqués. CSV avec période, hypothèses, unités et résultats ; texte de référence protégé contre les débuts de formules.

Validation : 1 236 tests dans 111 fichiers réussis, dont 6 cas métier MICE ; lint et build réussis. Cinq langues, quatre largeurs 320/390/768/1440, absence de résultat initial, champs manquants, dépassement de capacité, zéro groupe et export contrôlés. Cas indépendant : 2,5 groupes × 10 nuitées × 100 EUR = 2 500 EUR, restauration 1 000 EUR, salles 500 EUR, coûts directs 425 EUR, fixes 100 EUR, contribution 3 475 EUR. Les cinq CSV confirment l’addition des recettes et le solde.

Benchmark connecté 0b15bb7 confirmé en production : CI 34380637265 réussie, dpl_D4pJpK7Q2UZEkVuy8KyYGCe2hXje Ready et contrôle public dans les cinq langues/quatre largeurs avec lien de connexion localisé, sans lignes privées.


### Parcours motel / aparthotel — consolidation des calculs

La page utilisait un nombre de nuits arrondi avant multiplication, des recettes annexes automatiques (petit-déjeuner 8 %, autres 4 %), des ratios de charges par catégorie et une réserve FF&E retranchée pour nommer un EBITDA. Une division par un taux était ensuite appelée DCF. Ces calculs parallèles ont été supprimés de la page publique.

La route est conservée et propose un parcours vers les outils déjà corrigés : compte d’exploitation documenté, valorisation par revenu/comparables documentés, puis acquisition et financement. Elle explique la notion d’unité vendue à la nuit pour un appartement et les pièces nécessaires, distingue revenu immobilier et exploitation et précise que les données doivent être reportées dans chaque outil. Aucun faux chiffre ou taux de marché lié à la catégorie n’est injecté. Les liens et contenus sont traduits dans les cinq langues.

Budget MICE 49453db confirmé en production : CI34381335085 réussie, déploiement dpl_E5fUqk1VAfsf68R3GFyEECNDRj6n Ready, cinq langues/quatre largeurs, calculs, capacités, zéros et CSV contrôlés sur tevaxia.lu.

Validation du parcours motel/aparthotel : build et lint réussis ; cinq langues et quatre largeurs, trois destinations localisées, navigation réelle vers le compte d’exploitation et absence des anciens calculs vérifiées.


### CAPEX hôtelier — dépenses et réserve séparées

Le modèle précédent ajoutait les versements annuels à la réserve FF&E aux rénovations calculées en pourcentage du chiffre d’affaires : un transfert interne pouvait être compté comme une dépense supplémentaire. Il imposait aussi des cycles 5/10/20 ans et des ratios par catégorie sans références documentées.

Le nouveau plan requiert le solde initial réellement disponible, puis des années consécutives (1 à 30), des dépenses et fonds supplémentaires affectés explicites, avec références aux devis, échéanciers et financements. Le total CAPEX correspond aux seules dépenses. Solde annuel = solde précédent + fonds affectés − dépenses ; aucune injection complémentaire n’est simulée. Le besoin complémentaire est le maximum des déficits de clôture et non leur somme. Un versement ultérieur ne supprime pas le déficit d’une clôture antérieure.

La portée annuelle est affichée : aucune vérification des dates de paiement dans l’année, des intérêts ou de l’inflation n’est implicite. Le besoin réel intra-annuel peut dépasser le déficit de clôture. Montants au centime, calcul en entiers, zéro explicite, absence et valeurs invalides bloquées. CSV exporte les soldes et sources par année, sépare dépenses et financement et protège les références commençant par une formule.

Validation : build/lint réussis ; 1 242 tests dans 112 fichiers, dont 6 nouveaux cas CAPEX. Contrôle UI cinq langues/quatre largeurs et cinq CSV : ouverture 100 EUR, fonds 20 EUR et travaux 80 EUR en 2026, puis fonds 20 EUR et travaux 70 EUR en 2027 donnent 150 EUR de dépenses, 40 EUR de fonds supplémentaires, solde −10 EUR et besoin complémentaire 10 EUR. Années non consécutives/champs manquants bloqués ; zéros conservés.

Parcours motel/aparthotel 7c29974 confirmé en production : CI34381868504 réussie, déploiement dpl_F78T7y6JoPxRJ21se9bQueb9r2Nn Ready, cinq langues et quatre largeurs vérifiées avec navigation vers l’exploitation.


### Green Key — retrait de l’éligibilité fictive

L’ancien écran attribuait des points maison à 29 critères (dont des seuils non sourcés), concluait à l’éligibilité dès 40 points et demandait à l’IA d’estimer coûts, aides et gain de prix hôtelier. Ce mécanisme est supprimé.

La page devient un registre documentaire interne : établissement, version 2022–2026 ou 2026–2031, périmètre et confirmation de l’opérateur ; références de critères saisies depuis la version choisie ; type impératif/progressif/à vérifier ; statut non examiné, preuve référencée, à vérifier ou non-applicabilité à justifier. Tout statut autre que non examiné exige un justificatif. Aucun score, pourcentage de conformité, seuil d’éligibilité ni décision de certification. Les références saisies ne sont pas présentées comme une liste exhaustive ni comme une validation indépendante.

Sources primaires consultées le 9 septembre 2026 :
- https://www.greenkey.global/criteria/2022-2026
- https://www.greenkey.global/criteria-20262031
- https://www.greenkey.global/application-process
- https://www.greenkey.global/certification-process-2026-2031
- https://www.greenkey.global/join-green-key

La documentation officielle distingue critères impératifs et progressifs, prévoit une évaluation puis une décision. Deux référentiels sont publiés ; la procédure de transition est à confirmer avec le programme, sans sélection automatique fondée sur la date du navigateur. Le CSV conserve la version, la source, les déclarations et preuves, et indique qu’il ne constitue aucune décision de conformité ou de certification.

Validation : build/lint réussis ; 1 246 tests dans 113 fichiers, dont 4 nouveaux contrôles du dossier. Cinq langues, quatre largeurs, statuts initiaux inconnus, obligation de preuve, ajout de ligne et export vérifiés ; cinq CSV relus avec version et statuts exacts. Les intitulés du hub sont alignés sur la préparation documentaire.

CAPEX 5b234a7 confirmé en production : CI34382425442 réussie, dpl_HHdfFbVcXDyqnz4Y2UKDM45jXGG6 Ready ; cinq langues/quatre largeurs, calculs et exports vérifiés sur tevaxia.lu.


### Due diligence hôtelière — déclarations documentées et PDF

Les 50 points sont conservés comme aide de préparation non exhaustive, sans affiliation aux standards HVS/Cushman & Wakefield revendiquée. Les priorités sont indicatives. Dix-neuf libellés ont été réécrits comme documents et exigences à faire vérifier : notamment TVA par prestation/boisson, autorisations, contrôles techniques, contrats et cotisations, exigences énergétiques et RH. Retrait des raccourcis « hébergement 90j », « F&B 14 % », norme CE pour l’air, contrôleur systématiquement nommé, échéances énergétiques universelles et références sociales non établies.

Les statuts restent déclaratifs : preuve référencée, réserve ou hors périmètre déclaré. Un statut hors « à traiter » exige une note pour compter dans l’avancement et autoriser l’export. Le nom est requis ; les notes sont limitées à 1 000 caractères. Le pourcentage mesure les points renseignés avec justificatif, pas la conformité. L’analyse IA qui recommandait go/stop, décote ou conditions contractuelles est retirée.

PDF : mention de brouillon et limites, 50 points et leurs statuts conservés, justificatifs sur toute la largeur, titre de rubrique solidaire du premier point, pagination des autres points, pied de page sur chaque feuille. Le verrou d’export évite les doubles clics ; un échec est signalé et le bouton est réactivé. La langue des libellés est dérivée à l’affichage, sans figer les traductions dans l’état du formulaire. Liens localisés, boutons plus lisibles et retours à la ligne sur mobile.

Sources primaires utilisées pour orienter les vérifications, sans certification juridique du dossier : https://pfi.public.lu/fr/citoyen/tva/taux-tva.html ; https://pfi.public.lu/fr/publications/textes-de-loi/tva010126.html ; https://guichet.public.lu/fr/entreprises/creation-developpement/autorisation-etablissement/commerce/etablissement-hebergement.html .

Validation : build/lint réussis ; cinq langues et quatre largeurs. 0/50 initialement, statut sans note non compté et export bloqué, trois points justifiés donnent 3/50 ; double clic produit un seul téléchargement. Cinq PDF finaux de trois pages : 50 libellés intégralement retrouvés, note longue complète, réserves et mentions de brouillon sur chaque page, limites de page contrôlées. Les 15 pages ont été rendues en PNG et inspectées après correction des notes étroites et titres orphelins du premier rendu. La suite générale de référence reste à 1 246 tests dans 113 fichiers, complétée ici par ces contrôles de formulaire et PDF.

Green Key 80f0167 confirmé en production : CI34383215142 réussie, dpl_D142ZVm9MdDKAyynkg3X1HCWq682 Ready, cinq langues/quatre largeurs et cinq CSV contrôlés sur tevaxia.lu.


## Périodes des hôtels enregistrés et rapport propriétaire — 9 septembre 2026

- Suppression de l’occupation/ADR préremplis et de la réserve automatique de 4 %. GOP et EBITDA sont désormais des montants déclarés, distincts de la réserve FF&E. Les trois catégories de charges ne suffisent pas à reconstruire ces agrégats comptables.
- Zéro explicite conservé ; champ vide inconnu. Total des revenus seulement si les quatre rubriques sont renseignées, addition en centimes. Marges seulement sur revenu total strictement positif ; pertes conservées. RevPAR = ADR × occupation sur le périmètre déclaré.
- Dates réelles sur 1 à 366 jours ; montants finis bornés et précision contrôlée ; sources/périmètre obligatoires. Validation répétée dans savePeriod, utilisateur authentifié requis, mise à jour filtrée par identifiant de fiche ET hôtel. Aucun changement des politiques RLS ni attestation de leur audit.
- Historique conservé sans réécriture automatique. À l’édition, GOP, EBITDA et réserve doivent être ressaisis depuis les justificatifs ; mention visible des anciennes valeurs potentiellement automatiques.
- Chargement anonyme remplacé par connexion localisée ; état isolé par utilisateur/hôtel et réponses tardives ignorées ; erreurs/réessai, verrou anti-double enregistrement et PDF, contrôles de formulaire associés à leurs libellés.
- PDF dans cinq langues : toutes les rubriques affichées, inconnus explicites, centimes et pertes conservés, dates toujours présentes, sources intégrales, suppression des comparaisons de périodes arbitraires et des mentions de certification USALI/STR. Pied de page sur chaque page ; titre ajusté après contrôle visuel.
- Vérification : 1 256 tests / 115 fichiers, dont 10 nouveaux tests métier/persistance. Parcours du composant réel avec services simulés dans cinq langues : zéro/inconnu, pertes, dates, doublon, changement utilisateur/hôtel et édition. Cinq PDF de deux pages rendus et inspectés (sources longues, libellés, bornes, pied de page). Formulaire avec CSS réel vérifié à 320/390/768/1440 px. Aucune écriture de test dans les comptes de production.


## Tableau de groupe hôtelier — 9 septembre 2026

- Le « CAPEX cumulé » était la somme des prix d’acquisition : renommé explicitement prix d’acquisition cumulés (EUR), sans confusion avec travaux ou valeur actuelle. Un prix manquant/invalide empêche le total complet ; un prix nul confirmé reste zéro. Les anciennes chambres à zéro sont inconnues, pas une capacité nulle supposée.
- Accès direct aux fiches/périodes ajouté. Les liens de simulateurs n’affirment plus importer/rattacher automatiquement les données ; paramètres hôtel ignorés supprimés. Segments déclarés sans correspondance inventée aux étoiles.
- Chargements, erreurs et réessais séparés ; état isolé par utilisateur et groupe, réponses tardives écartées ; aucune fausse liste vide pendant le chargement. Création validée (nom, chambres entières de 1 à 100 000, segment), auteur authentifié, verrou double clic ; suppression conserve sa confirmation dans le produit.
- Vérification : 1 260 tests / 116 fichiers, ESLint ciblé, build production. Composant réel avec services simulés : cinq langues, montants inconnus/zéro, changements de groupe, création/doublon, suppression confirmée/annulée, erreurs/réessai et déconnexion. Parcours public et formulaire avec CSS réel sur quatre largeurs. Aucune mutation QA dans les comptes de production.

La livraison précédente des périodes et PDF (3c1cc7c) est confirmée : CI 34386805577 réussie ; Vercel dpl_FfHVzmz5RDdgo1RXW3sPqem5prBi Ready sur tevaxia.lu ; parcours public vérifié dans les cinq langues.


## Impayés hôteliers — calcul documenté des intérêts

- Suppression du taux présumé de 12,5 %, des probabilités de recouvrement 95/80/55/30 %, du calendrier arbitraire présenté comme légal et des frais automatiques par palier.
- Une facture à principal constant ; distinction entreprise/consommateur/pouvoir public ; principal taxes comprises, frais explicitement documentés saisis une fois. Aucune validation d’exigibilité ou de recouvrabilité, aucun envoi. Les paiements partiels/principaux variables restent hors périmètre.
- Segments réels consécutifs, premier/dernier jour inclus, sans trou/chevauchement et chacun dans un semestre ; taux saisi et sourcé pour chaque segment. Base ACT/365 selon la formule Guichet, calcul entier en centimes et taux à quatre décimales, arrondi au centime par segment. Aucun taux 2026 appliqué par défaut.
- Sources officielles consultées le 9 septembre 2026 : https://guichet.public.lu/fr/entreprises/gestion-juridique-comptabilite/facturation/encaissement/interets-retard.html et https://mj.gouvernement.lu/fr/service-citoyens/taux-interet-legal.html . Les conditions commerciales et consommateurs diffèrent ; le forfait commercial ne s’applique pas universellement.
- Vérification : 1 266 tests / 117 fichiers ; exemple officiel 2 000 EUR, 12,5 %, 19 jours = 13,01 EUR ; année bissextile, deux taux, frais uniques, zéros, dates/trous/chevauchements et injection CSV. Build et lint ciblé réussis. Navigateur cinq langues/quatre largeurs : exemple, export, zéro/inconnu, changement de semestre et deux taux.

Le groupe hôtelier (403e8cc) est confirmé en production : CI 34387445135 réussie, Vercel dpl_9nod77ZZ5o1dxiaGp9KPivAWA7v1 Ready, parcours public cinq langues vérifié.


## Housekeeping — plan quotidien documenté

- Suppression des chambres/occupations/coûts préremplis, courbe hebdomadaire inventée, superviseur minimum imposé, majoration automatique de 25 % et analyse IA avec benchmarks non sourcés.
- Saisie des chambres de départ et recouches à nettoyer, minutes observées et parties communes, heures payées et minutes productives par agent, coûts employeur séparés et nombre/heures de supervision explicites. Pas d’import PMS automatique.
- Besoin agents = plafond(charge/minutes productives), facturation de la totalité des heures payées ; superviseurs ajoutés sans contribution supposée au nettoyage. Zéro travail = zéro agent, aucun superviseur imposé. Ratios sans chambres inconnus. Contrôles de dates, précision, capacité, temps et sources. Pas de validation réglementaire du planning.
- Vérification : 1 272 tests / 118 fichiers, lint ciblé et build réussis. Cas de 400 minutes = 1 agent à 160 EUR + supervision 60 EUR = 220 EUR ; 400,01 minutes nécessitent 2 vacations. Absence de travail, tâches des parties communes sans chambres, capacités impossibles et arrondis employeur couverts. Parcours et CSV cinq langues/quatre largeurs vérifiés.

Le calcul des impayés (f5ccd3b) est confirmé en production : CI 34388203562 réussie, Vercel dpl_EkYoUyUFVerMN5rXPLbDELfCHnrc Ready, cinq parcours complets sur tevaxia.lu.


## Alertes hôtelières — configuration honnête et écritures contrôlées

- Le dépôt contient le stockage hotel_yield_alerts mais aucun évaluateur de ces règles ni preuve du cron 07:00/SMTP annoncés. Le cron applicatif quotidien et la fonction check-alerts concernent d’autres fonctions. Retrait des promesses IA « agit », surveillance quotidienne et emails assurés. L’écran décrit explicitement son périmètre de configuration ; aucun moteur de surveillance n’a été créé ou certifié.
- Règles historiques conservées, statuts/préférences indiqués comme paramètres enregistrés et non preuves de traitement. Nouvelles règles désactivées et email/push faux par défaut. Liens vers comparaisons documentées pour contrôle manuel.
- Édition avec bouton Enregistrer, aucune requête par frappe, seuils/fenêtres validés (occupation 0–100 %, GOP négatif possible), gestion des types historiques inconnus. Erreurs de lecture et d’écriture visibles ; changements utilisateur/hôtel isolés, anti-double-clic, brouillon conservé en cas d’erreur.
- Services : vérification de l’identité actuelle avant action ; lecture de l’hôtel accessible avant enregistrement ; mise à jour/suppression filtrées par règle, utilisateur et hôtel. Aucune politique RLS de production modifiée ni certification de son état effectif. Les notifications existantes ne sont pas activées/modifiées silencieusement lors de l’édition.
- Vérification : 1 278 tests / 119 fichiers, lint et build réussis. Tests service pour identité changée, accès hôtel refusé, portée des mutations, erreurs et notifications non activées ; composant simulé cinq langues pour frappes sans écriture, validation, doublon, brouillon après erreur, changement hôtel/compte, suppression et déconnexion ; parcours public/formulaire quatre largeurs. Aucune écriture ou notification QA en production.

Housekeeping (ee4eac0) confirmé en ligne : CI 34388944339 réussie, Vercel dpl_752FT4TzJyuKCbzEeXUiiBPRG6rC Ready, cinq parcours métier complets vérifiés sur tevaxia.lu.


## Offre hôtelière et guide d’investissement — cohérence des contenus

- Accueil, tarifs, parcours hôtelier et solution hôtel alignés sur les outils documentés : retrait des scores de visa, rendements garantis, consolidation PMS supposée, configuration en cinq minutes, TVA F&B uniforme et promesses de certification/notification non établies.
- Guide investir-hotel-luxembourg entièrement repris dans les cinq langues : statistiques et multiples non sourcés retirés ; périmètres des indicateurs, des transactions et du financement explicités ; exemple fictif exact (3 650 chambres-nuitées, 1 825 vendues, ADR 100 EUR HT, revenu 182 500 EUR HT, RevPAR 50 EUR).
- Correction E-2 : Luxembourg pays du traité, investissement dans une entreprise aux États-Unis ; absence de lien automatique avec l’achat d’un hôtel au Luxembourg. Sources Department of State, Guichet autorisation/statut hôtelier/aide environnementale et Eurostat reliées directement. Aucune subvention présumée.
- Réexport des métadonnées dans les quatre routes traduites ; date de mise à jour du guide fixée au 9 septembre. Titres longs du composant partagé autorisés à revenir à la ligne à 320 px, sans réduction de police.
- Vérification : lint ciblé et build réussis ; 25 pages publiques (5 pages × 5 langues), contenu, liens, métadonnées/FAQ structurée du guide et quatre largeurs vérifiés. Le reste des pages PMS, du hub hôtel et des offres métiers reste en cours de revue.

Alertes (7540004) confirmées en production : CI 34389785747 réussie, Vercel dpl_CYQdCLfsCQ8CQZRhwXnPGoHq6aZa Ready, cinq parcours publics vérifiés.


## PMS — journal mensuel et inventaire observé

- Le rapport nommé USALI mélangeait revenus estimés d’audits nocturnes et écritures de folios, ajoutait la taxe de séjour au revenu, extrapolait l’inventaire maximum à tous les jours du mois et fabriquait le chiffre d’affaires de comparaison N-1. Il devient un journal des écritures enregistrées, sans certification USALI/comptable/fiscale, ni ADR/RevPAR/TRevPAR ou YoY calculés sur des bases différentes.
- Période de posting UTC semi-ouverte, incluant les fractions de dernière seconde ; annulations exclues. Toutes les catégories conservées, taxe isolée, montants signés additionnés en centimes BigInt. Les taux et écritures historiques ne sont pas recalculés ; le journal ne prouve ni paiement, ni émission de facture, ni rattachement comptable au séjour.
- Lecture paginée par 500 jusqu’à 200 000 lignes maximum ; dépassement, troncature, compte changeant, doublons, erreurs de requête et données incohérentes refusés au lieu de publier un total partiel. Identité vérifiée avant et après lecture, propriété filtrée par propriétaire. Lecture de données vivantes, sans verrouillage transactionnel ; aucune politique RLS/SQL de production modifiée ou certifiée.
- Inventaire = somme des relevés quotidiens disponibles, taux sur ce même échantillon, couverture et statut clôturé explicités ; aucune extrapolation aux jours manquants. Aucun ratio sans dénominateur positif. Les revenus estimés et compteurs historiques de la fonction SQL night audit restent à revoir séparément.
- Page, parent et menu : changement de mois/compte/propriété isolé, réponses tardives ignorées, erreurs et nouvelle tentative, déconnexion visible sans chargement infini. Liens PMS conservent la langue. PDF avec verrou anti-double-clic, erreur récupérable et téléchargement abandonné après démontage.
- Export cinq langues, synthèse, 19 catégories sans troncature et détail des relevés ; montants au centime et mêmes limites explicites. 15 pages PDF rendues et inspectées, pieds de page contrôlés.
- Correctif de génération des namespaces : inclusion des layouts ancêtres et de leurs imports clients, avec test Python de non-régression (sans récupération des namespaces des frères).
- Vérification : 1 286 tests / 120 fichiers, 1 test Python, lint ciblé et build réussis ; composants réels page/parent/menu/PDF avec services simulés dans les cinq langues, quatre largeurs ; échantillon 30 chambres-nuitées/15 occupées = 50 %, 19 lignes dont 246,39 EUR hors taxe de séjour + 6 EUR = 252,39 EUR au total ; pagination 1 001 lignes et erreurs couvertes. Aucune écriture client effectuée pour les tests.

Offre publique hôtel et guide (7c4eacb) confirmés en production : CI 34392746536, Vercel dpl_DoxNMXaWvj2PE1foPZSLvuS2UhwU Ready, 25 pages publiques revérifiées cinq langues/quatre largeurs.


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
