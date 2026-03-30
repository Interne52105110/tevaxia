// ============================================================
// DONNÉES DE MARCHÉ — TOUS SEGMENTS (hors résidentiel commune)
// ============================================================
// Sources principales :
// - Cushman & Wakefield MarketBeat Luxembourg (trimestriel, gratuit)
// - JLL Luxembourg Office Market Dynamics (trimestriel)
// - CBRE Luxembourg MarketView (trimestriel)
// - INOWAI Market Reports (trimestriel bureaux, semestriel retail/hôtel)
// - BNP Paribas Real Estate Luxembourg
// - Savills Luxembourg
// - STATEC (construction, tourisme, HPI)
// - BCL (taux hypothécaires, stabilité financière)
// - Observatoire de l'Habitat (terrains, rendements locatifs)
// - WarehouseRentInfo.lu / OfficeRentInfo.lu

import { formatEUR } from "./calculations";

// ============================================================
// BUREAUX — Par sous-marché
// ============================================================

export interface OfficeSubmarket {
  nom: string;
  loyerPrime: number; // €/m²/mois
  loyerMoyen: number;
  vacance: number; // %
  stock: number; // m² total
  tendance: "hausse" | "stable" | "baisse";
  note: string;
}

export const OFFICE_SUBMARKETS: OfficeSubmarket[] = [
  // Source : Cushman & Wakefield Q4 2025 + CBRE Q3 2025
  { nom: "CBD (Centre-Ville)", loyerPrime: 54, loyerMoyen: 48, vacance: 3.4, stock: 450_000, tendance: "stable", note: "Prime historique, stock limité, peu de neuf" },
  { nom: "Kirchberg", loyerPrime: 42, loyerMoyen: 38, vacance: 4.5, stock: 950_000, tendance: "hausse", note: "Institutions EU, BEI, Cour de Justice. Pipeline important" },
  { nom: "Cloche d'Or / Gasperich", loyerPrime: 40, loyerMoyen: 36, vacance: 6.0, stock: 350_000, tendance: "hausse", note: "Nouveau quartier d'affaires, Deloitte, PwC, Alter Domus" },
  { nom: "Gare / Hollerich", loyerPrime: 38, loyerMoyen: 34, vacance: 5.5, stock: 300_000, tendance: "hausse", note: "Renouveau urbain, tram, projets Royal-Hamilius" },
  { nom: "Hamm / Pulvermühl", loyerPrime: 32, loyerMoyen: 28, vacance: 7.0, stock: 150_000, tendance: "stable", note: "Secondaire, prix attractifs" },
  { nom: "Strassen / Bertrange", loyerPrime: 30, loyerMoyen: 26, vacance: 8.5, stock: 200_000, tendance: "baisse", note: "Parc d'activités, moins central" },
  { nom: "Leudelange / Howald", loyerPrime: 28, loyerMoyen: 24, vacance: 9.0, stock: 180_000, tendance: "stable", note: "Accessibilité autoroute, parking" },
  { nom: "Munsbach / Senningerberg", loyerPrime: 26, loyerMoyen: 22, vacance: 10.0, stock: 120_000, tendance: "stable", note: "Aéroport, Amazon, eBay" },
  { nom: "Esch-Belval", loyerPrime: 24, loyerMoyen: 20, vacance: 12.0, stock: 100_000, tendance: "stable", note: "Université, incubateurs, coût modéré" },
];

export const OFFICE_MARKET_SUMMARY = {
  takeUpAnnuel: 181_160, // m² en 2025
  takeUpEvolution: "+36% vs 2024",
  yieldPrime: 4.5, // %
  pipelineEnConstruction: 447_671, // m²
  vacanceGlobale: 5.2, // %
  vacanceCentrale: 3.4,
  investissementTotal: 839_000_000, // € total CRE en 2025
  partBureaux: 0.40, // 40% du volume investi
  periode: "2025",
  sources: [
    { nom: "Cushman & Wakefield MarketBeat", url: "https://www.cushmanwakefield.com/en/luxembourg/insights/luxembourg-marketbeat/office-marketbeat", frequence: "Trimestriel", gratuit: true },
    { nom: "JLL Office Market Dynamics", url: "https://www.jll.com/en-belux/insights/market-dynamics/luxembourg-office", frequence: "Trimestriel", gratuit: true },
    { nom: "CBRE Luxembourg MarketView", url: "https://www.cbre.lu/insights", frequence: "Trimestriel", gratuit: true },
    { nom: "BNP Paribas Real Estate", url: "https://www.realestate.bnpparibas.lu/en/market-research", frequence: "Trimestriel", gratuit: true },
    { nom: "INOWAI Market Report", url: "https://www.inowai.com/en/real-estate-research-data/", frequence: "Trimestriel", gratuit: true },
    { nom: "OfficeRentInfo.lu", url: "https://www.officerentinfo.lu/", frequence: "Live", gratuit: true },
  ],
};

