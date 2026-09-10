// ============================================================
// PROFIL UTILISATEUR — Personnalisation des rapports
// localStorage (offline) + sync Supabase user_metadata (cloud)
// ============================================================

import { supabase } from "./supabase";

export interface UserProfile {
  nomComplet: string;
  societe: string;
  qualifications: string; // ex: "REV, TRV, MRICS"
  telephone: string;
  email: string;
  adresse: string;
  logoUrl?: string; // URL du logo (optionnel)
  mentionLegale: string; // Mention personnalisée en bas du rapport
  /** Timestamp ISO de la dernière sauvegarde (pour merge cloud/local) */
  updatedAt?: string;
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

// ── localStorage (primaire, fonctionne hors ligne) ──────────

export function profileStorageKey(userId: string | null): string {
  return `${STORAGE_KEY}:v2:${userId ? `user:${encodeURIComponent(userId)}` : 'guest'}`;
}
export function legacyProfileSnapshot(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
}
export function defaultProfile(): UserProfile { return {...DEFAULT_PROFILE}; }
function parseProfile(value: unknown): UserProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid profile');
  const input=value as Record<string,unknown>, result=defaultProfile();
  for(const key of ['nomComplet','societe','qualifications','telephone','email','adresse','mentionLegale','logoUrl','updatedAt'] as const) {
    if(input[key]===undefined)continue;
    if(typeof input[key]!=='string')throw new Error('Invalid profile field');
    result[key]=input[key];
  }
  if(result.updatedAt && !Number.isFinite(Date.parse(result.updatedAt)))throw new Error('Invalid profile date');
  return result;
}
export function getProfile(userId: string | null): UserProfile {
  if(typeof window==='undefined')return defaultProfile();
  const raw=localStorage.getItem(profileStorageKey(userId));
  return raw ? parseProfile(JSON.parse(raw)) : defaultProfile();
}
function saveProfileLocal(profile: UserProfile,userId: string | null) {
  if(typeof window!=='undefined')localStorage.setItem(profileStorageKey(userId),JSON.stringify(parseProfile(profile)));
}
async function requireProfileOwner(userId: string) {
  if(!supabase)throw new Error('Profile service unavailable');
  const {data,error}=await supabase.auth.getUser();
  if(error || data.user?.id!==userId)throw new Error('Profile account changed');
  return data.user;
}
/** Bind the metadata request to the captured token, even if browser auth changes meanwhile. */
async function profileToken(userId: string): Promise<string> {
  if(!supabase)throw new Error('Profile service unavailable');
  const session=await supabase.auth.getSession();
  const token=session.data.session?.access_token;
  if(session.error || !token)throw new Error('Profile session unavailable');
  const verified=await supabase.auth.getUser(token);
  if(verified.error || verified.data.user?.id!==userId)throw new Error('Profile account changed');
  return token;
}
export async function syncProfileToCloud(profile: UserProfile,userId: string): Promise<void> {
  const token=await profileToken(userId);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url || !key)throw new Error('Profile service unavailable');
  const response=await fetch(`${url}/auth/v1/user`,{method:'PUT',headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({data:{profile:parseProfile(profile)}}),cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('Profile save not confirmed');
  const result=await response.json();
  if(result?.id!==userId || JSON.stringify(parseProfile(result.user_metadata?.profile))!==JSON.stringify(parseProfile(profile)))throw new Error('Profile save not confirmed');
  await requireProfileOwner(userId);
}
export async function loadProfileFromCloud(userId: string): Promise<UserProfile | null> {
  const user=await requireProfileOwner(userId),cloud=user.user_metadata?.profile;
  return cloud===undefined || cloud===null ? null : parseProfile(cloud);
}
export async function saveProfile(profile: UserProfile,userId: string | null): Promise<void> {
  getProfile(userId); // Preserve malformed existing storage instead of silently replacing it.
  const stamped={...parseProfile(profile),updatedAt:new Date().toISOString()};
  if(userId)await syncProfileToCloud(stamped,userId);
  saveProfileLocal(stamped,userId);
}
/** Reads never upload local identity details. Cloud is authoritative for the selected account. */
export async function loadAndMergeProfile(userId: string | null): Promise<UserProfile> {
  const local=getProfile(userId),snapshot=JSON.stringify(local);
  if(!userId)return local;
  const profile=(await loadProfileFromCloud(userId)) ?? defaultProfile();
  await requireProfileOwner(userId);
  if(JSON.stringify(getProfile(userId))!==snapshot)throw new Error('Profile changed during load');
  saveProfileLocal(profile,userId);
  return profile;
}
export function hasProfile(userId: string | null): boolean { return getProfile(userId).nomComplet.length>0; }

// ── Upload logo via Supabase Storage ───────────────────────
// Prérequis : créer le bucket "avatars" dans le dashboard Supabase
//   → Storage → New bucket → Name: "avatars", Public: ON
//   → Policies : allow INSERT/UPDATE for authenticated, SELECT for all

const LOGO_MAX_SIZE = 500 * 1024; // 500 KB
const LOGO_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

export interface UploadLogoResult {
  url: string | null;
  error: string | null;
}

/**
 * Upload un logo dans Supabase Storage (bucket "avatars").
 * Retourne l'URL publique ou un message d'erreur localisé.
 */
export async function uploadLogo(file: File, userId: string): Promise<UploadLogoResult> {
  if (!supabase) return { url: null, error: "Supabase non configuré." };

  // Validation format
  if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
    return { url: null, error: "Format non accepté. Utilisez PNG, JPEG ou SVG." };
  }

  // Validation taille
  if (file.size > LOGO_MAX_SIZE) {
    return { url: null, error: `Fichier trop volumineux (max ${LOGO_MAX_SIZE / 1024} Ko).` };
  }

  const token=await profileToken(userId);

  const ext = ({"image/png":"png","image/jpeg":"jpg","image/svg+xml":"svg"} as Record<string,string>)[file.type];
  const path = `logos/${userId}.${ext}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type, headers: {Authorization: `Bearer ${token}`} });

  if (error) {
    return { url: null, error: "Le téléversement du logo n’a pas été confirmé." };
  }

  await requireProfileOwner(userId);
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
