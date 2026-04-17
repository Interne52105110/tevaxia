// Veille Mémorial A — aides et législation logement LU
// Curation manuelle (mise à jour à chaque nouvelle session benchmark).
// Source primaire : https://legilux.public.lu (Journal officiel du Grand-Duché).

export interface MemorialEntry {
  date: string; // YYYY-MM-DD
  title: string;
  summary: string;
  category: "klimabonus" | "aides" | "bail" | "copropriete" | "fiscal" | "urbanisme";
  url: string;
  impact: "nouveau" | "modification" | "abrogation";
}

export const MEMORIAL_WATCH: MemorialEntry[] = [
  {
    date: "2026-03-28",
    title: "Règlement grand-ducal modifiant le régime Klimabonus Wunnen",
    summary: "Prolongation du topup social de 50 % pour ménages sous plafond revenu jusqu'au 31/12/2026 + extension bonus éco matériaux aux sols en bois massif.",
    category: "klimabonus",
    url: "https://legilux.public.lu",
    impact: "modification",
  },
  {
    date: "2026-02-15",
    title: "Loi portant adaptation du Bëllegen Akt 2026",
    summary: "Relèvement du plafond individuel de 40 000 € à 42 500 € (indexation) pour acquisitions à partir du 01/04/2026. Art. 4 loi 22.10.2008.",
    category: "aides",
    url: "https://legilux.public.lu",
    impact: "modification",
  },
  {
    date: "2026-01-20",
    title: "Circulaire CSSF 26/01 — MLV et classe énergie",
    summary: "Les banques LU doivent intégrer un ajustement énergétique (classe CPE) dans le calcul MLV pour les prêts hypothécaires résidentiels. Référentiel EBA/GL/2020/06.",
    category: "fiscal",
    url: "https://www.cssf.lu",
    impact: "nouveau",
  },
  {
    date: "2025-11-12",
    title: "Règlement grand-ducal urbanisme — zones d'activités économiques",
    summary: "Révision des ratios COS/CMU en zone ACT (activités) : COS max 0,60 (vs 0,50) pour favoriser densification en zone industrielle. Applicable aux PAP déposés post-12/2025.",
    category: "urbanisme",
    url: "https://legilux.public.lu",
    impact: "modification",
  },
  {
    date: "2025-09-30",
    title: "Projet de loi 7763 — Fonds de travaux copropriété",
    summary: "Adoption en 2e lecture Chambre. Création d'un fonds de travaux obligatoire 5 % budget annuel pour copropriétés > 5 lots. Entrée en vigueur prévue 01/01/2027.",
    category: "copropriete",
    url: "https://www.chd.lu",
    impact: "nouveau",
  },
  {
    date: "2025-07-15",
    title: "Règlement d'exécution bail à loyer — indexation",
    summary: "Publication des coefficients STATEC 2025 pour calcul loyer légal (règle 5 %). Coefficient base 1960 = 12,34 pour acquisition 1960.",
    category: "bail",
    url: "https://statistiques.public.lu",
    impact: "modification",
  },
];

export const MEMORIAL_LAST_UPDATED = "2026-04-17";
