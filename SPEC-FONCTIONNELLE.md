# Tevaxia Energy — Spécification Fonctionnelle

**Version :** 1.0  
**Date :** 2026-04-01  
**Auteur :** Erwan (Analyste-Développeur)  
**Statut :** Draft — en cours de validation

---

## 1. Vision & Contexte

### 1.1 Problème

Le passeport énergétique est obligatoire pour toute vente ou location au Luxembourg. Pourtant, aucun outil accessible ne permet de quantifier l'impact financier de la performance énergétique sur la valeur d'un bien immobilier, ni de modéliser la rentabilité d'une rénovation ou le fonctionnement d'une communauté énergétique.

Les acteurs du marché — syndics, banques, évaluateurs, promoteurs, propriétaires — naviguent à l'aveugle sur ces questions devenues centrales avec la directive EPBD et les exigences ESG.

### 1.2 Solution

**Tevaxia Energy** (`energy.tevaxia.eu`) est un module complémentaire de la plateforme Tevaxia qui propose trois simulateurs :

| # | Simulateur | Cible principale |
|---|-----------|-----------------|
| 1 | Impact énergétique sur la valorisation | Évaluateurs, banques (LTV ajustée ESG), notaires |
| 2 | Rentabilité de rénovation énergétique | Syndics, gestionnaires, promoteurs, propriétaires |
| 3 | Communauté énergétique | Syndics, copropriétés, promoteurs |

### 1.3 Cadre réglementaire luxembourgeois

- **Passeport énergétique** : classes A à I (Règlement grand-ducal du 23 juillet 2016, modifié)
- **Directive EPBD** (recast 2024/1275) : objectif parc zéro-émission 2050, jalons intermédiaires
- **Klimabonus** : subventions rénovation jusqu'à 62,5% des travaux
- **Klimaprêt** : taux 1,5%, max 100 000 €, durée max 15 ans
- **Loi du 21 mai 2021** sur les communautés énergétiques (transposition RED II)
- **Règlement ILR** E23/14 : cadre autoconsommation collective et communautés d'énergie

---

## 2. Personas & User Stories

### 2.1 Personas

| Persona | Description | Objectif principal |
|---------|-------------|-------------------|
| **Sophie** — Évaluatrice immobilière | REV TEGOVA, évalue 200 biens/an pour banques LU | Quantifier le green premium/brown discount dans ses rapports |
| **Marc** — Syndic (client BRUNATA) | Gère 15 résidences, 400 lots | Argumenter les travaux de rénovation en AG copropriété |
| **Léa** — Analyste bancaire | Département immobilier Spuerkeess | Ajuster le LTV selon la performance énergétique |
| **Thomas** — Promoteur | Développe 3 projets résidentiels/an | Optimiser le positionnement énergétique de ses programmes |
| **Anne** — Propriétaire | Appartement classe E, envisage rénovation | Savoir si la rénovation est rentable |

### 2.2 Épiques & User Stories

---

### ÉPIQUE 1 : Simulateur d'impact énergétique sur la valorisation

> En tant qu'utilisateur, je veux comprendre l'impact financier de la classe énergétique d'un bien sur sa valeur de marché.

#### US-1.1 : Saisie des caractéristiques du bien
**En tant que** utilisateur  
**Je veux** renseigner la classe énergétique (A-I), la commune, la surface habitable et le type de bien  
**Afin de** obtenir une estimation de l'impact énergétique sur la valeur

**Critères d'acceptation :**
- [ ] Classes A à I du passeport énergétique luxembourgeois
- [ ] Liste des communes LU avec recherche autocomplete
- [ ] Types : appartement, maison, maison mitoyenne, studio
- [ ] Surface en m² (validation : 10-1000 m²)
- [ ] Champs pré-remplis si paramètres URL fournis (intégration Tevaxia)

#### US-1.2 : Calcul du green premium / brown discount
**En tant que** utilisateur  
**Je veux** voir le pourcentage d'ajustement (prime/décote) et le montant en euros  
**Afin de** quantifier l'impact de la classe énergétique

