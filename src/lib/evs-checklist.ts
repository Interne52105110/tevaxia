// ============================================================
// CHECKLIST CONFORMITÉ EVS 2025 / RED BOOK 2025
// ============================================================
// Vérifie les éléments requis par les standards d'évaluation.

export interface ChecklistItem {
  id: string;
  categorie: "identification" | "methodes" | "esg" | "marche" | "reconciliation" | "rapport";
  label: string;
  obligatoire: boolean;
  reference: string; // EVS / Red Book reference
  verifie: boolean;
}

export interface ChecklistInput {
  communeSelectionnee: boolean;
  surfaceRenseignee: boolean;
  assetTypeSelectionne: boolean;
  evsTypeSelectionne: boolean;
  // Méthodes
  comparaisonFaite: boolean;
  nbComparables: number;
  capitalisationFaite: boolean;
  dcfFait: boolean;
  // ESG
  esgEvalue: boolean;
  classeEnergieRenseignee: boolean;
  // Marché
  donnesMarcheConsultees: boolean;
  // Réconciliation
  reconciliationFaite: boolean;
  scenariosAnalyses: boolean;
  narrativeGeneree: boolean;
  // MLV
  mlvCalculee: boolean;
}

export function evaluerChecklist(input: ChecklistInput): ChecklistItem[] {
  return [
    // IDENTIFICATION
    {
      id: "commune", categorie: "identification", label: "Commune / localisation identifiée",
      obligatoire: true, reference: "EVS1 §4.1", verifie: input.communeSelectionnee,
    },
    {
      id: "surface", categorie: "identification", label: "Surface du bien renseignée",
      obligatoire: true, reference: "EVS1 §4.2", verifie: input.surfaceRenseignee,
    },
    {
      id: "asset_type", categorie: "identification", label: "Type d'actif sélectionné",
      obligatoire: true, reference: "EVS1 §4.3", verifie: input.assetTypeSelectionne,
    },
    {
      id: "evs_type", categorie: "identification", label: "Base de valeur définie (EVS1-6)",
      obligatoire: true, reference: "EVS1 §3", verifie: input.evsTypeSelectionne,
    },

    // MÉTHODES
    {
      id: "min_2_methodes", categorie: "methodes", label: "Minimum 2 méthodes utilisées",
      obligatoire: true, reference: "EVS1 §5.8",
      verifie: [input.comparaisonFaite, input.capitalisationFaite, input.dcfFait].filter(Boolean).length >= 2,
    },
    {
      id: "comparaison", categorie: "methodes", label: "Méthode par comparaison réalisée",
      obligatoire: false, reference: "EVS1 §5.4", verifie: input.comparaisonFaite,
    },
    {
      id: "nb_comparables", categorie: "methodes", label: "Au moins 3 comparables (recommandé)",
      obligatoire: false, reference: "EVS1 §5.4.2", verifie: input.nbComparables >= 3,
    },
    {
      id: "capitalisation", categorie: "methodes", label: "Méthode par capitalisation réalisée",
      obligatoire: false, reference: "EVS1 §5.5", verifie: input.capitalisationFaite,
    },
    {
      id: "dcf", categorie: "methodes", label: "Méthode DCF réalisée",
      obligatoire: false, reference: "EVS1 §5.6", verifie: input.dcfFait,
    },

    // ESG
    {
      id: "esg_evaluation", categorie: "esg", label: "Facteurs ESG évalués",
      obligatoire: true, reference: "EVS 2025 / Red Book 2025 / EBA Art. 208",
      verifie: input.esgEvalue,
    },
    {
      id: "classe_energie", categorie: "esg", label: "Classe énergie renseignée",
      obligatoire: true, reference: "EVS 2025 §ESG", verifie: input.classeEnergieRenseignee,
    },

    // MARCHÉ
    {
      id: "donnees_marche", categorie: "marche", label: "Données de marché consultées",
      obligatoire: true, reference: "EVS1 §5.3", verifie: input.donnesMarcheConsultees,
    },

    // RÉCONCILIATION
    {
      id: "reconciliation", categorie: "reconciliation", label: "Réconciliation des méthodes",
      obligatoire: true, reference: "EVS1 §5.8", verifie: input.reconciliationFaite,
    },
    {
      id: "scenarios", categorie: "reconciliation", label: "Analyse par scénarios",
      obligatoire: false, reference: "Bonne pratique", verifie: input.scenariosAnalyses,
    },
    {
      id: "narrative", categorie: "reconciliation", label: "Analyse narrative générée",
      obligatoire: false, reference: "EVS1 §6", verifie: input.narrativeGeneree,
    },

    // MLV (si demandé)
    {
      id: "mlv", categorie: "rapport", label: "Valeur hypothécaire (MLV) calculée",
      obligatoire: false, reference: "EVS3 / CRR Art. 229", verifie: input.mlvCalculee,
    },
  ];
}

export function scoreChecklist(items: ChecklistItem[]): {
  total: number;
  remplis: number;
  obligatoiresManquants: ChecklistItem[];
  pctCompletion: number;
} {
  const remplis = items.filter((i) => i.verifie).length;
  const obligatoiresManquants = items.filter((i) => i.obligatoire && !i.verifie);
  return {
    total: items.length,
    remplis,
    obligatoiresManquants,
    pctCompletion: items.length > 0 ? (remplis / items.length) * 100 : 0,
  };
}
