// ============================================================
// PERSISTANCE LOCALE — Sauvegarde des évaluations
// ============================================================
// Utilise localStorage comme stockage côté client.
// Pas de comptes serveur — tout est local au navigateur.
// Prêt pour migration vers Supabase/backend si besoin.

export interface SavedValuation {
  id: string;
  nom: string;
  date: string;
  type: "estimation" | "valorisation" | "capitalisation" | "dcf" | "dcf-multi" | "frais" | "plus-values" | "loyer" | "aides" | "achat-location" | "bilan-promoteur";
  commune?: string;
  assetType?: string;
  valeurPrincipale?: number;
  data: Record<string, unknown>; // Tous les inputs sérialisés
}

const STORAGE_KEY = "tevaxia_valuations";

function getAll(): SavedValuation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAll(valuations: SavedValuation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(valuations));
}

export function sauvegarderEvaluation(valuation: Omit<SavedValuation, "id" | "date">): SavedValuation {
  const all = getAll();
  const saved: SavedValuation = {
    ...valuation,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  all.unshift(saved); // Plus récent en premier
  // Garder max 50 évaluations
  if (all.length > 50) all.length = 50;
  saveAll(all);
  return saved;
}

export function listerEvaluations(): SavedValuation[] {
  return getAll();
}

export function chargerEvaluation(id: string): SavedValuation | null {
  return getAll().find((v) => v.id === id) || null;
}

export function supprimerEvaluation(id: string) {
  const all = getAll().filter((v) => v.id !== id);
  saveAll(all);
}

export function supprimerTout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