**Critères d'acceptation :**
- [ ] Green premium (classes A-C) affiché en vert avec flèche ↑
- [ ] Brown discount (classes E-I) affiché en rouge avec flèche ↓
- [ ] Classe D = référence (0% d'ajustement)
- [ ] Montant en € calculé sur la base du prix/m² communal
- [ ] Fourchette min-max affichée (intervalle de confiance)
- [ ] Source des données et méthodologie accessibles

#### US-1.3 : Comparaison multi-classes
**En tant que** évaluateur ou banquier  
**Je veux** comparer l'impact pour toutes les classes (A à I) sur le même bien  
**Afin de** visualiser l'échelle complète des ajustements

**Critères d'acceptation :**
- [ ] Tableau comparatif avec toutes les classes
- [ ] Graphique en barres horizontales (prime/décote)
- [ ] Mise en évidence de la classe actuelle du bien
- [ ] Écart en € entre la classe actuelle et la classe cible

#### US-1.4 : Export du résultat
**En tant que** évaluateur  
**Je veux** exporter le résultat en PDF  
**Afin de** l'intégrer dans mon rapport d'évaluation

**Critères d'acceptation :**
- [ ] Export PDF avec en-tête Tevaxia Energy
- [ ] Mention de la méthodologie et des sources
- [ ] Date de calcul et paramètres utilisés
- [ ] Clause de non-responsabilité (estimation indicative)

---

### ÉPIQUE 2 : Simulateur de rentabilité de rénovation énergétique

> En tant qu'utilisateur, je veux modéliser le coût, les économies et la rentabilité d'une rénovation énergétique.

#### US-2.1 : Configuration du bien et objectif
**En tant que** utilisateur  
**Je veux** renseigner mon bien actuel et la classe énergétique cible  
**Afin de** dimensionner la rénovation

**Critères d'acceptation :**
- [ ] Classe actuelle (A-I) et classe cible (sélection des classes supérieures uniquement)
- [ ] Surface habitable, année de construction, commune
- [ ] Type de chauffage actuel (gaz, fioul, PAC, électrique, district heating)
- [ ] Consommation énergétique actuelle (kWh/m²/an) — pré-remplie si classe renseignée
- [ ] Nombre de lots (mode copropriété pour syndics)

#### US-2.2 : Estimation des coûts de travaux
**En tant que** utilisateur  
**Je veux** voir les postes de travaux nécessaires avec leurs coûts estimés  
**Afin de** budgétiser la rénovation

**Critères d'acceptation :**
- [ ] Liste des postes : isolation (façade, toiture, sol), fenêtres, chauffage (PAC), VMC, solaire
- [ ] Coût unitaire €/m² avec fourchette min-max
- [ ] Facteur d'âge du bâtiment appliqué
- [ ] Total travaux HT et TTC
- [ ] Honoraires (architecte, BET, audit : ~10%)
- [ ] Durée estimée des travaux
- [ ] Possibilité de désactiver/activer chaque poste manuellement

#### US-2.3 : Calcul des aides et subventions
**En tant que** utilisateur  
**Je veux** voir les aides disponibles pour ma rénovation  
**Afin de** connaître le reste à charge réel

**Critères d'acceptation :**
- [ ] Klimabonus : % selon le saut de classe (jusqu'à 62,5%)
- [ ] Klimaprêt : montant éligible, mensualité indicative
- [ ] Subvention conseil énergie (1 500 €)
- [ ] Aides communales si disponibles
- [ ] Total des aides et reste à charge
- [ ] Lien vers myguichet.lu pour la demande

#### US-2.4 : Modélisation de la rentabilité
**En tant que** propriétaire ou syndic  
**Je veux** voir les économies d'énergie annuelles et le temps de retour sur investissement  
**Afin de** prendre une décision éclairée

**Critères d'acceptation :**
- [ ] Économie annuelle en kWh et en € (prix énergie configurable)
- [ ] Plus-value estimée sur le bien (via green premium du simulateur 1)
- [ ] Temps de retour sur investissement (payback) en années
- [ ] VAN (Valeur Actuelle Nette) sur 20 ans avec taux d'actualisation configurable
- [ ] TRI (Taux de Rendement Interne)
- [ ] Graphique : courbe des flux cumulés vs investissement initial
- [ ] Scénarios : prix énergie stable / hausse 3%/an / hausse 5%/an

#### US-2.5 : Mode copropriété (syndic)
**En tant que** syndic  
**Je veux** répartir les coûts et économies par lot  
**Afin de** présenter le projet en assemblée générale

**Critères d'acceptation :**
- [ ] Saisie du nombre de lots et tantièmes
- [ ] Répartition du coût par lot selon tantièmes
- [ ] Économie par lot sur les charges communes
- [ ] Synthèse pour AG : avant/après par lot
- [ ] Export PDF "dossier AG rénovation énergétique"

---

### ÉPIQUE 3 : Simulateur de communauté énergétique

> En tant qu'utilisateur, je veux modéliser le fonctionnement et les économies d'une communauté d'énergie sur un immeuble ou ensemble de lots.

#### US-3.1 : Configuration de l'installation solaire
**En tant que** utilisateur  
**Je veux** renseigner l'installation de production  
**Afin de** modéliser la production solaire de l'immeuble

**Critères d'acceptation :**
- [ ] Puissance crête (kWc) ou surface de toiture disponible (calcul automatique)
- [ ] Orientation et inclinaison (presets : plat, sud 30°, est-ouest)
- [ ] Commune (pour ensoleillement local)
- [ ] Production annuelle estimée en kWh (calcul basé données PVGIS Luxembourg)
- [ ] Courbe de production mensuelle

#### US-3.2 : Définition des participants
**En tant que** syndic ou gestionnaire  
**Je veux** saisir les lots participants à la communauté  
**Afin de** modéliser la répartition

**Critères d'acceptation :**
- [ ] Ajout de lots avec : surface, nombre d'occupants, consommation annuelle estimée
- [ ] Profil de consommation type (famille, couple, personne seule, bureau)
- [ ] Clé de répartition configurable : tantièmes, parts égales, consommation prorata
- [ ] Minimum 2 lots, maximum 50 lots

#### US-3.3 : Calcul de l'autoconsommation
**En tant que** utilisateur  
**Je veux** voir la répartition de l'énergie produite entre autoconsommation et injection réseau  
**Afin de** évaluer l'efficacité de la communauté

**Critères d'acceptation :**
- [ ] Taux d'autoconsommation global (%)
- [ ] Taux de couverture par lot (% des besoins couverts)
- [ ] Surplus injecté au réseau (kWh/an)
- [ ] Graphique : production vs consommation (courbes mensuelles)
- [ ] Diagramme Sankey : flux d'énergie (production → autoconso / injection)

#### US-3.4 : Bilan financier par lot
**En tant que** copropriétaire participant  
**Je veux** voir mes économies individuelles  
**Afin de** décider de rejoindre la communauté

**Critères d'acceptation :**
- [ ] Coût d'investissement par lot (quote-part installation)
- [ ] Économie annuelle sur la facture d'électricité
- [ ] Revenu de l'injection réseau (tarif rachat configurable)
- [ ] Temps de retour sur investissement par lot
- [ ] Comparaison : avec communauté vs sans communauté
- [ ] Prix de l'énergie interne à la communauté (configurable)

#### US-3.5 : Conformité réglementaire
**En tant que** syndic  
**Je veux** vérifier que le projet respecte le cadre luxembourgeois  
**Afin de** sécuriser la mise en place

**Critères d'acceptation :**
- [ ] Checklist de conformité : Loi 21 mai 2021, Règlement ILR E23/14
- [ ] Périmètre géographique vérifié (même poste de transformation ou < 1 km)
- [ ] Statut juridique requis (asbl, coopérative ou copropriété)
- [ ] Contrat de répartition type (lien vers template)
- [ ] Indicateurs : part renouvelable, réduction CO₂

---

## 3. Modèle de données

### 3.1 Entités principales

```
┌─────────────────────┐     ┌──────────────────────┐
│     Bien (Property)  │     │   Commune             │
├─────────────────────┤     ├──────────────────────┤
│ id: UUID            │     │ code: String (INS)    │
│ commune_code: FK    │────>│ nom: String           │
│ type: PropertyType  │     │ canton: String        │
│ surface: double     │     │ prix_m2: double       │
│ classe_energie: A-I │     │ ensoleillement_kwh:   │
│ annee_construction: │     │   double              │
│   int               │     │ zone_climatique: int  │
│ chauffage: HeatType │     └──────────────────────┘
│ conso_kwh_m2: double│
│ nb_lots: int        │     ┌──────────────────────┐
│ tantièmes: int[]    │     │  PrixEnergie          │
└─────────────────────┘     ├──────────────────────┤
                            │ type: EnergyType      │
┌─────────────────────┐     │ prix_kwh: double      │
│  SimulationResult   │     │ date_ref: LocalDate   │
├─────────────────────┤     │ source: String        │
│ id: UUID            │     └──────────────────────┘
│ type: SimType       │
│ input: JSONB        │     ┌──────────────────────┐
│ output: JSONB       │     │  Lot (CommunityUnit)  │
│ created_at: instant │     ├──────────────────────┤
│ user_session: String│     │ id: UUID              │
└─────────────────────┘     │ surface: double       │
                            │ nb_occupants: int     │
                            │ profil: ConsumerType  │
                            │ conso_annuelle_kwh:   │
                            │   double              │
                            │ tantiemes: int        │
                            └──────────────────────┘
```

### 3.2 Enums

```java
enum PropertyType {
    APPARTEMENT, MAISON, MAISON_MITOYENNE, STUDIO
}

enum ClasseEnergie {
    A, B, C, D, E, F, G, H, I
}

enum HeatingType {
    GAZ, FIOUL, PAC_AIR_EAU, PAC_GEOTHERMIE, ELECTRIQUE, DISTRICT_HEATING, BOIS_PELLETS
}

enum EnergyType {
    ELECTRICITE, GAZ_NATUREL, FIOUL, PELLETS, DISTRICT_HEATING
}

enum ConsumerProfile {
    FAMILLE_4, COUPLE, PERSONNE_SEULE, BUREAU
}

enum RepartitionKey {
    TANTIEMES, PARTS_EGALES, PRORATA_CONSOMMATION
}
```

### 3.3 Consommation de référence par classe (kWh/m²/an)

| Classe | Consommation primaire (kWh/m²/an) | Label |
|--------|-----------------------------------|-------|
| A | ≤ 45 | Très performant |
| B | 46 – 75 | Performant |
| C | 76 – 110 | Bon |
| D | 111 – 150 | Moyen (référence) |
| E | 151 – 210 | Insuffisant |
| F | 211 – 300 | Mauvais |
| G | 301 – 400 | Très mauvais |
| H | 401 – 500 | Énergivore |
| I | > 500 | Très énergivore |

---

## 4. API REST — Spécification

### 4.1 Base URL

```
https://api.energy.tevaxia.eu/v1
```

### 4.2 Endpoints

#### 4.2.1 Impact énergétique sur la valorisation

```
POST /v1/valuation-impact
```

**Request body :**
```json
{
  "classeEnergie": "E",
  "commune": "Luxembourg-Ville",
  "surface": 85,
  "propertyType": "APPARTEMENT"
}
```

**Response :**
```json
{
  "classe": "E",
  "communePrixM2": 10500,
  "valeurReference": 892500,
  "ajustementPct": -3.0,
  "ajustementEur": -26775,
  "valeurAjustee": 865725,
  "fourchette": {
    "min": -4.5,
    "max": -1.5,
    "valeurMin": 852338,
    "valeurMax": 879113
  },
  "comparaison": [
    { "classe": "A", "ajustementPct": 8.0, "valeur": 963900 },
    { "classe": "B", "ajustementPct": 5.0, "valeur": 937125 },
    { "classe": "C", "ajustementPct": 2.0, "valeur": 910350 },
    { "classe": "D", "ajustementPct": 0.0, "valeur": 892500 },
    { "classe": "E", "ajustementPct": -3.0, "valeur": 865725 },
    { "classe": "F", "ajustementPct": -7.0, "valeur": 830025 },
    { "classe": "G", "ajustementPct": -12.0, "valeur": 785400 },
    { "classe": "H", "ajustementPct": -18.0, "valeur": 731850 },
    { "classe": "I", "ajustementPct": -25.0, "valeur": 669375 }
  ],
  "methodologie": "Green premium/brown discount basé sur les études de marché...",
  "sources": ["Observatoire de l'Habitat 2025", "ECB Climate Risk Assessment"]
}
```

---

#### 4.2.2 Rentabilité de rénovation

```
POST /v1/renovation/costs
```

**Request body :**
```json
{
  "classeActuelle": "F",
  "classeCible": "B",
  "surface": 120,
  "anneeConstruction": 1975,
  "commune": "Esch-sur-Alzette",
  "chauffageActuel": "GAZ",
  "postesDesactives": []
}
```

**Response :**
```json
{
  "postes": [
    { "id": "isolation_facade", "label": "Isolation façade (ITE)", "coutMin": 16560, "coutMax": 30360, "coutMoyen": 23460, "actif": true },
    { "id": "isolation_toiture", "label": "Isolation toiture / combles", "coutMin": 11040, "coutMax": 22080, "coutMoyen": 16560, "actif": true },
    { "id": "isolation_sol", "label": "Isolation sol / cave", "coutMin": 5520, "coutMax": 12420, "coutMoyen": 8970, "actif": true },
    { "id": "fenetres", "label": "Remplacement fenêtres", "coutMin": 11040, "coutMax": 20700, "coutMoyen": 15870, "actif": true },
    { "id": "chauffage_pac", "label": "Pompe à chaleur", "coutMin": 13800, "coutMax": 27600, "coutMoyen": 20700, "actif": true },
    { "id": "ventilation", "label": "VMC double flux", "coutMin": 5520, "coutMax": 11040, "coutMoyen": 8280, "actif": true }
  ],
  "totalTravaux": { "min": 63480, "max": 124200, "moyen": 93840 },
  "honoraires": 9384,
  "totalAvecHonoraires": 103224,
  "facteurAge": 1.15,
  "dureeEstimeeMois": 9
}
```

---

```
POST /v1/renovation/subsidies
```

**Request body :**
```json
{
  "classeActuelle": "F",
  "classeCible": "B",
  "coutTravaux": 93840,
  "commune": "Esch-sur-Alzette"
}
```

**Response :**
```json
{
  "klimabonus": {
    "taux": 0.50,
    "montant": 46920,
    "description": "Saut F→B : 50% des travaux subventionnés"
  },
  "klimapret": {
    "eligible": true,
    "montantMax": 46920,
    "taux": 0.015,
    "dureeMois": 180,
    "mensualite": 290
  },
  "conseilEnergie": 1500,
  "aidesCommunales": null,
  "totalAides": 48420,
  "resteACharge": 54804
}
```

---

```
POST /v1/renovation/profitability
```

**Request body :**
```json
{
  "coutNet": 54804,
  "classeActuelle": "F",
  "classeCible": "B",
  "surface": 120,
  "commune": "Esch-sur-Alzette",
  "chauffageActuel": "GAZ",
  "prixEnergieKwh": 0.12,
  "scenarioHausseEnergie": 0.03,
  "tauxActualisation": 0.03,
  "horizon": 20
}
```

**Response :**
```json
{
  "economieAnnuelleKwh": 19800,
  "economieAnnuelleEur": 2376,
  "plusValueBien": {
    "valeurAvant": 739200,
    "valeurApres": 776160,
    "plusValue": 36960,
    "ajustementPct": 5.0
  },
  "paybackAnnees": 7.6,
  "van20ans": 18420,
  "tri": 0.089,
  "fluxCumules": [
    { "annee": 0, "flux": -54804 },
    { "annee": 1, "flux": -52428 },
    { "annee": 5, "flux": -41604 },
    { "annee": 8, "flux": -942 },
    { "annee": 10, "flux": 10254 },
    { "annee": 15, "flux": 30618 },
    { "annee": 20, "flux": 54804 }
  ],
  "scenarios": {
    "stable": { "payback": 8.1, "van": 12340 },
    "hausse3pct": { "payback": 7.6, "van": 18420 },
    "hausse5pct": { "payback": 7.1, "van": 25890 }
  }
}
```

---

#### 4.2.3 Communauté énergétique

```
POST /v1/community/production
```

**Request body :**
```json
{
  "puissanceCrete": 30,
  "orientation": "SUD",
  "inclinaison": 30,
  "commune": "Luxembourg-Ville"
}
```

**Response :**
```json
{
  "productionAnnuelleKwh": 28500,
  "productionMensuelle": [
    { "mois": "Janvier", "kwh": 1140 },
    { "mois": "Février", "kwh": 1710 },
    { "mois": "Mars", "kwh": 2565 },
    { "mois": "Avril", "kwh": 3135 },
    { "mois": "Mai", "kwh": 3420 },
    { "mois": "Juin", "kwh": 3420 },
    { "mois": "Juillet", "kwh": 3420 },
    { "mois": "Août", "kwh": 3135 },
    { "mois": "Septembre", "kwh": 2565 },
    { "mois": "Octobre", "kwh": 1995 },
    { "mois": "Novembre", "kwh": 1140 },
    { "mois": "Décembre", "kwh": 855 }
  ],
  "coutInstallation": {
    "totalHTVA": 36000,
    "tva": 6120,
    "totalTTC": 42120
  }
}
```

---

```
POST /v1/community/simulation
```

**Request body :**
```json
{
  "production": {
    "puissanceCrete": 30,
    "orientation": "SUD",
    "inclinaison": 30,
    "commune": "Luxembourg-Ville"
  },
  "lots": [
    { "id": "A1", "surface": 85, "nbOccupants": 4, "profil": "FAMILLE_4", "consoAnnuelle": 4200, "tantiemes": 250 },
    { "id": "A2", "surface": 65, "nbOccupants": 2, "profil": "COUPLE", "consoAnnuelle": 2800, "tantiemes": 180 },
    { "id": "A3", "surface": 45, "nbOccupants": 1, "profil": "PERSONNE_SEULE", "consoAnnuelle": 1800, "tantiemes": 120 },
    { "id": "B1", "surface": 95, "nbOccupants": 4, "profil": "FAMILLE_4", "consoAnnuelle": 4500, "tantiemes": 280 },
    { "id": "B2", "surface": 70, "nbOccupants": 2, "profil": "COUPLE", "consoAnnuelle": 3000, "tantiemes": 170 }
  ],
  "repartition": "TANTIEMES",
  "prixElectriciteKwh": 0.22,
  "tarifRachatKwh": 0.08,
  "prixInterneKwh": 0.15
}
```

**Response :**
```json
{
  "global": {
    "productionAnnuelle": 28500,
    "consommationTotale": 16300,
    "autoconsommation": 13040,
    "tauxAutoconsommation": 0.458,
    "surplusInjection": 15460,
    "couvertureMoyenne": 0.80,
    "reductionCO2kg": 5130
  },
  "lots": [
    {
      "id": "A1",
      "partProduction": 7125,
      "autoconsommation": 3780,
      "tauxCouverture": 0.90,
      "economieAnnuelle": 604,
      "investissement": 10530,
      "paybackAnnees": 9.2,
      "revenuInjection": 268
    }
  ],
  "financier": {
    "investissementTotal": 42120,
    "economieGlobaleAnnuelle": 2868,
    "revenuInjectionAnnuel": 1237,
    "paybackGlobal": 10.1,
    "van15ans": 15240
  },
  "conformite": {
    "statutJuridique": { "requis": "Copropriété, ASBL ou coopérative", "conforme": true },
    "perimetre": { "requis": "Même poste de transformation ou < 1 km", "aVerifier": true },
    "contratRepartition": { "requis": "Contrat entre participants", "modeleDisponible": true },
    "declarationILR": { "requis": "Déclaration auprès de l'ILR", "lien": "https://web.ilr.lu/" }
  }
}
```

---

#### 4.2.4 Données de référence

```
GET /v1/reference/communes
GET /v1/reference/communes/{code}
GET /v1/reference/energy-prices
GET /v1/reference/classes
GET /v1/reference/subsidies
```

---

## 5. Règles de calcul

### 5.1 Green Premium / Brown Discount

Ajustements par classe énergétique (% de la valeur de référence classe D) :

| Classe | Ajustement | Source / Justification |
|--------|-----------|----------------------|
| A | +8% | Green premium — biens neufs haute performance |
| B | +5% | Bonne performance, attractif marché |
| C | +2% | Au-dessus de la moyenne |
| D | 0% | Référence — classe modale du parc LU |
| E | -3% | Performance insuffisante, travaux probables |
| F | -7% | Forte décote, rénovation nécessaire |
| G | -12% | Passoire thermique, interdiction location potentielle |
| H | -18% | Énergivore, coûts d'usage élevés |
| I | -25% | Quasi-insalubre énergétiquement |

**Fourchette :** ±1,5 point de pourcentage (reflète la variabilité par commune et type).

**Paramètres configurables :** les pourcentages ci-dessus sont des valeurs par défaut, modifiables via `application.yml` et exposés avec leur explication méthodologique dans l'API.

### 5.2 Consommation par classe

Valeur médiane utilisée pour le calcul des économies (kWh/m²/an en énergie primaire) :

| Classe | Médiane | Utilisé pour conversion en coût |
|--------|---------|-------------------------------|
| A | 35 | × prix_kwh × surface |
| B | 60 | |
| C | 93 | |
| D | 130 | |
| E | 180 | |
| F | 255 | |
| G | 350 | |
| H | 450 | |
| I | 550 | |

**Facteur énergie primaire → finale :** 0,75 (moyenne pondérée mix LU).

### 5.3 Coûts de rénovation

Portés depuis le module existant Tevaxia (`renovation-costs.ts`), avec extension aux classes H et I :

| Poste | €/m² min | €/m² max |
|-------|---------|---------|
| Isolation façade (ITE) | 120 | 220 |
| Isolation toiture | 80 | 160 |
| Isolation sol | 40 | 90 |
| Fenêtres triple vitrage | 80 | 150 |
| PAC air-eau | 100 | 200 |
| VMC double flux | 40 | 80 |
| Solaire thermique | 30 | 60 |
| Solaire PV | 50 | 100 |
| Mise aux normes élec. | 30 | 60 |

**Facteur d'âge :**
- Avant 1945 : ×1,30
- 1945-1975 : ×1,15
- 1975-1995 : ×1,05
- Après 1995 : ×1,00

### 5.4 Subventions Klimabonus

| Saut de classe | Taux subvention |
|---------------|----------------|
| 1 classe | 25% |
| 2 classes | 37,5% |
| 3 classes | 50% |
| ≥ 4 classes | 62,5% |

### 5.5 Production solaire

**Rendement estimé :** 950 kWh/kWc/an (Luxembourg, conditions moyennes).

**Facteur d'orientation :**
| Orientation | Facteur |
|-------------|---------|
| Sud 30° | 1,00 |
| Sud-Est/Sud-Ouest 30° | 0,95 |
| Est/Ouest 30° | 0,85 |
| Plat (0°) | 0,90 |
| Nord | 0,65 |

**Coût installation PV :** ~1 200 €/kWc HTVA (marché LU 2025, dégressif selon taille).

### 5.6 Profils de consommation

| Profil | Consommation annuelle (kWh) | Courbe horaire type |
|--------|---------------------------|-------------------|
| Famille 4 pers. | 4 200 | Pics matin (7-9h) + soir (17-21h) |
| Couple | 2 800 | Pic soir (18-22h) |
| Personne seule | 1 800 | Pic soir (19-22h) |
| Bureau | 3 500 | Plateau jour (8-18h) |

### 5.7 Autoconsommation

Taux d'autoconsommation estimé selon le ratio production/consommation :

- Si production ≤ consommation : taux ≈ 80% (décalage horaire)
- Si production > consommation : taux ≈ consommation/production × 0,80
- Avec stockage batterie : taux + 20 points (extension future)

---

## 6. Architecture technique

### 6.1 Vue d'ensemble

```
┌──────────────────┐       ┌────────────────────────┐
│   Frontend        │       │   Backend               │
│   React SPA       │◄─────►│   Spring Boot 3.x       │
│   (Vite + TS)     │ REST  │   Java 21               │
│                   │       │                          │
│   energy.tevaxia.eu       │   api.energy.tevaxia.eu  │
└──────────────────┘       ├────────────────────────┤
                           │ ■ ValuationController   │
                           │ ■ RenovationController  │
                           │ ■ CommunityController   │
                           │ ■ ReferenceController   │
                           ├────────────────────────┤
                           │ ■ ValuationService      │
                           │ ■ RenovationService     │
                           │ ■ CommunityService      │
                           │ ■ SubsidyService        │
                           ├────────────────────────┤
                           │ ■ EnergyCalculator      │
                           │ ■ SolarProductionModel  │
                           │ ■ ConsumptionProfiler   │
                           │ ■ FinancialCalculator   │
                           ├────────────────────────┤
                           │ ■ CommuneRepository     │
                           │ ■ EnergyPriceRepository │
                           │ ■ SimulationRepository  │
                           └──────────┬─────────────┘
                                      │
                              ┌───────▼──────┐
                              │  PostgreSQL   │
                              │  (Supabase)   │
                              └──────────────┘
```

### 6.2 Stack technique

| Composant | Technologie | Justification |
|-----------|------------|---------------|
| **Backend** | Java 21 + Spring Boot 3.4 | Profil Analyste-Développeur BRUNATA |
| **Build** | Maven | Standard entreprise |
| **API** | Spring Web (REST) | Endpoints JSON |
| **Validation** | Jakarta Validation | @Valid, @NotNull, @Size |
| **Docs API** | SpringDoc OpenAPI 3 | Swagger UI auto-générée |
| **Tests** | JUnit 5 + Mockito + Spring Boot Test | Couverture métier |
| **Frontend** | React 19 + TypeScript + Vite | SPA légère, cohérence Tevaxia |
| **Styling** | Tailwind CSS 4 | Cohérence visuelle Tevaxia |
| **Charts** | Recharts | Déjà maîtrisé sur Tevaxia |
| **Base** | PostgreSQL (Supabase) | Données de référence + sauvegarde simulations |
| **CI/CD** | GitHub Actions | Build + test + deploy |
| **Deploy backend** | Railway / Render | JVM hosting simple |
| **Deploy frontend** | Vercel | Même infra que Tevaxia |

### 6.3 Structure du projet

```
tevaxia-energy/
├── backend/
│   ├── pom.xml
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/eu/tevaxia/energy/
│   │   │   │   ├── TevaxiaEnergyApplication.java
│   │   │   │   ├── config/
│   │   │   │   │   ├── CorsConfig.java
│   │   │   │   │   └── OpenApiConfig.java
│   │   │   │   ├── controller/
│   │   │   │   │   ├── ValuationImpactController.java
│   │   │   │   │   ├── RenovationController.java
│   │   │   │   │   ├── CommunityController.java
│   │   │   │   │   └── ReferenceDataController.java
│   │   │   │   ├── service/
│   │   │   │   │   ├── ValuationImpactService.java
│   │   │   │   │   ├── RenovationCostService.java
│   │   │   │   │   ├── RenovationProfitabilityService.java
│   │   │   │   │   ├── SubsidyService.java
│   │   │   │   │   ├── CommunitySimulationService.java
│   │   │   │   │   └── SolarProductionService.java
│   │   │   │   ├── model/
│   │   │   │   │   ├── enums/
│   │   │   │   │   │   ├── ClasseEnergie.java
│   │   │   │   │   │   ├── PropertyType.java
│   │   │   │   │   │   ├── HeatingType.java
│   │   │   │   │   │   └── ...
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── ValuationImpactRequest.java
│   │   │   │   │   │   ├── ValuationImpactResponse.java
│   │   │   │   │   │   ├── RenovationCostRequest.java
│   │   │   │   │   │   ├── RenovationCostResponse.java
│   │   │   │   │   │   ├── CommunitySimRequest.java
│   │   │   │   │   │   ├── CommunitySimResponse.java
│   │   │   │   │   │   └── ...
│   │   │   │   │   └── entity/
│   │   │   │   │       ├── Commune.java
│   │   │   │   │       ├── EnergyPrice.java
│   │   │   │   │       └── SimulationResult.java
│   │   │   │   ├── repository/
│   │   │   │   │   ├── CommuneRepository.java
│   │   │   │   │   └── SimulationRepository.java
│   │   │   │   ├── calculator/
│   │   │   │   │   ├── GreenPremiumCalculator.java
│   │   │   │   │   ├── RenovationCostCalculator.java
│   │   │   │   │   ├── FinancialCalculator.java
│   │   │   │   │   ├── SolarProductionCalculator.java
│   │   │   │   │   └── AutoconsumptionCalculator.java
│   │   │   │   └── exception/
│   │   │   │       ├── GlobalExceptionHandler.java
│   │   │   │       └── ValidationException.java
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       └── data/
│   │   │           ├── communes.json
│   │   │           └── energy-prices.json
│   │   └── test/
│   │       └── java/eu/tevaxia/energy/
│   │           ├── calculator/
│   │           │   ├── GreenPremiumCalculatorTest.java
│   │           │   ├── RenovationCostCalculatorTest.java
│   │           │   └── FinancialCalculatorTest.java
│   │           └── controller/
│   │               ├── ValuationImpactControllerTest.java
│   │               └── ...
│   └── Dockerfile
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       │   └── client.ts
│       ├── pages/
│       │   ├── Home.tsx
│       │   ├── ValuationImpact.tsx
│       │   ├── Renovation.tsx
│       │   └── Community.tsx
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── Header.tsx
│       │   ├── Footer.tsx
│       │   ├── InputField.tsx
│       │   ├── ResultPanel.tsx
│       │   └── charts/
│       │       ├── PremiumChart.tsx
│       │       ├── PaybackChart.tsx
│       │       ├── ProductionChart.tsx
│       │       └── SankeyDiagram.tsx
│       └── styles/
│           └── globals.css
│
└── docs/
    ├── SPEC-FONCTIONNELLE.md
    ├── API.md (généré par SpringDoc)
    └── USER-STORIES.md
```

---

## 7. Exigences non-fonctionnelles

| Exigence | Critère | Mesure |
|----------|---------|--------|
| **Performance** | Temps de réponse API < 200ms | Test de charge |
| **Disponibilité** | 99,5% uptime | Monitoring Railway/Render |
| **Sécurité** | CORS, rate limiting, input validation | Spring Security |
| **Accessibilité** | WCAG 2.1 AA | Axe/Lighthouse |
| **SEO** | Lighthouse > 90 | CI check |
| **Responsive** | Mobile-first | Tailwind breakpoints |
| **i18n** | FR + EN | Comme Tevaxia principal |
| **Tests** | Couverture > 80% métier | JaCoCo |
| **Documentation** | OpenAPI 3.0 auto-générée | SpringDoc |

---

## 8. Roadmap

### Phase 1 — MVP (Simulateur 1 : Impact valorisation)
- [ ] Scaffolding Spring Boot + React
- [ ] Endpoint `/v1/valuation-impact`
- [ ] Page frontend avec formulaire + résultats
- [ ] Tableau comparatif multi-classes
- [ ] Export PDF
- [ ] Tests unitaires calculateurs
- [ ] Déploiement energy.tevaxia.eu

### Phase 2 — Simulateur 2 : Rentabilité rénovation
- [ ] Endpoints coûts + aides + rentabilité
- [ ] Page frontend avec workflow 3 étapes
- [ ] Graphique payback + scénarios
- [ ] Mode copropriété (syndic)
- [ ] Tests intégration

### Phase 3 — Simulateur 3 : Communauté énergétique
- [ ] Endpoints production + simulation communauté
- [ ] Page frontend avec config lots
- [ ] Graphiques (production, Sankey)
- [ ] Checklist conformité
- [ ] Tests E2E

### Phase 4 — Polish & intégration
- [ ] Intégration cross-links Tevaxia ↔ Energy
- [ ] i18n complet (EN)
- [ ] Documentation Agile (user stories, critères d'acceptation)
- [ ] Swagger UI publique
- [ ] Optimisation performance

---

## 9. Glossaire

| Terme | Définition |
|-------|-----------|
| **Green premium** | Surcote de valeur pour les biens à haute performance énergétique |
| **Brown discount** | Décote de valeur pour les biens énergivores |
| **Passeport énergétique** | Document obligatoire LU classant la performance énergétique (A-I) |
| **Klimabonus** | Programme de subventions LU pour la rénovation énergétique |
| **Klimaprêt** | Prêt à taux préférentiel (1,5%) pour travaux de rénovation |
| **Communauté d'énergie** | Groupe de consommateurs partageant une production locale |
| **Autoconsommation** | Part de l'énergie produite consommée sur place |
| **ILR** | Institut Luxembourgeois de Régulation (régulateur énergie) |
| **EPBD** | Energy Performance of Buildings Directive (directive UE) |
| **LTV** | Loan-to-Value (ratio prêt/valeur, utilisé par les banques) |
| **VAN** | Valeur Actuelle Nette (Net Present Value) |
| **TRI** | Taux de Rendement Interne (Internal Rate of Return) |
| **Payback** | Temps de retour sur investissement |
| **kWc** | Kilowatt-crête (puissance nominale panneaux solaires) |
| **PVGIS** | Photovoltaic Geographical Information System (données ensoleillement UE) |