// ============================================================
// COMMERCES / RETAIL
// ============================================================

export interface RetailLocation {
  nom: string;
  type: "high_street" | "centre_commercial" | "retail_park";
  loyerPrime: number; // €/m²/mois
  loyerMoyen: number;
  tendance: "hausse" | "stable" | "baisse";
  note: string;
}

export const RETAIL_LOCATIONS: RetailLocation[] = [
  // Source : INOWAI Retail Market Report S2 2025
  { nom: "Grand-Rue (Luxembourg)", type: "high_street", loyerPrime: 145, loyerMoyen: 110, tendance: "stable", note: "Artère piétonne principale, luxe et enseignes internationales" },
  { nom: "Rue Philippe II", type: "high_street", loyerPrime: 120, loyerMoyen: 95, tendance: "stable", note: "Place d'Armes, restauration et mode" },
  { nom: "Avenue de la Gare", type: "high_street", loyerPrime: 80, loyerMoyen: 55, tendance: "hausse", note: "En renouveau, tram, flux piétons croissant" },
  { nom: "Royal-Hamilius", type: "centre_commercial", loyerPrime: 90, loyerMoyen: 70, tendance: "stable", note: "Centre commercial premium, Fnac, food hall" },
  { nom: "Cloche d'Or Shopping", type: "centre_commercial", loyerPrime: 65, loyerMoyen: 50, tendance: "stable", note: "Centre commercial récent, 75 000 m²" },
  { nom: "City Concorde (Bertrange)", type: "centre_commercial", loyerPrime: 45, loyerMoyen: 35, tendance: "stable", note: "Galerie marchande, Cactus" },
  { nom: "Belle Étoile (Bertrange)", type: "centre_commercial", loyerPrime: 55, loyerMoyen: 40, tendance: "baisse", note: "Centre commercial historique, en mutation" },
  { nom: "Belval Plaza", type: "centre_commercial", loyerPrime: 35, loyerMoyen: 25, tendance: "stable", note: "Esch-Belval, quartier universitaire" },
  { nom: "Esch centre-ville", type: "high_street", loyerPrime: 45, loyerMoyen: 30, tendance: "stable", note: "2e ville du pays, rue de l'Alzette" },
  { nom: "Retail parks (moyenne)", type: "retail_park", loyerPrime: 18, loyerMoyen: 14, tendance: "stable", note: "Zones d'activités, Foetz, Leudelange, Windhof" },
];

export const RETAIL_MARKET_SUMMARY = {
  yieldPrime: 5.0, // %
  partInvestissement: 0.22, // 22% du volume investi en 2025
  tauxEffortMoyen: "8-10%", // Loyer/CA
  periode: "2025",
  sources: [
    { nom: "INOWAI Retail Market Report", url: "https://www.inowai.com/en/real-estate-research-data/", frequence: "Semestriel", gratuit: true },
    { nom: "JLL Annual Review", url: "https://www.jll.com/en-belux/insights/market-dynamics/luxembourg-office", frequence: "Annuel", gratuit: true },
  ],
};

// ============================================================
// LOGISTIQUE / INDUSTRIEL
// ============================================================

export interface LogisticsZone {
  nom: string;
  loyerMin: number; // €/m²/mois
  loyerMax: number;
  stockEstime: number; // m²
  tendance: "hausse" | "stable" | "baisse";
  note: string;
}

