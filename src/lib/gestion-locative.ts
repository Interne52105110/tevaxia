// ============================================================
// GESTION LOCATIVE LU — lots, baux, règle des 5 %, Klimabonus
// ============================================================
// Spécificités luxembourgeoises prises en compte :
// - plafond légal de loyer basé sur 5 % du capital investi réévalué
// - impact classe énergétique (Klimabonus en rénovation)
// - aides communales / Habitat Abordable

import { calculerCapitalInvesti } from "./calculations";
import { supabase } from "./supabase";

const STORAGE_KEY = "tevaxia_rental_properties";
const CLOUD_CAP = 500;

export type EnergyClass = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "NC";

export interface RentalLot {
  id: string;
  name: string;
  address?: string;
  commune?: string;

  // Caractéristiques
  surface: number; // m²
  nbChambres?: number;
  classeEnergie: EnergyClass;
  estMeuble: boolean;

  // Acquisition & travaux (règle 5%)
  prixAcquisition: number;
  anneeAcquisition: number;
  travauxMontant: number;
  travauxAnnee: number;

  // Location actuelle
  loyerMensuelActuel: number; // charges non comprises
  chargesMensuelles: number; // charges locatives mensuelles
  tenantName?: string;
  leaseStartDate?: string; // YYYY-MM
  leaseEndDate?: string; // YYYY-MM
  vacant: boolean;

  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface LotAnalysis {
  lot: RentalLot;
  loyerLegalMensuelMax: number;
  loyerLegalM2Mensuel: number;
  ecartLegalPct: number; // (loyerActuel - max) / max — négatif si sous le plafond
  depasseLegal: boolean;
  plafondComplet: boolean;

  rendementBrutPct: number; // loyerAnnuel / prixAcquisition
  rendementNetApproximatif: number; // brut - 1.5% charges

  klimabonusEligible: boolean; // classes E/F/G éligibles à la rénovation
  klimabonusMessage?: string;
}

export interface PortfolioSummary {
  nbLots: number;
  nbVacants: number;
  loyerMensuelTotal: number;
  loyerAnnuelTotal: number;
  surfaceTotale: number;
  capitalTotal: number;
  rendementBrutMoyen: number;
  lotsHorsPlafond: number;
  lotsKlimabonus: number;
}

// ---------- Storage ----------

export function rentalStorageKey(userId: string | null): string {
  return `${STORAGE_KEY}:v2:${userId ? `user:${encodeURIComponent(userId)}` : 'guest'}`;
}
export function legacyRentalSnapshot(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
}
function validateLots(value: unknown): asserts value is RentalLot[] {
  if (!Array.isArray(value) || value.length > CLOUD_CAP) throw new Error('Invalid rental portfolio');
  const ids = new Set<string>();
  for (const row of value) {
    if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !row.id || ids.has(row.id) || typeof row.name !== 'string' || !row.name.trim()) throw new Error('Invalid rental lot');
    ids.add(row.id);
    for(const key of ["address","commune","tenantName","leaseStartDate","leaseEndDate"])if(row[key]!==undefined && typeof row[key]!=="string")throw new Error("Invalid rental text");
    if(row.nbChambres!==undefined && (typeof row.nbChambres!=="number" || !Number.isFinite(row.nbChambres) || row.nbChambres<0))throw new Error("Invalid rental rooms");
    for (const key of ['surface','prixAcquisition','anneeAcquisition','travauxMontant','travauxAnnee','loyerMensuelActuel','chargesMensuelles']) {
      if (typeof row[key] !== 'number' || !Number.isFinite(row[key]) || row[key] < 0) throw new Error('Invalid rental amount');
    }
    if (typeof row.vacant !== 'boolean' || typeof row.estMeuble !== 'boolean' || !['A','B','C','D','E','F','G','NC'].includes(row.classeEnergie)) throw new Error('Invalid rental characteristics');
    if (typeof row.createdAt !== 'string' || typeof row.updatedAt !== 'string' || !Number.isFinite(Date.parse(row.createdAt)) || !Number.isFinite(Date.parse(row.updatedAt))) throw new Error('Invalid rental dates');
  }
}
function load(userId: string | null): RentalLot[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(rentalStorageKey(userId));
  const lots: unknown = raw ? JSON.parse(raw) : [];
  validateLots(lots);
  return lots;
}
function persist(lots: RentalLot[], userId: string | null) {
  validateLots(lots);
  if (typeof window !== 'undefined') localStorage.setItem(rentalStorageKey(userId), JSON.stringify(lots));
}
async function requireOwner(userId: string) {
  if (!supabase) throw new Error('Cloud unavailable');
  const { data, error } = await supabase.auth.getUser();
  if (error || data?.user?.id !== userId) throw new Error('Rental account changed');
}
export function listLots(userId: string | null): RentalLot[] {
  return load(userId).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
export function getLot(id: string, userId: string | null): RentalLot | null {
  return load(userId).find(l=>l.id===id) ?? null;
}
export async function getLotAsync(id: string, userId: string | null): Promise<RentalLot | null> {
  const result = await listLotsAsync(userId);
  if (result.cloudError) throw new Error('Rental portfolio unavailable');
  return result.items.find(l=>l.id===id) ?? null;
}
export async function saveLot(lot: Omit<RentalLot, 'id'|'createdAt'|'updatedAt'> & {id?:string}, userId: string | null): Promise<RentalLot> {
  const lots = load(userId), now = new Date().toISOString();
  const existing = lot.id ? lots.find(l=>l.id===lot.id) : undefined;
  const result: RentalLot = {...lot,id:lot.id || crypto.randomUUID(),createdAt:existing?.createdAt ?? now,updatedAt:now};
  validateLots([result]);
  const next = [...lots.filter(l=>l.id!==result.id),result];
  validateLots(next); // Refuse capacity overflow; never truncate existing records.
  if (userId) await cloudUpsertLot(result,userId);
  persist([...load(userId).filter(l=>l.id!==result.id),result],userId);
  return result;
}
export async function deleteLot(id: string, userId: string | null): Promise<void> {
  load(userId);
  if (userId) {
    await requireOwner(userId);
    const {data,error}=await supabase!.from('rental_lots').delete().eq('user_id',userId).eq('local_id',id).select('local_id');
    if(error || data?.length!==1 || data[0].local_id!==id) throw new Error('Rental deletion not confirmed');
    await requireOwner(userId);
  }
  persist(load(userId).filter(l=>l.id!==id),userId);
}
async function cloudUpsertLot(l: RentalLot, userId: string): Promise<void> {
  await requireOwner(userId);
  const {data,error}=await supabase!.from('rental_lots').upsert({
    user_id:userId,local_id:l.id,name:l.name,address:l.address??null,commune:l.commune??null,
    surface:l.surface,nb_chambres:l.nbChambres??null,classe_energie:l.classeEnergie,est_meuble:l.estMeuble,
    prix_acquisition:l.prixAcquisition,annee_acquisition:l.anneeAcquisition,travaux_montant:l.travauxMontant,travaux_annee:l.travauxAnnee,
    loyer_mensuel_actuel:l.loyerMensuelActuel,charges_mensuelles:l.chargesMensuelles,tenant_name:l.tenantName??null,
    lease_start_date:l.leaseStartDate??null,lease_end_date:l.leaseEndDate??null,vacant:l.vacant,
  },{onConflict:'user_id,local_id'}).select('local_id');
  if(error || data?.length!==1 || data[0].local_id!==l.id) throw new Error('Rental save not confirmed');
  await requireOwner(userId);
}
async function cloudListLots(userId: string): Promise<RentalLot[]> {
  await requireOwner(userId);
  const data: Record<string, unknown>[] = [];
  let cursor: string | null = null;
  for (;;) {
    let query=supabase!.from('rental_lots').select('*').eq('user_id',userId).gt('expires_at',new Date().toISOString()).order('id').limit(200);
    if(cursor)query=query.gt('id',cursor);
    const result=await query;
    if(result.error || !Array.isArray(result.data)) throw new Error('Rental portfolio unavailable');
    await requireOwner(userId);
    if(!result.data.length)break;
    const next=result.data[result.data.length-1].id;
    if(typeof next!=='string' || (cursor!==null && next<=cursor))throw new Error('Invalid rental page');
    data.push(...result.data);
    if(data.length>CLOUD_CAP)throw new Error('Rental portfolio capacity exceeded');
    cursor=next;
  }
  for(const row of data) {
    if(row.user_id!==userId || typeof row.est_meuble!=='boolean' || typeof row.vacant!=='boolean')throw new Error('Invalid rental owner or flags');
    for(const key of ['surface','prix_acquisition','annee_acquisition','travaux_montant','travaux_annee','loyer_mensuel_actuel','charges_mensuelles']) {
      const v=row[key];if((typeof v!=='number' && typeof v!=='string') || String(v).trim()==='' || !Number.isFinite(Number(v)))throw new Error('Invalid rental amount');
    }
  }
    const items = data.map((d) => ({
      id: (d.local_id as string) || (d.id as string),
      name: d.name as string,
      address: (d.address as string | null) ?? undefined,
      commune: (d.commune as string | null) ?? undefined,
      surface: Number(d.surface),
      nbChambres: (d.nb_chambres as number | null) ?? undefined,
      classeEnergie: (d.classe_energie as EnergyClass) ?? "NC",
      estMeuble: Boolean(d.est_meuble),
      prixAcquisition: Number(d.prix_acquisition),
      anneeAcquisition: Number(d.annee_acquisition),
      travauxMontant: Number(d.travaux_montant),
      travauxAnnee: Number(d.travaux_annee),
      loyerMensuelActuel: Number(d.loyer_mensuel_actuel),
      chargesMensuelles: Number(d.charges_mensuelles),
      tenantName: (d.tenant_name as string | null) ?? undefined,
      leaseStartDate: (d.lease_start_date as string | null) ?? undefined,
      leaseEndDate: (d.lease_end_date as string | null) ?? undefined,
      vacant: Boolean(d.vacant),
      createdAt: d.created_at as string,
      updatedAt: d.updated_at as string,
    }));
  validateLots(items);
  return items;
}
/** Account-specific cache. A successful cloud snapshot is authoritative, including an empty one. */
export async function listLotsAsync(userId: string | null): Promise<{items:RentalLot[];cloud:boolean;cloudError:boolean}> {
  const local=load(userId);
  const snapshot=JSON.stringify(local);
  if(!userId) return {items:local.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),cloud:false,cloudError:false};
  try {
    const items=await cloudListLots(userId);
    if(JSON.stringify(load(userId))!==snapshot)throw new Error("Rental cache changed during load");
    persist(items,userId);
    return {items:items.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),cloud:true,cloudError:false};
  } catch {
    return {items:load(userId),cloud:false,cloudError:true};
  }
}

