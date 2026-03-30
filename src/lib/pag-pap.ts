// ============================================================
// PAG / PAP — Données urbanistiques Luxembourg
// ============================================================
// Sources : geoportail.lu, logement.public.lu, règlements communaux
//
// PAG = Plan d'Aménagement Général (zonage communal)
// PAP = Plan d'Aménagement Particulier
//   PAP NQ = Nouveau Quartier (nouveaux développements)
//   PAP QE = Quartier Existant (quartiers existants)
//
// COS = Coefficient d'Occupation du Sol
// CMU = Coefficient Maximum d'Utilisation
// CTV = Servitude de Viabilisation (délai pour viabiliser)
// CTL = Servitude de Construction (délai pour construire)

export interface ZonePAG {
  code: string;
  nom: string;
  description: string;
  constructible: boolean;
  cosTypique: string; // ex: "0.25 - 0.50"
  cmuTypique: string; // ex: "0.40 - 0.80"
  hauteurMax: string; // ex: "12m / 3 niveaux"
  usagesPermis: string[];
  servitudes: string;
  observations: string;
}

export const ZONES_PAG: ZonePAG[] = [
  {
    code: "HAB-1",
    nom: "Zone d'habitation 1",
    description: "Zone résidentielle à faible densité — maisons unifamiliales",
    constructible: true,
    cosTypique: "0.25 - 0.40",
    cmuTypique: "0.40 - 0.60",
    hauteurMax: "10m / 2 niveaux + combles",
    usagesPermis: ["Habitation", "Professions libérales (accessoire)", "Commerce de proximité (RDC, soumis à conditions)"],
    servitudes: "CTV : 6 ans / CTL : 3 ans après viabilisation",
    observations: "Densité la plus faible. Recul latéral typique 3m. Toiture à pente obligatoire dans certaines communes.",
  },
  {
    code: "HAB-2",
    nom: "Zone d'habitation 2",
    description: "Zone résidentielle à densité moyenne — maisons et petits immeubles",
    constructible: true,
    cosTypique: "0.35 - 0.60",
    cmuTypique: "0.60 - 1.00",
    hauteurMax: "12m / 3 niveaux",
    usagesPermis: ["Habitation", "Bureaux (étages)", "Commerces (RDC)", "Professions libérales", "Hébergement touristique"],
    servitudes: "CTV : 6 ans / CTL : 3 ans",
    observations: "Zone la plus courante au Luxembourg. Permet les immeubles de rapport jusqu'à 3-4 logements.",
  },
  {
    code: "MIX-v",
    nom: "Zone mixte villageoise",
    description: "Zone de centre de village — habitat + activités artisanales",
    constructible: true,
    cosTypique: "0.40 - 0.70",
    cmuTypique: "0.80 - 1.20",
    hauteurMax: "12m / 3 niveaux",
    usagesPermis: ["Habitation", "Commerces", "Artisanat", "Bureaux", "Restauration", "Services"],
    servitudes: "CTV : 6 ans / CTL : 3 ans",
    observations: "Construction en ordre continu (front de rue) fréquente. Mixité fonctionnelle encouragée.",
  },
  {
    code: "MIX-u",
    nom: "Zone mixte urbaine",
    description: "Zone de centre urbain — forte densité, mixité fonctionnelle",
    constructible: true,
    cosTypique: "0.50 - 0.90",
    cmuTypique: "1.00 - 2.50",
    hauteurMax: "18m+ / 5 niveaux+",
    usagesPermis: ["Habitation", "Commerces", "Bureaux", "Hôtels", "Services publics", "Équipements culturels"],
    servitudes: "CTV : 6 ans / CTL : 3 ans",
    observations: "Densité la plus élevée. PAP NQ souvent requis pour les grands projets. Luxembourg-Ville, Kirchberg, Belval.",
  },
  {
    code: "MIX-c",
    nom: "Zone mixte commerciale",
    description: "Zone d'activités commerciales",
    constructible: true,
    cosTypique: "0.30 - 0.60",
    cmuTypique: "0.50 - 1.00",
    hauteurMax: "15m",
    usagesPermis: ["Commerces", "Bureaux", "Hôtels", "Restauration", "Logement de fonction"],
    servitudes: "CTV : 6 ans / CTL : 3 ans",
    observations: "Habitation limitée au logement de fonction. Zones commerciales périphériques (Foetz, Leudelange).",
  },
  {
    code: "ACT",
    nom: "Zone d'activités économiques",
    description: "Zone industrielle et artisanale",
    constructible: true,
    cosTypique: "0.30 - 0.60",
    cmuTypique: "0.50 - 0.80",
    hauteurMax: "Variable",
    usagesPermis: ["Industrie", "Artisanat", "Logistique", "Bureaux liés à l'activité", "Commerce de gros"],
    servitudes: "CTV : 6 ans / CTL : 3 ans",
    observations: "Habitation interdite sauf logement de gardien. Normes environnementales spécifiques.",
  },
  {
    code: "AGR",
    nom: "Zone agricole",
    description: "Zone réservée à l'agriculture — non constructible sauf exploitation agricole",
    constructible: false,
    cosTypique: "N/A",
    cmuTypique: "N/A",
    hauteurMax: "N/A",
    usagesPermis: ["Exploitation agricole", "Constructions liées à l'agriculture"],
    servitudes: "Reclassement nécessaire pour toute construction",
    observations: "Prix très faible (1-5 €/m²). Spéculation sur le reclassement en zone constructible.",
  },
  {
    code: "FOR",
    nom: "Zone forestière",
    description: "Zone boisée — non constructible",
    constructible: false,
    cosTypique: "N/A",
    cmuTypique: "N/A",
    hauteurMax: "N/A",
    usagesPermis: ["Exploitation forestière"],
    servitudes: "Protection renforcée",
    observations: "Inconstructible. Compensation écologique requise en cas de défrichement.",
  },
  {
    code: "VER",
    nom: "Zone de verdure",
    description: "Espaces verts, parcs, jardins — non constructible",
    constructible: false,
    cosTypique: "N/A",
    cmuTypique: "N/A",
    hauteurMax: "N/A",
    usagesPermis: ["Espaces verts", "Loisirs", "Équipements légers"],
    servitudes: "Protection paysagère",
    observations: "Peut inclure des zones de rétention d'eau pluviale.",
  },
  {
    code: "SPE",
    nom: "Zone spéciale",
    description: "Équipements publics, infrastructures",
    constructible: true,
    cosTypique: "Variable",
    cmuTypique: "Variable",
    hauteurMax: "Variable",
    usagesPermis: ["Équipements publics", "Écoles", "Hôpitaux", "Infrastructures"],
    servitudes: "Selon affectation",
    observations: "Réservée aux équipements d'intérêt public. Non accessible au marché privé.",
  },
];