export const LOGISTICS_ZONES: LogisticsZone[] = [
  // Source : Savills + BNP Paribas RE + WarehouseRentInfo.lu
  { nom: "Eurohub Sud (Bettembourg / Dudelange)", loyerMin: 7, loyerMax: 9, stockEstime: 250_000, tendance: "hausse", note: "Terminal multimodal CFL, douanes, principal hub logistique" },
  { nom: "Contern / Sandweiler", loyerMin: 8, loyerMax: 10, stockEstime: 120_000, tendance: "stable", note: "Proximité Luxembourg-Ville, accès A1/A6" },
  { nom: "Windhof / Capellen", loyerMin: 7, loyerMax: 9, stockEstime: 80_000, tendance: "stable", note: "Ouest, accès A6 vers Belgique" },
  { nom: "Leudelange / Foetz", loyerMin: 7, loyerMax: 9, stockEstime: 100_000, tendance: "stable", note: "Zone d'activité Foetz, retail park adjacent" },
  { nom: "Munsbach / Senningerberg", loyerMin: 8, loyerMax: 11, stockEstime: 60_000, tendance: "stable", note: "Proximité aéroport, fret aérien" },
  { nom: "Sanem / Ehlerange", loyerMin: 6, loyerMax: 8, stockEstime: 70_000, tendance: "hausse", note: "Développement récent, nouvelles constructions" },
  { nom: "Ettelbruck / Nord", loyerMin: 5, loyerMax: 7, stockEstime: 40_000, tendance: "stable", note: "Nord du pays, coûts plus faibles" },
];

export const LOGISTICS_MARKET_SUMMARY = {
  stockTotal: "+1 000 000 m²",
  yieldPrime: 5.25, // %
  partInvestissement: 0.15, // 15% du volume investi en 2025
  periode: "2025",
  sources: [
    { nom: "Savills Luxembourg Logistics", url: "https://www.savills.lu/research-and-news/research.aspx", frequence: "Annuel", gratuit: true },
    { nom: "BNP Paribas RE Logistics", url: "https://www.realestate.bnpparibas.lu/en/press/logistics-capital-markets", frequence: "Annuel", gratuit: true },
    { nom: "WarehouseRentInfo.lu", url: "https://www.warehouserentinfo.lu/", frequence: "Live", gratuit: true },
  ],
};

// ============================================================
// HÔTELLERIE
// ============================================================

export const HOTEL_MARKET = {
  nbEtablissements: 211,
  nuiteesAnnuelles: 3_600_000,
  occupancyEstimee: "70-75%", // Estimation — pas de donnée publique précise
  adrEstimee: "130-160 €", // Average Daily Rate estimation
  revparEstimee: "95-120 €",
  segmentation: "Marché institutionnel/affaires dominant, tourisme en croissance",
  tendance: "hausse" as const,
  periode: "2024",
  prixParChambre: { min: 120_000, max: 250_000, note: "Prix par chambre — fourchette investissement" },
  yieldEstimee: "6-7%",
  sources: [
    { nom: "STATEC — Le Tourisme en Chiffres", url: "https://statistiques.public.lu/en/publications/series/en-chiffres/2024/tourisme-2024.html", frequence: "Annuel", gratuit: true },
    { nom: "INOWAI Hospitality Spotlight", url: "https://www.inowai.com/en/real-estate-research-data/", frequence: "Annuel", gratuit: true },
    { nom: "STR (CoStar Benchmark)", url: "https://str.com/", frequence: "Mensuel", gratuit: false },
  ],
  note: "Le Luxembourg ne publie pas de RevPAR/ADR officiels. Les données STATEC couvrent les nuitées et arrivées. Pour les KPIs hôteliers (RevPAR, ADR, occupancy), STR est la référence mais payante. INOWAI publie un Hospitality Spotlight annuel gratuit.",
};

// ============================================================
// TERRAINS À BÂTIR
// ============================================================

export interface LandPriceZone {
  zone: string;
  prixMedianAre: number; // €/are (100m²)
  prixM2: number;
  evolution: string;
  note: string;
}

export const LAND_PRICES: LandPriceZone[] = [
  // Source : Observatoire de l'Habitat Rapports #15 et #19 (2025)
  // Prix médians par are, zones résidentielles
  { zone: "Luxembourg-Ville", prixMedianAre: 350_000, prixM2: 3_500, evolution: "-12% (2022-2024)", note: "Le plus cher. Rapport 1:6 vs nord du pays" },
  { zone: "Ceinture sud de Lux-Ville (Strassen, Bertrange, Hesperange)", prixMedianAre: 250_000, prixM2: 2_500, evolution: "-10%", note: "Très demandé, offre rare" },
  { zone: "Canton Esch-sur-Alzette", prixMedianAre: 120_000, prixM2: 1_200, evolution: "-15%", note: "Plus accessible, bon potentiel Belval" },
  { zone: "Canton Mersch / Capellen", prixMedianAre: 140_000, prixM2: 1_400, evolution: "-12%", note: "Corridor central, bonne desserte" },
  { zone: "Canton Grevenmacher / Remich", prixMedianAre: 100_000, prixM2: 1_000, evolution: "-8%", note: "Est du pays, Moselle" },
  { zone: "Canton Diekirch / Ettelbruck", prixMedianAre: 80_000, prixM2: 800, evolution: "-5%", note: "Centre-nord, pôle régional" },
  { zone: "Canton Wiltz / Clervaux / Vianden", prixMedianAre: 60_000, prixM2: 600, evolution: "-3%", note: "Nord, le plus accessible. 1/6 de Lux-Ville" },
];

