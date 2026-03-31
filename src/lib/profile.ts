// ============================================================
// PROFIL UTILISATEUR — Personnalisation des rapports
// ============================================================

export interface UserProfile {
  nomComplet: string;
  societe: string;
  qualifications: string; // ex: "REV, TRV, MRICS"
  telephone: string;
  email: string;
  adresse: string;
  logoUrl?: string; // URL du logo (optionnel)
  mentionLegale: string; // Mention personnalisée en bas du rapport
}

const STORAGE_KEY = "tevaxia_profile";

const DEFAULT_PROFILE: UserProfile = {
  nomComplet: "",
  societe: "",
  qualifications: "",
  telephone: "",
  email: "",
  adresse: "",
  mentionLegale: "Ce rapport est fourni à titre indicatif et ne constitue pas une expertise en évaluation immobilière au sens des EVS 2025.",
};

export function getProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function hasProfile(): boolean {
  const p = getProfile();
  return p.nomComplet.length > 0;
}
