import { supabase } from './supabase';
import { PROFILE_TYPES, type ProfileType } from './profile-types';
export interface ProfileTypesSnapshot { types: ProfileType[] | null; updatedAt: string | null }
const allowed = new Set<string>(PROFILE_TYPES.map(type => type.value));
function validTypes(value: unknown): value is ProfileType[] {
  return Array.isArray(value) && value.length <= allowed.size && value.every(type => typeof type === 'string' && allowed.has(type)) && new Set(value).size === value.length;
}
function parseRow(row: unknown, owner: string): ProfileTypesSnapshot {
  if (!row || typeof row !== 'object') throw new Error('Invalid profile types response');
  const data = row as Record<string, unknown>;
  if (data.user_id !== owner || (data.profile_types !== null && !validTypes(data.profile_types)) || typeof data.updated_at !== 'string' || !Number.isFinite(Date.parse(data.updated_at))) throw new Error('Invalid profile types response');
  return { types: data.profile_types as ProfileType[] | null, updatedAt: data.updated_at };
}
async function currentToken(owner: string): Promise<string> {
  if (!supabase || !owner) throw new Error('Profile types unavailable');
  const result = await supabase.auth.getSession();
  if (result.error || result.data.session?.user.id !== owner || !result.data.session.access_token) throw new Error('Profile account changed');
  return result.data.session.access_token;
}
async function verifiedToken(owner: string): Promise<string> {
  const token = await currentToken(owner);
  const result = await supabase!.auth.getUser(token);
  if (result.error || result.data.user?.id !== owner) throw new Error('Profile account changed');
  return token;
}
function endpoint(owner: string): URL {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error('Profile types unavailable');
  const url = new URL(base + '/rest/v1/user_preferences');
  url.searchParams.set('select', 'user_id,profile_types,updated_at');
  url.searchParams.set('user_id', 'eq.' + owner);
  return url;
}
function headers(token: string): Record<string,string> {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('Profile types unavailable');
  return { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
}
export async function loadProfileTypes(owner: string): Promise<ProfileTypesSnapshot> {
  const token = await verifiedToken(owner), url = endpoint(owner); url.searchParams.set('limit', '2');
  const response = await fetch(url.toString(), { headers: headers(token), cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Profile types read failed');
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length > 1) throw new Error('Invalid profile types response');
  const result = rows.length ? parseRow(rows[0], owner) : { types: null, updatedAt: null };
  await currentToken(owner);
  return result;
}
export async function saveProfileTypes(owner: string, baseline: ProfileTypesSnapshot, next: ProfileType[], stillCurrent: () => boolean): Promise<ProfileTypesSnapshot> {
  if (!validTypes(next) || (baseline.types !== null && !validTypes(baseline.types))) throw new Error('Invalid profile types');
  const token = await verifiedToken(owner), url = endpoint(owner);
  const payload: Record<string,unknown> = { profile_types: next.length ? next : null };
  if (baseline.updatedAt) {
    if (!Number.isFinite(Date.parse(baseline.updatedAt))) throw new Error('Invalid profile version');
    url.searchParams.set('updated_at', 'eq.' + baseline.updatedAt);
    // Array equality also prevents lost writes when a timestamp trigger is absent.
    url.searchParams.set('profile_types', baseline.types === null ? 'is.null' : `eq.{${baseline.types.join(',')}}`);
  } else payload.user_id = owner;
  await currentToken(owner);
  if (!stillCurrent()) throw new Error('Profile account changed');
  const response = await fetch(url.toString(), { method: baseline.updatedAt ? 'PATCH' : 'POST', headers: headers(token), body: JSON.stringify(payload), cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Profile types save not confirmed');
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error('Profile types save not confirmed');
  const result = parseRow(rows[0], owner);
  if (JSON.stringify(result.types) !== JSON.stringify(payload.profile_types)) throw new Error('Profile types save not confirmed');
  await currentToken(owner);
  return result;
}