export const LAND_MARKET_SUMMARY = {
  nbVentes2024: 565,
  nbVentes2023: 326,
  evolution: "+73% de ventes en 2024 vs 2023, mais -14.9% sur les prix depuis 2022",
  periode: "2024",
  sources: [
    { nom: "Observatoire — Rapport #19 (prix terrains)", url: "https://gouvernement.lu/dam-assets/images-documents/actualites/2025/10/10-observatoire-habitat-rapport/oh-rapport-analyse-19.pdf", frequence: "Annuel", gratuit: true },
    { nom: "Observatoire — Rapport #15 (segmentation)", url: "https://gouvernement.lu/dam-assets/images-documents/actualites/2025/02/11-observatoire-habitat/rapport-analyse-15-segmentation-foncier.pdf", frequence: "Annuel", gratuit: true },
  ],
};

// ============================================================
// MAISONS (données limitées)
// ============================================================

export const HOUSES_MARKET = {
  hpiEvolution: "+1.1% annuel (Q3 2025)", // STATEC sub-index
  note: "L'Observatoire de l'Habitat ne publie pas de statistiques détaillées sur les maisons faute de données cadastrales suffisantes. Seuls les prix annoncés et l'indice HPI STATEC sont disponibles.",
  rendementEstime: "2.5-3.5%", // Brut
  sources: [
    { nom: "STATEC HPI (sous-indice maisons)", url: "https://lustat.statec.lu/", frequence: "Trimestriel", gratuit: true },
    { nom: "Observatoire — prix annoncés maisons", url: "https://data.public.lu/en/datasets/prix-annonces-des-logements-par-commune/", frequence: "Annuel", gratuit: true },
    { nom: "Spuerkeess Property Analysis", url: "https://www.spuerkeess.lu/en/blog/housing/", frequence: "Périodique", gratuit: true },
  ],
};

// ============================================================
// DONNÉES MACRO / TRANSVERSALES
// ============================================================

export const MACRO_DATA = {
  tauxHypothecaire: { taux: 3.15, date: "Déc 2025", source: "BCL" },
  indiceCoutConstruction: { evolution: "+1.3% semestriel", date: "Avril 2025", source: "STATEC" },
  rendementLocatifResidentiel: { brut: "3.1-3.5%", source: "Observatoire Rapport #13" },
  investissementCRE2025: { total: 839_000_000, bureaux: 0.40, retail: 0.22, logistique: 0.15, autre: 0.23 },
  sources: [
    { nom: "BCL Taux hypothécaires", url: "https://www.bcl.lu/en/Media-and-News/Press-releases/", frequence: "Mensuel", gratuit: true },
    { nom: "BCL Revue Stabilité Financière", url: "https://www.bcl.lu/en/publications/revue_stabilite/", frequence: "Annuel", gratuit: true },
    { nom: "STATEC Coûts construction", url: "https://lustat.statec.lu/", frequence: "Semestriel", gratuit: true },
    { nom: "Observatoire Rapport #13 (rendements)", url: "https://gouvernement.lu/dam-assets/images-documents/actualites/2025/02/04-observatoire-habitat/rapport-analyse-13-rendements-locatifs.pdf", frequence: "Ponctuel", gratuit: true },
    { nom: "Deloitte Property Index", url: "https://www.deloitte.com/cz-sk/en/Industries/real-estate/research/property-index.html", frequence: "Annuel", gratuit: true },
    { nom: "PwC/ULI Emerging Trends Europe", url: "https://www.pwc.com/gx/en/industries/financial-services/real-estate/emerging-trends-real-estate/europe.html", frequence: "Annuel", gratuit: true },
    { nom: "Eurostat HPI Luxembourg", url: "https://ec.europa.eu/eurostat/cache/metadata/EN/prc_hpi_inx_esmshpi_lu.htm", frequence: "Trimestriel", gratuit: true },
  ],
};
