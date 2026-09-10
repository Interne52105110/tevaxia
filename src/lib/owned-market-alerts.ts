import { supabase } from './supabase';
export interface OwnedMarketAlert {
  id: string; user_id: string; commune: string; target_price_m2: number | null;
  direction: 'below' | 'above'; active: boolean; created_at: string; updated_at: string;
}
export interface MarketAlertChoice { commune: string; target_price_m2: number | null; direction: 'below' | 'above'; active: boolean }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const columns = 'id,user_id,commune,target_price_m2,direction,active,created_at,updated_at';
export function parseMarketTarget(value: string): number | null {
  if (!value.trim()) return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) throw new Error('Invalid target');
  const amount = Number(value.trim().replace(',', '.'));
  if (!Number.isFinite(amount) || amount > 1e8) throw new Error('Invalid target');
  return amount;
}
function validChoice(input: MarketAlertChoice): boolean {
  return typeof input.commune === 'string' && input.commune.trim().length > 0 && input.commune.length <= 120 && !/[\u0000-\u001f\u007f]/.test(input.commune)
    && (input.target_price_m2 === null || (typeof input.target_price_m2 === 'number' && Number.isFinite(input.target_price_m2) && input.target_price_m2 >= 0 && input.target_price_m2 <= 1e8))
    && ['below', 'above'].includes(input.direction) && typeof input.active === 'boolean';
}
function parseRow(value: unknown, owner: string): OwnedMarketAlert {
  if (!value || typeof value !== 'object') throw new Error('Invalid market threshold response');
  const row = value as OwnedMarketAlert;
  if (row.user_id !== owner || typeof row.id !== 'string' || !uuid.test(row.id) || !validChoice(row) || [row.created_at, row.updated_at].some(date => typeof date !== 'string' || !Number.isFinite(Date.parse(date)))) throw new Error('Invalid market threshold response');
  return { id: row.id, user_id: owner, commune: row.commune, target_price_m2: row.target_price_m2, direction: row.direction, active: row.active, created_at: row.created_at, updated_at: row.updated_at };
}
async function currentToken(owner: string): Promise<string> {
  if (!supabase || !owner) throw new Error('Market thresholds unavailable');
  const response = await supabase.auth.getSession();
  if (response.error || response.data.session?.user.id !== owner || !response.data.session.access_token) throw new Error('Market threshold account changed');
  return response.data.session.access_token;
}
async function verifiedToken(owner: string): Promise<string> {
  const token = await currentToken(owner), response = await supabase!.auth.getUser(token);
  if (response.error || response.data.user?.id !== owner) throw new Error('Market threshold account changed');
  return token;
}
function endpoint(owner: string): URL {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error('Market thresholds unavailable');
  const url = new URL(base + '/rest/v1/market_alerts');
  url.searchParams.set('user_id', 'eq.' + owner); url.searchParams.set('select', columns);
  return url;
}
function headers(token: string): Record<string,string> {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('Market thresholds unavailable');
  return { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
export async function loadOwnedMarketAlerts(owner: string, commune?: string): Promise<OwnedMarketAlert[]> {
  const token = await verifiedToken(owner), url = endpoint(owner);
  if (commune !== undefined) url.searchParams.set('commune', 'eq.' + commune);
  url.searchParams.set('order', 'id.asc'); url.searchParams.set('limit', '100');
  const rows: OwnedMarketAlert[] = [], seen = new Set<string>();
  for (let page = 0; page < 100; page++) {
    const response = await fetch(url.toString(), { headers: headers(token), cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Market thresholds read failed');
    const data: unknown = await response.json();
    if (!Array.isArray(data) || data.length > 100) throw new Error('Invalid market threshold response');
    if (!data.length) { await currentToken(owner); return rows; }
    for (const value of data) {
      const row = parseRow(value, owner);
      if (seen.has(row.id) || (commune !== undefined && row.commune !== commune) || (rows.length && row.id <= rows[rows.length - 1].id)) throw new Error('Invalid market threshold response');
      seen.add(row.id); rows.push(row);
    }
    // Request until an empty page, even if the server caps pages below 100.
    url.searchParams.set('id', 'gt.' + rows[rows.length - 1].id);
    await currentToken(owner);
  }
  throw new Error('Market threshold list incomplete');
}
export async function writeOwnedMarketAlert(owner: string, baseline: OwnedMarketAlert | null, choice: MarketAlertChoice | null, stillCurrent: () => boolean): Promise<OwnedMarketAlert> {
  if (baseline) parseRow(baseline, owner);
  if ((!baseline && !choice) || (choice && !validChoice(choice)) || (baseline && choice && choice.commune !== baseline.commune)) throw new Error('Invalid market threshold choice');
  const token = await verifiedToken(owner), url = endpoint(owner);
  const id = baseline?.id ?? crypto.randomUUID();
  if (baseline) {
    for (const field of ['id','commune','direction','active','updated_at'] as const) url.searchParams.set(field, 'eq.' + baseline[field]);
    url.searchParams.set('target_price_m2', baseline.target_price_m2 === null ? 'is.null' : 'eq.' + baseline.target_price_m2);
  }
  const payload = choice ? { commune: choice.commune, target_price_m2: choice.target_price_m2, direction: choice.direction, active: choice.active, ...(!baseline ? { id, user_id: owner } : {}) } : undefined;
  await currentToken(owner);
  if (!stillCurrent()) throw new Error('Market threshold account changed');
  const response = await fetch(url.toString(), { method: !choice ? 'DELETE' : baseline ? 'PATCH' : 'POST', headers: headers(token), ...(payload ? { body: JSON.stringify(payload) } : {}), cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Market threshold write not confirmed');
  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.length !== 1) throw new Error('Market threshold write not confirmed');
  const result = parseRow(data[0], owner);
  if (result.id !== id || (choice && (['commune','target_price_m2','direction','active'] as const).some(key => result[key] !== choice[key]))) throw new Error('Market threshold write not confirmed');
  await currentToken(owner);
  return result;
}
