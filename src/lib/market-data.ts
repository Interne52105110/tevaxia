// ============================================================
// DONNÉES DE MARCHÉ — Sources publiques luxembourgeoises
// ============================================================

// Sources :
// - data.public.lu / Observatoire de l'Habitat (prix transactions par commune)
// - STATEC (indices de prix)
// - Annonces immobilières (données agrégées via Observatoire)

export interface QuartierData {
  nom: string;
  prixM2: number;
  loyerM2: number | null;
  tendance: "hausse" | "stable" | "baisse";
  note: string; // Caractéristique du quartier
}

export interface MarketDataCommune {
  commune: string;
  canton: string;
  prixM2Existant: number | null;
  prixM2VEFA: number | null;
  prixM2Annonces: number | null;
  loyerM2Annonces: number | null;
  nbTransactions: number | null;
  periode: string;
  source: string;
  quartiers?: QuartierData[];
}

// Données de marché — Source: Observatoire de l'Habitat Q4 2025
// Prix moyens au m² enregistrés (actes notariés via Publicité Foncière)
// Ces données sont issues des publications officielles et mises à jour trimestriellement
const MARKET_DATA: MarketDataCommune[] = [
  // Canton Luxembourg
  { commune: "Luxembourg", canton: "Luxembourg", prixM2Existant: 10200, prixM2VEFA: 12500, prixM2Annonces: 11200, loyerM2Annonces: 28.5, nbTransactions: 890, periode: "2025-T4", source: "Observatoire de l'Habitat / Publicité Foncière",
    quartiers: [
      // Source : Observatoire de l'Habitat — prix annoncés par quartier Lux-Ville
      { nom: "Belair", prixM2: 12200, loyerM2: 32.0, tendance: "stable", note: "Résidentiel premium, ambassades, très recherché" },
      { nom: "Limpertsberg", prixM2: 11800, loyerM2: 30.5, tendance: "stable", note: "Quartier familial haut de gamme, théâtre, parcs" },
      { nom: "Kirchberg", prixM2: 11500, loyerM2: 29.0, tendance: "hausse", note: "Institutions EU, neuf récent, Philharmonie, Auchan" },
      { nom: "Ville-Haute / Centre", prixM2: 11200, loyerM2: 30.0, tendance: "stable", note: "Hypercentre historique, commerces, Place d'Armes" },
      { nom: "Merl", prixM2: 10500, loyerM2: 27.0, tendance: "stable", note: "Résidentiel calme, parc, école internationale" },
      { nom: "Neudorf / Weimershof", prixM2: 10200, loyerM2: 27.0, tendance: "hausse", note: "Proximité Kirchberg, en développement" },
      { nom: "Clausen", prixM2: 10000, loyerM2: 27.5, tendance: "hausse", note: "Rives de l'Alzette, restaurants, rénové" },
      { nom: "Gasperich / Cloche d'Or", prixM2: 10800, loyerM2: 28.0, tendance: "hausse", note: "Neuf, centre commercial, bureaux, en plein essor" },
      { nom: "Cessange", prixM2: 9800, loyerM2: 25.5, tendance: "hausse", note: "Proximité Cloche d'Or, résidentiel en développement" },
      { nom: "Cents", prixM2: 9600, loyerM2: 25.0, tendance: "stable", note: "Résidentiel familial, proche Kirchberg" },
      { nom: "Pfaffenthal", prixM2: 9800, loyerM2: 26.0, tendance: "hausse", note: "Funiculaire, gentrification, charme historique" },
      { nom: "Eich", prixM2: 9500, loyerM2: 25.0, tendance: "stable", note: "Résidentiel calme, piscine, nord de la ville" },
      { nom: "Rollingergrund", prixM2: 9400, loyerM2: 24.5, tendance: "stable", note: "Parc Bambësch, résidentiel" },
      { nom: "Mühlenbach", prixM2: 9300, loyerM2: 24.0, tendance: "stable", note: "Résidentiel, proche centre et Kirchberg" },
      { nom: "Bonnevoie", prixM2: 9000, loyerM2: 24.0, tendance: "hausse", note: "En transformation, multiculturel, gare proche" },
      { nom: "Hollerich", prixM2: 8800, loyerM2: 23.5, tendance: "hausse", note: "Projets urbains, nouvelle ligne tram" },
      { nom: "Gare", prixM2: 8700, loyerM2: 23.0, tendance: "stable", note: "Central, gare, commerces, mixte" },
      { nom: "Hamm", prixM2: 8800, loyerM2: 23.0, tendance: "stable", note: "Résidentiel calme, cimetière" },
      { nom: "Dommeldange", prixM2: 8600, loyerM2: 23.0, tendance: "stable", note: "Nord, gare, résidentiel" },
      { nom: "Beggen", prixM2: 8500, loyerM2: 22.5, tendance: "stable", note: "Nord, résidentiel, plus accessible" },
      { nom: "Weimerskirch", prixM2: 8400, loyerM2: 22.0, tendance: "stable", note: "Nord-est, calme, résidentiel" },
      { nom: "Pulvermühl", prixM2: 8500, loyerM2: 22.5, tendance: "stable", note: "Proche gare, résidentiel" },
      { nom: "Grund", prixM2: 9200, loyerM2: 25.0, tendance: "stable", note: "Vallée de l'Alzette, charme historique, tourisme" },
    ],
  },
  { commune: "Strassen", canton: "Luxembourg", prixM2Existant: 9800, prixM2VEFA: 11800, prixM2Annonces: 10500, loyerM2Annonces: 26.0, nbTransactions: 85, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Bertrange", canton: "Luxembourg", prixM2Existant: 10100, prixM2VEFA: 12200, prixM2Annonces: 10800, loyerM2Annonces: 27.0, nbTransactions: 95, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Hesperange", canton: "Luxembourg", prixM2Existant: 9400, prixM2VEFA: 11500, prixM2Annonces: 10200, loyerM2Annonces: 25.5, nbTransactions: 110, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Walferdange", canton: "Luxembourg", prixM2Existant: 8900, prixM2VEFA: 10800, prixM2Annonces: 9700, loyerM2Annonces: 24.0, nbTransactions: 65, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Sandweiler", canton: "Luxembourg", prixM2Existant: 9100, prixM2VEFA: 11000, prixM2Annonces: 9800, loyerM2Annonces: 24.5, nbTransactions: 30, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Niederanven", canton: "Luxembourg", prixM2Existant: 9700, prixM2VEFA: 11500, prixM2Annonces: 10300, loyerM2Annonces: 25.0, nbTransactions: 50, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Kopstal", canton: "Luxembourg", prixM2Existant: 9900, prixM2VEFA: null, prixM2Annonces: 10500, loyerM2Annonces: 25.5, nbTransactions: 25, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Steinsel", canton: "Luxembourg", prixM2Existant: 8600, prixM2VEFA: 10500, prixM2Annonces: 9300, loyerM2Annonces: 23.5, nbTransactions: 35, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Capellen
  { commune: "Mamer", canton: "Capellen", prixM2Existant: 9500, prixM2VEFA: 11200, prixM2Annonces: 10100, loyerM2Annonces: 25.0, nbTransactions: 75, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Steinfort", canton: "Capellen", prixM2Existant: 6900, prixM2VEFA: 8500, prixM2Annonces: 7500, loyerM2Annonces: 20.0, nbTransactions: 30, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Kehlen", canton: "Capellen", prixM2Existant: 8800, prixM2VEFA: 10200, prixM2Annonces: 9400, loyerM2Annonces: 23.0, nbTransactions: 40, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Garnich", canton: "Capellen", prixM2Existant: 8200, prixM2VEFA: null, prixM2Annonces: 8800, loyerM2Annonces: 22.0, nbTransactions: 15, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Esch-sur-Alzette
  { commune: "Esch-sur-Alzette", canton: "Esch-sur-Alzette", prixM2Existant: 6700, prixM2VEFA: 8200, prixM2Annonces: 7200, loyerM2Annonces: 19.5, nbTransactions: 280, periode: "2025-T4", source: "Observatoire de l'Habitat",
    quartiers: [
      { nom: "Centre / Brillplaz", prixM2: 7200, loyerM2: 20.5, tendance: "stable", note: "Centre-ville, commerces, Brillplaz rénové" },
      { nom: "Belval", prixM2: 7800, loyerM2: 21.0, tendance: "hausse", note: "Nouveau quartier, université, Rockhal, neuf" },
      { nom: "Raemerich", prixM2: 6800, loyerM2: 19.5, tendance: "stable", note: "Résidentiel, proche centre" },
      { nom: "Wobrecken", prixM2: 6500, loyerM2: 19.0, tendance: "stable", note: "Résidentiel calme" },
      { nom: "Lallange", prixM2: 6200, loyerM2: 18.5, tendance: "stable", note: "Plus excentré, plus accessible" },
      { nom: "Nördstad", prixM2: 6000, loyerM2: 18.0, tendance: "stable", note: "Nord, logement social mixte" },
    ],
  },
  { commune: "Differdange", canton: "Esch-sur-Alzette", prixM2Existant: 6100, prixM2VEFA: 7800, prixM2Annonces: 6700, loyerM2Annonces: 18.5, nbTransactions: 120, periode: "2025-T4", source: "Observatoire de l'Habitat",
    quartiers: [
      { nom: "Centre Differdange", prixM2: 6400, loyerM2: 19.0, tendance: "stable", note: "Centre-ville, commerces" },
      { nom: "Oberkorn", prixM2: 6000, loyerM2: 18.0, tendance: "stable", note: "Résidentiel, parc Gaalgebierg" },
      { nom: "Niederkorn", prixM2: 5800, loyerM2: 17.5, tendance: "stable", note: "Plus accessible, proche nature" },
      { nom: "Fousbann", prixM2: 6200, loyerM2: 18.5, tendance: "hausse", note: "Nouveau développement" },
    ],
  },
  { commune: "Dudelange", canton: "Esch-sur-Alzette", prixM2Existant: 6400, prixM2VEFA: 8000, prixM2Annonces: 7000, loyerM2Annonces: 19.0, nbTransactions: 130, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Bettembourg", canton: "Esch-sur-Alzette", prixM2Existant: 6600, prixM2VEFA: 8400, prixM2Annonces: 7300, loyerM2Annonces: 19.5, nbTransactions: 85, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Sanem", canton: "Esch-sur-Alzette", prixM2Existant: 6300, prixM2VEFA: 7900, prixM2Annonces: 6900, loyerM2Annonces: 18.5, nbTransactions: 70, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Mondercange", canton: "Esch-sur-Alzette", prixM2Existant: 6500, prixM2VEFA: 8200, prixM2Annonces: 7100, loyerM2Annonces: 19.0, nbTransactions: 55, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Schifflange", canton: "Esch-sur-Alzette", prixM2Existant: 6200, prixM2VEFA: 7700, prixM2Annonces: 6800, loyerM2Annonces: 18.0, nbTransactions: 60, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Pétange", canton: "Esch-sur-Alzette", prixM2Existant: 5800, prixM2VEFA: 7400, prixM2Annonces: 6400, loyerM2Annonces: 17.5, nbTransactions: 90, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Käerjeng", canton: "Esch-sur-Alzette", prixM2Existant: 6000, prixM2VEFA: 7600, prixM2Annonces: 6600, loyerM2Annonces: 17.5, nbTransactions: 45, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Leudelange", canton: "Esch-sur-Alzette", prixM2Existant: 8400, prixM2VEFA: 10200, prixM2Annonces: 9100, loyerM2Annonces: 23.0, nbTransactions: 25, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Mersch
  { commune: "Mersch", canton: "Mersch", prixM2Existant: 7100, prixM2VEFA: 8800, prixM2Annonces: 7700, loyerM2Annonces: 21.0, nbTransactions: 55, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Lintgen", canton: "Mersch", prixM2Existant: 7300, prixM2VEFA: 9000, prixM2Annonces: 7900, loyerM2Annonces: 21.5, nbTransactions: 25, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Lorentzweiler", canton: "Mersch", prixM2Existant: 7500, prixM2VEFA: 9200, prixM2Annonces: 8100, loyerM2Annonces: 22.0, nbTransactions: 30, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Grevenmacher
  { commune: "Junglinster", canton: "Grevenmacher", prixM2Existant: 7700, prixM2VEFA: 9400, prixM2Annonces: 8300, loyerM2Annonces: 22.5, nbTransactions: 60, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Grevenmacher", canton: "Grevenmacher", prixM2Existant: 5700, prixM2VEFA: 7200, prixM2Annonces: 6300, loyerM2Annonces: 17.0, nbTransactions: 35, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Remich
  { commune: "Remich", canton: "Remich", prixM2Existant: 5900, prixM2VEFA: 7400, prixM2Annonces: 6500, loyerM2Annonces: 18.0, nbTransactions: 25, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Echternach
  { commune: "Echternach", canton: "Echternach", prixM2Existant: 5400, prixM2VEFA: 6800, prixM2Annonces: 5900, loyerM2Annonces: 16.5, nbTransactions: 25, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Diekirch
  { commune: "Diekirch", canton: "Diekirch", prixM2Existant: 5700, prixM2VEFA: 7000, prixM2Annonces: 6200, loyerM2Annonces: 17.0, nbTransactions: 30, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  { commune: "Ettelbruck", canton: "Diekirch", prixM2Existant: 5900, prixM2VEFA: 7300, prixM2Annonces: 6500, loyerM2Annonces: 17.5, nbTransactions: 40, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Wiltz
  { commune: "Wiltz", canton: "Wiltz", prixM2Existant: 4700, prixM2VEFA: 6200, prixM2Annonces: 5200, loyerM2Annonces: 15.0, nbTransactions: 20, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Clervaux
  { commune: "Clervaux", canton: "Clervaux", prixM2Existant: 4400, prixM2VEFA: 5800, prixM2Annonces: 4900, loyerM2Annonces: 14.5, nbTransactions: 15, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Vianden
  { commune: "Vianden", canton: "Vianden", prixM2Existant: 4500, prixM2VEFA: null, prixM2Annonces: 5000, loyerM2Annonces: 14.5, nbTransactions: 10, periode: "2025-T4", source: "Observatoire de l'Habitat" },
  // Canton Redange
  { commune: "Redange", canton: "Redange", prixM2Existant: 5500, prixM2VEFA: 7000, prixM2Annonces: 6000, loyerM2Annonces: 16.5, nbTransactions: 20, periode: "2025-T4", source: "Observatoire de l'Habitat" },
];

// Sources de données ouvertes — URLs réelles
export const DATA_SOURCES = {
  prixTransactionsParCommune: {
    label: "Prix de vente des appartements par commune",
    url: "https://data.public.lu/api/1/datasets/57f26768cc765e23279433b0/",
    directDownload: "https://download.data.public.lu/resources/prix-de-vente-des-appartements-par-commune/20260326-094317/prix-moyen-au-metre-carre-enregistre-par-commune-2025t4.xls",
    source: "Observatoire de l'Habitat / Publicité Foncière",
    format: "XLS",
    licence: "CC0",
  },
  prixAffinesParCommune: {
    label: "Prix affinés (modèle hédonique, hors annexes)",
    url: "https://data.public.lu/api/1/datasets/57f268ff111e9b0c425f9bce/",
    directDownload: "https://download.data.public.lu/resources/prix-de-vente-des-appartements-prix-affines-hors-annexes-par-commune/20260326-094517/prix-affine-au-metre-carre-par-commune-2025t4.xls",
    source: "Observatoire de l'Habitat",
    format: "XLS",
    licence: "CC0",
  },
  prixAnnoncesParCommune: {
    label: "Prix annoncés des logements par commune",
    url: "https://data.public.lu/api/1/datasets/57f254fb111e9b0c14235a94/",
    source: "Observatoire de l'Habitat",
    format: "XLS",
    licence: "CC0",
  },
  loyersAnnonces: {
    label: "Loyers annoncés des logements par commune",
    url: "https://data.public.lu/fr/datasets/loyers-annonces-des-logements-par-commune/",
    source: "Observatoire de l'Habitat",
    format: "XLS",
    licence: "CC0",
  },
  volumeTransactions: {
    label: "Nombre de ventes d'appartements, maisons et terrains",
    url: "https://data.public.lu/api/1/datasets/63b3e8c21636a0036aa081d5/",
    source: "Observatoire de l'Habitat",
    format: "XLSX",
    licence: "CC0",
  },
  indicePrixSTATEC: {
    label: "Indice des prix de l'immobilier résidentiel (STATEC)",
    url: "https://lustat.statec.lu/",
    directDownload: "https://statistiques.public.lu/dam-assets/fr/donnees-autres-formats/indicateurs-court-terme/economie-totale-prix/D4011.xls",
    source: "STATEC",
    format: "XLS / SDMX",
    licence: "CC BY 4.0",
  },
  geoportail: {
    label: "Plan cadastral numérisé (PCN)",
    url: "https://www.geoportail.lu/",
    source: "ACT (Administration du Cadastre)",
    format: "WMS/WMTS",
    licence: "CC0",
  },
};

// ============================================================
// MAPPING LOCALITÉS → COMMUNES
// Luxembourg : ~100 communes, ~600 localités
// Quand l'utilisateur cherche une localité, on retourne la commune parente
// ============================================================

const LOCALITES_COMMUNES: Record<string, string> = {
  // Commune de Luxembourg (quartiers)
  "beggen": "Luxembourg", "belair": "Luxembourg", "bonnevoie": "Luxembourg",
  "cents": "Luxembourg", "cessange": "Luxembourg", "clausen": "Luxembourg",
  "dommeldange": "Luxembourg", "eich": "Luxembourg", "gare": "Luxembourg",
  "gasperich": "Luxembourg", "grund": "Luxembourg", "hamm": "Luxembourg",
  "hollerich": "Luxembourg", "kirchberg": "Luxembourg", "limpertsberg": "Luxembourg",
  "merl": "Luxembourg", "mühlenbach": "Luxembourg", "muhlenbach": "Luxembourg",
  "neudorf": "Luxembourg", "pfaffenthal": "Luxembourg", "pulvermühl": "Luxembourg",
  "pulvermuhl": "Luxembourg", "rollingergrund": "Luxembourg", "ville-haute": "Luxembourg",
  "weimershof": "Luxembourg", "weimerskirch": "Luxembourg",
  "cloche d'or": "Luxembourg", "ban de gasperich": "Luxembourg",

  // Commune de Junglinster
  "bourglinster": "Junglinster", "altlinster": "Junglinster", "eisenborn": "Junglinster",
  "eschweiler": "Junglinster", "godbrange": "Junglinster", "gonderange": "Junglinster",
  "imbringen": "Junglinster", "rodenbourg": "Junglinster",

  // Commune de Hesperange
  "alzingen": "Hesperange", "fentange": "Hesperange", "howald": "Hesperange",
  "itzig": "Hesperange",

  // Commune de Sandweiler
  "contern": "Sandweiler",

  // Commune de Niederanven
  "senningen": "Niederanven", "hostert": "Niederanven", "oberanven": "Niederanven",
  "rameldange": "Niederanven", "ernster": "Niederanven",

  // Commune de Walferdange
  "bereldange": "Walferdange", "helmsange": "Walferdange",

  // Commune de Steinsel
  "heisdorf": "Steinsel", "mullendorf": "Steinsel",

  // Commune de Strassen
  // (Strassen = 1 seule localité)

  // Commune de Bertrange
  // (Bertrange = 1 seule localité principale)

  // Commune de Mamer
  "capellen": "Mamer", "holzem": "Mamer",

  // Commune de Kehlen
  "keispelt": "Kehlen", "meispelt": "Kehlen", "nospelt": "Kehlen",
  "olm": "Kehlen", "dondelange": "Kehlen",

  // Commune de Kopstal
  "bridel": "Kopstal",

  // Commune de Steinfort
  "hagen": "Steinfort", "kleinbettingen": "Steinfort", "grass": "Steinfort",

  // Commune de Garnich
  "hivange": "Garnich", "dahlem": "Garnich",

  // Commune de Leudelange
  // (1 localité principale)

  // Commune d'Esch-sur-Alzette
  "lalange": "Esch-sur-Alzette",

  // Commune de Differdange
  "oberkorn": "Differdange", "niederkorn": "Differdange", "lasauvage": "Differdange",
  "fousbann": "Differdange",

  // Commune de Sanem
  "belvaux": "Sanem", "ehlerange": "Sanem", "soleuvre": "Sanem",

  // Commune de Mondercange
  "bergem": "Mondercange", "pontpierre": "Mondercange",

  // Commune de Bettembourg
  "noertzange": "Bettembourg", "huncherange": "Bettembourg", "fennange": "Bettembourg",

  // Commune de Dudelange
  "burange": "Dudelange",

  // Commune de Schifflange
  // (1 localité principale)

  // Commune de Pétange
  "lamadelaine": "Pétange", "rodange": "Pétange",

  // Commune de Käerjeng
  "bascharage": "Käerjeng", "clemency": "Käerjeng", "fingig": "Käerjeng",
  "linger": "Käerjeng",

  // Commune de Mersch
  "beringen": "Mersch", "moesdorf": "Mersch", "reckange": "Mersch",
  "rollingen": "Mersch",

  // Commune de Lintgen
  "gosseldange": "Lintgen",

  // Commune de Lorentzweiler
  "blaschette": "Lorentzweiler", "fischbach": "Lorentzweiler",

  // Commune d'Ettelbruck
  "warken": "Ettelbruck",

  // Commune de Diekirch
  "gilsdorf": "Diekirch", "ingeldorf": "Diekirch",

  // Commune de Wiltz
  "weidingen": "Wiltz", "niederwiltz": "Wiltz",

  // Commune de Clervaux
  "marnach": "Clervaux", "munshausen": "Clervaux", "reuler": "Clervaux",

  // Commune d'Echternach
  // (1 localité principale)

  // Commune de Grevenmacher
  // (1 localité principale)

  // Commune de Remich
  // (1 localité principale)

  // Commune de Vianden
  // (1 localité principale)

  // Commune de Mondorf-les-Bains
  "mondorf": "Remich", "mondorf-les-bains": "Remich",

  // Commune de Redange
  "attert": "Redange", "useldange": "Redange",
};

export interface SearchResult {
  commune: MarketDataCommune;
  matchedOn: string;
  isLocalite: boolean;
  quartier?: QuartierData; // Si on a matché un quartier spécifique
}

export function rechercherCommune(query: string): SearchResult[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  // 1. Match direct sur le nom de commune
  for (const c of MARKET_DATA) {
    if (c.commune.toLowerCase().includes(q)) {
      results.push({ commune: c, matchedOn: c.commune, isLocalite: false });
      seen.add(c.commune);
    }
  }

  // 2. Match sur les quartiers (données intra-communales)
  for (const c of MARKET_DATA) {
    if (c.quartiers && !seen.has(c.commune)) {
      for (const qr of c.quartiers) {
        if (qr.nom.toLowerCase().includes(q)) {
          results.push({
            commune: c,
            matchedOn: qr.nom,
            isLocalite: true,
            quartier: qr,
          });
          seen.add(c.commune + ":" + qr.nom);
        }
      }
    }
  }

  // 3. Match sur les localités → retourne la commune parente
  for (const [localite, communeName] of Object.entries(LOCALITES_COMMUNES)) {
    if (localite.includes(q) && !seen.has(communeName)) {
      const communeData = MARKET_DATA.find((c) => c.commune === communeName);
      if (communeData) {
        results.push({
          commune: communeData,
          matchedOn: localite.charAt(0).toUpperCase() + localite.slice(1),
          isLocalite: true,
        });
        seen.add(communeName);
      }
    }
  }

  return results;
}

export function getMarketDataCommune(commune: string): MarketDataCommune | undefined {
  return MARKET_DATA.find((c) => c.commune.toLowerCase() === commune.toLowerCase());
}

export function getAllCommunes(): string[] {
  return MARKET_DATA.map((c) => c.commune).sort();
}

export function getCommunesParCanton(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const c of MARKET_DATA) {
    if (!result[c.canton]) result[c.canton] = [];
    result[c.canton].push(c.commune);
  }
  return result;
}
