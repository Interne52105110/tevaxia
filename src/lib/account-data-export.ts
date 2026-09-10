// Read-only, explicitly scoped account snapshot; not a complete account archive.
import { supabase } from './supabase';
import { valuationStorageKey } from './storage';
import { rentalStorageKey } from './gestion-locative';
import { profileStorageKey } from './profile';
const tables = {
  valuations: ['user_id', 'id,user_id,local_id,nom,type,commune,asset_type,valeur_principale,data,created_at,updated_at,expires_at'],
  rental_lots: ['user_id', 'id,user_id,local_id,name,address,commune,surface,nb_chambres,classe_energie,est_meuble,prix_acquisition,annee_acquisition,travaux_montant,travaux_annee,loyer_mensuel_actuel,charges_mensuelles,tenant_name,lease_start_date,lease_end_date,vacant,created_at,updated_at,expires_at'],
  market_alerts: ['user_id', 'id,user_id,commune,target_price_m2,direction,active,created_at,updated_at'],
  shared_links: ['owner_user_id', 'id,owner_user_id,tool_type,title,view_count,max_views,expires_at,created_at'],
  api_keys: ['user_id', 'id,user_id,name,tier,created_at,revoked_at,last_used_at'],
} as const;
type Row = Record<string, unknown>;
export interface DataExport {
  format_version: 2; started_at: string; exported_at: string; user_id: string; user_email: string | null;
  coverage: { complete_account_archive: false; transactional_snapshot: false; included: string[]; excluded: string[] };
  profile_cloud: unknown;
  local_copies: { profile: unknown; valuations: unknown; rental_lots: unknown };
  tier: Row | null;
  cloud: Record<keyof typeof tables, Row[]>;
}
async function currentToken(owner: string): Promise<string> {
  if (!supabase || !owner) throw new Error('Export account unavailable');
  const response = await supabase.auth.getSession();
  if (response.error || response.data.session?.user.id !== owner || !response.data.session.access_token) throw new Error('Export account changed');
  return response.data.session.access_token;
}
export async function buildDataExport(owner: string): Promise<DataExport> {
  const started_at = new Date().toISOString(), token = await currentToken(owner);
  const auth = await supabase!.auth.getUser(token);
  if (auth.error || auth.data.user?.id !== owner) throw new Error('Export account changed');
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key || typeof window === 'undefined') throw new Error('Export unavailable');
  const headers = { apikey: key, Authorization: `Bearer ${token}` }, signal = AbortSignal.timeout(60000);
  const localKeys = { profile: profileStorageKey(owner), valuations: valuationStorageKey(owner), rental_lots: rentalStorageKey(owner) };
  const raw = Object.fromEntries(Object.entries(localKeys).map(([name, storageKey]) => [name, localStorage.getItem(storageKey)]));
  const local_copies = Object.fromEntries(Object.entries(raw).map(([name, value]) => [name, value === null ? null : JSON.parse(value)])) as DataExport['local_copies'];
  async function read(table: string, ownerColumn: string, columns: string, paginated: boolean): Promise<Row[]> {
    const url = new URL(base + '/rest/v1/' + table);
    url.searchParams.set(ownerColumn, 'eq.' + owner); url.searchParams.set('select', columns);
    url.searchParams.set('limit', paginated ? '100' : '2');
    if (paginated) url.searchParams.set('order', 'id.asc');
    const rows: Row[] = []; let last = '';
    for (let page = 0; page < 101; page++) {
      await currentToken(owner);
      const response = await fetch(url.toString(), { headers, cache: 'no-store', signal });
      if (!response.ok) throw new Error('Export read failed');
      const data: unknown = await response.json();
      if (!Array.isArray(data) || data.length > (paginated ? 100 : 1)) throw new Error('Invalid export response');
      if (!data.length) return rows;
      if (page === 100) throw new Error('Export capacity exceeded');
      for (const value of data) {
        if (!value || typeof value !== 'object' || Array.isArray(value) || value[ownerColumn] !== owner) throw new Error('Invalid export owner');
        if (paginated) {
          if (typeof value.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value.id) || value.id <= last) throw new Error('Invalid export ordering');
          last = value.id;
        }
        rows.push(Object.fromEntries(columns.split(',').map(column => {
          if (!(column in value)) throw new Error('Incomplete export row');
          return [column, value[column]];
        })));
      }
      if (!paginated) return rows;
      // A short page is not proof of completeness; continue to an empty page.
      url.searchParams.set('id', 'gt.' + last);
    }
    throw new Error('Export incomplete');
  }
  const [tierRows, ...collections] = await Promise.all([
    read('user_tiers', 'user_id', 'user_id,tier,items_cap,granted_at,expires_at', false),
    ...Object.entries(tables).map(([table, [ownerColumn, columns]]) => read(table, ownerColumn, columns, true)),
  ]);
  await currentToken(owner);
  for (const [name, storageKey] of Object.entries(localKeys)) if (localStorage.getItem(storageKey) !== raw[name]) throw new Error('Local export data changed');
  return {
    format_version: 2, started_at, exported_at: new Date().toISOString(), user_id: owner, user_email: auth.data.user.email ?? null,
    coverage: {
      complete_account_archive: false, transactional_snapshot: false,
      included: ['profile metadata', 'three account-specific browser caches, including valuation recovery copies', 'visible cloud valuations and rental lots, including expired rows still available', 'manual market thresholds', 'shared-link metadata without access tokens', 'API-key metadata without secrets', 'stored plan metadata, null if absent'],
      excluded: ['other browsers and legacy/unassigned local data', 'shared-link payloads and access tokens', 'API/AI secrets and hashes', 'other account/workspace data: preferences, PMS, tenant payments, signatures, documents, invoices, logs and other modules'],
    },
    profile_cloud: auth.data.user.user_metadata?.profile ?? null, local_copies, tier: tierRows[0] ?? null,
    cloud: Object.fromEntries(Object.keys(tables).map((table, index) => [table, collections[index]])) as DataExport['cloud'],
  };
}
export function downloadAsJsonFile(data: DataExport) {
  if (typeof window === 'undefined') throw new Error('Download unavailable');
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url;
  a.download = `tevaxia-export-${new Date().toISOString().slice(0, 10)}.json`;
  try { document.body.appendChild(a); a.click(); }
  finally { a.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
}
