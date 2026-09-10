import { supabase } from './supabase';
export interface AccountDashboard {
  plan: { tier: 'free' | 'pro' | 'enterprise'; itemsCap: number } | null;
  valuations: number | null; thresholds: number | null; sharedLinks: number | null; apiKeys: number | null;
  incomplete: boolean;
}
async function currentToken(owner: string): Promise<string> {
  if (!supabase || !owner) throw new Error('Account dashboard unavailable');
  const response = await supabase.auth.getSession();
  if (response.error || response.data.session?.user.id !== owner || !response.data.session.access_token) throw new Error('Dashboard account changed');
  return response.data.session.access_token;
}
export function exactDashboardCount(value: string | null): number {
  const match = value?.match(/\/(\d+)$/);
  const count = match ? Number(match[1]) : NaN;
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Dashboard count unavailable');
  return count;
}
export async function loadAccountDashboard(owner: string): Promise<AccountDashboard> {
  const token = await currentToken(owner), verified = await supabase!.auth.getUser(token);
  if (verified.error || verified.data.user?.id !== owner) throw new Error('Dashboard account changed');
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error('Dashboard unavailable');
  const headers = { apikey: key, Authorization: `Bearer ${token}`, Prefer: 'count=exact' };
  async function count(table: string, ownerColumn: string, filter?: [string,string]): Promise<number | null> {
    try {
      const url = new URL(base + '/rest/v1/' + table);
      url.searchParams.set('select', 'id'); url.searchParams.set(ownerColumn, 'eq.' + owner); url.searchParams.set('limit', '1');
      if (filter) url.searchParams.set(...filter);
      const response = await fetch(url.toString(), { method: 'HEAD', headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) return null;
      return exactDashboardCount(response.headers.get('content-range'));
    } catch { return null; }
  }
  async function plan(): Promise<AccountDashboard['plan']> {
    try {
      const url = new URL(base + '/rest/v1/user_tiers');
      url.searchParams.set('select', 'user_id,tier,items_cap,expires_at'); url.searchParams.set('user_id', 'eq.' + owner); url.searchParams.set('limit', '2');
      const response = await fetch(url.toString(), { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) return null;
      const rows: unknown = await response.json();
      if (!Array.isArray(rows) || rows.length !== 1) return null;
      const row = rows[0];
      if (!row || row.user_id !== owner || !['free','pro','enterprise'].includes(row.tier) || !Number.isSafeInteger(row.items_cap) || row.items_cap < 0 || (row.expires_at !== null && (typeof row.expires_at !== 'string' || !Number.isFinite(Date.parse(row.expires_at)) || Date.parse(row.expires_at) <= Date.now()))) return null;
      return { tier: row.tier, itemsCap: row.items_cap };
    } catch { return null; }
  }
  const [planValue, valuations, thresholds, sharedLinks, apiKeys] = await Promise.all([
    plan(), count('valuations', 'user_id'), count('market_alerts', 'user_id', ['active','eq.true']),
    count('shared_links', 'owner_user_id'), count('api_keys', 'user_id', ['revoked_at','is.null']),
  ]);
  await currentToken(owner);
  return { plan: planValue, valuations, thresholds, sharedLinks, apiKeys, incomplete: [planValue,valuations,thresholds,sharedLinks,apiKeys].some(value => value === null) };
}