export interface PAPInfo {
  type: "NQ" | "QE";
  nom: string;
  description: string;
  procedure: string[];
  delaiTypique: string;
  documentsRequis: string[];
}

export const PAP_TYPES: PAPInfo[] = [
  {
    type: "NQ",
    nom: "PAP Nouveau Quartier",
    description: "Plan d'aménagement pour les nouveaux développements sur des terrains non encore urbanisés ou à restructurer.",
    procedure: [
      "Étude préparatoire (schéma directeur si > 1 ha)",
      "Élaboration du PAP par l'aménageur/promoteur",
      "Avis du Ministère de l'Intérieur",
      "Enquête publique (30 jours)",
      "Vote du conseil communal",
      "Approbation ministérielle",
      "Convention d'exécution avec la commune",
    ],
    delaiTypique: "12-24 mois (sans recours)",
    documentsRequis: [
      "Plan de situation et extrait cadastral",
      "Partie graphique (implantation, voirie, espaces verts)",
      "Partie écrite (règles de construction)",
      "Rapport justificatif",
      "Étude d'impact environnemental (si > 25 logements)",
      "Schéma directeur (si > 1 ha)",
    ],
  },
  {
    type: "QE",
    nom: "PAP Quartier Existant",
    description: "Régit les constructions dans les quartiers déjà urbanisés. Définit les règles de gabarit, recul, toiture, etc.",
    procedure: [
      "Applicable directement (pas de procédure individuelle)",
      "Demande d'autorisation de construire à la commune",
      "Vérification conformité PAP QE par la commune",
    ],
    delaiTypique: "2-4 mois (autorisation de construire)",
    documentsRequis: [
      "Plans architecturaux conformes au PAP QE",
      "Demande d'autorisation de construire",
      "Certification énergétique (CPE)",
    ],
  },
];

export function getZonePAG(code: string): ZonePAG | undefined {
  return ZONES_PAG.find((z) => z.code === code);
}