// ---------- Calculs ----------

export function analyzeLot(lot: RentalLot): LotAnalysis {
  const currentYear = new Date().getFullYear();
  const capital = calculerCapitalInvesti({
    prixAcquisition: lot.prixAcquisition,
    anneeAcquisition: lot.anneeAcquisition,
    travauxMontant: lot.travauxMontant,
    travauxAnnee: lot.travauxAnnee || lot.anneeAcquisition,
    anneeBail: currentYear,
    surfaceHabitable: lot.surface,
    appliquerVetuste: true,
    tauxVetusteAnnuel: 0.01,
    estMeuble: lot.estMeuble,
  });

  const loyerAnnuelActuel = lot.loyerMensuelActuel * 12;
  const ecartLegalPct = capital.loyerMensuelMax > 0
    ? (lot.loyerMensuelActuel - capital.loyerMensuelMax) / capital.loyerMensuelMax
    : 0;

  const rendementBrutPct = lot.prixAcquisition > 0
    ? loyerAnnuelActuel / lot.prixAcquisition
    : 0;

  const klimabonusEligible = ["E", "F", "G"].includes(lot.classeEnergie);
  const klimabonusMessage = klimabonusEligible
    ? "Classe énergie E/F/G — rénovation énergétique éligible Klimabonus (jusqu'à 65 % des travaux + prime CO₂)."
    : undefined;

  return {
    lot,
    loyerLegalMensuelMax: capital.loyerMensuelMax,
    loyerLegalM2Mensuel: capital.loyerM2Mensuel,
    ecartLegalPct,
    plafondComplet: capital.donneesCompletes,
    depasseLegal: capital.donneesCompletes && lot.loyerMensuelActuel > capital.loyerMensuelMax && capital.loyerMensuelMax > 0,
    rendementBrutPct,
    rendementNetApproximatif: Math.max(0, rendementBrutPct - 0.015),
    klimabonusEligible,
    klimabonusMessage,
  };
}

export function summarize(lots: RentalLot[]): PortfolioSummary {
  const analyses = lots.map(analyzeLot);
  const loyerMensuelTotal = lots.filter((l) => !l.vacant).reduce((s, l) => s + l.loyerMensuelActuel, 0);
  const capitalTotal = lots.reduce((s, l) => s + l.prixAcquisition, 0);
  const loyerAnnuelTotal = loyerMensuelTotal * 12;
  const rendementBrutMoyen = capitalTotal > 0 ? loyerAnnuelTotal / capitalTotal : 0;

  return {
    nbLots: lots.length,
    nbVacants: lots.filter((l) => l.vacant).length,
    loyerMensuelTotal,
    loyerAnnuelTotal,
    surfaceTotale: lots.reduce((s, l) => s + l.surface, 0),
    capitalTotal,
    rendementBrutMoyen,
    lotsHorsPlafond: analyses.filter((a) => a.depasseLegal).length,
    lotsKlimabonus: analyses.filter((a) => a.klimabonusEligible).length,
  };
}
