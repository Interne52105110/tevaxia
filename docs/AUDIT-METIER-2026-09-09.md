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
