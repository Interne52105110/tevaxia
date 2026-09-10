import { supabase } from './supabase';
import type { SharedLink, SharedLinkComment, SharedLinkTimelineDay } from './shared-links';
export type OwnedSharedLink = Omit<SharedLink, 'payload'> & { owner_user_id: string };
const columns = 'id,token,owner_user_id,org_id,tool_type,title,view_count,max_views,expires_at,created_at';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const tools = ['bilan-promoteur','estimation','valorisation','dcf-multi','hotel-valorisation','hotel-dscr'];
function parseLink(value: unknown, owner: string): OwnedSharedLink {
  if (!value || typeof value !== 'object') throw new Error('Invalid shared link');
  const row = value as OwnedSharedLink;
  if (row.owner_user_id !== owner || !uuid.test(row.id) || !/^[a-f0-9]{48}$/.test(row.token) || (row.org_id !== null && !uuid.test(row.org_id)) || !tools.includes(row.tool_type) || (row.title !== null && typeof row.title !== 'string') || !Number.isSafeInteger(row.view_count) || row.view_count < 0 || (row.max_views !== null && (!Number.isSafeInteger(row.max_views) || row.max_views < 1)) || [row.created_at,row.expires_at].some(date => typeof date !== 'string' || !Number.isFinite(Date.parse(date)))) throw new Error('Invalid shared link');
  return Object.fromEntries(columns.split(',').map(key => [key, row[key as keyof OwnedSharedLink]])) as OwnedSharedLink;
}
async function currentToken(owner: string) {
  if (!supabase || !owner) throw new Error('Shared links unavailable');
  const result = await supabase.auth.getSession();
  if (result.error || result.data.session?.user.id !== owner || !result.data.session.access_token) throw new Error('Shared-link account changed');
  return result.data.session.access_token;
}
async function context(owner: string) {
  const token = await currentToken(owner), verified = await supabase!.auth.getUser(token);
  if (verified.error || verified.data.user?.id !== owner) throw new Error('Shared-link account changed');
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) throw new Error('Shared links unavailable');
  return { base, headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' } };
}
export async function assertSharedLinkAccount(owner: string): Promise<void> {
  await currentToken(owner);
}
function endpoint(base: string, owner: string) {
  const url = new URL(base + '/rest/v1/shared_links'); url.searchParams.set('select', columns); url.searchParams.set('owner_user_id', 'eq.' + owner); return url;
}
export async function listOwnedSharedLinks(owner: string): Promise<OwnedSharedLink[]> {
  const { base, headers } = await context(owner), url = endpoint(base, owner), rows: OwnedSharedLink[] = [];
  url.searchParams.set('order', 'id.asc'); url.searchParams.set('limit', '100');
  const signal = AbortSignal.timeout(60000); let last = '';
  for (let page = 0; page <= 100; page++) {
    await currentToken(owner);
    const response = await fetch(url.toString(), { headers, cache: 'no-store', signal });
    if (!response.ok) throw new Error('Shared-link list unavailable');
    const data: unknown = await response.json();
    if (!Array.isArray(data) || data.length > 100) throw new Error('Invalid shared-link list');
    if (!data.length) { await currentToken(owner); return rows.sort((a,b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id)); }
    if (page === 100) throw new Error('Shared-link list incomplete');
    for (const value of data) { const row = parseLink(value, owner); if (row.id <= last) throw new Error('Invalid shared-link order'); last = row.id; rows.push(row); }
    url.searchParams.set('id', 'gt.' + last);
  }
  throw new Error('Shared-link list incomplete');
}
export async function revokeOwnedSharedLink(owner: string, baseline: OwnedSharedLink, stillCurrent: () => boolean): Promise<void> {
  parseLink(baseline, owner);
  const { base, headers } = await context(owner), url = endpoint(base, owner);
  url.searchParams.set('id', 'eq.' + baseline.id); url.searchParams.set('token', 'eq.' + baseline.token);
  // Bind revocation to the exact access link; concurrent view increments do not block it.
  await currentToken(owner); if (!stillCurrent()) throw new Error('Shared-link account changed');
  const response = await fetch(url.toString(), { method: 'DELETE', headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Shared-link revocation not confirmed');
  const data: unknown = await response.json();
  if (!Array.isArray(data) || data.length !== 1) throw new Error('Shared-link revocation not confirmed');
  const row = parseLink(data[0], owner);
  if (row.id !== baseline.id || row.token !== baseline.token) throw new Error('Shared-link revocation not confirmed');
  await currentToken(owner);
}
export async function loadOwnedLinkDetails(owner: string, baseline: OwnedSharedLink): Promise<{ timeline: SharedLinkTimelineDay[]; comments: SharedLinkComment[] }> {
  parseLink(baseline, owner);
  const { base, headers } = await context(owner), url = endpoint(base, owner);
  url.searchParams.set('id', 'eq.' + baseline.id); url.searchParams.set('token', 'eq.' + baseline.token); url.searchParams.set('limit', '2');
  const signal = AbortSignal.timeout(30000);
  const check = await fetch(url.toString(), { headers, cache: 'no-store', signal });
  if (!check.ok) throw new Error('Link details unavailable');
  const links: unknown = await check.json();
  if (!Array.isArray(links) || links.length !== 1 || parseLink(links[0], owner).id !== baseline.id || links[0].token !== baseline.token) throw new Error('Link details unavailable');
  await currentToken(owner);
  async function rpc(name: string, body: object) {
    const response = await fetch(base + '/rest/v1/rpc/' + name, { method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store', signal });
    if (!response.ok) throw new Error('Link details unavailable');
    const data = await response.json(); if (data?.success !== true) throw new Error('Link details unavailable'); return data;
  }
  const [timelineResult, commentResult] = await Promise.all([rpc('get_shared_link_timeline', { p_link_id: baseline.id, p_days: 30 }), rpc('list_shared_link_comments', { p_link_id: baseline.id })]);
  const timeline: SharedLinkTimelineDay[] = [], comments: SharedLinkComment[] = [];
  if (!Array.isArray(timelineResult.timeline) || timelineResult.timeline.length !== 31 || !Array.isArray(commentResult.comments) || commentResult.comments.length > 10000) throw new Error('Invalid link details');
  for (const row of timelineResult.timeline) {
    if (!row || typeof row.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.day) || !Number.isFinite(Date.parse(row.day)) || new Date(row.day).toISOString().slice(0,10) !== row.day || !Number.isSafeInteger(row.views) || row.views < 0 || (timeline.length && Date.parse(row.day) - Date.parse(timeline[timeline.length-1].day) !== 86400000)) throw new Error('Invalid link timeline');
    timeline.push({ day: row.day, views: row.views });
  }
  const seen = new Set<string>();
  for (const row of commentResult.comments) {
    if (!row || !uuid.test(row.id) || seen.has(row.id) || typeof row.message !== 'string' || typeof row.created_at !== 'string' || !Number.isFinite(Date.parse(row.created_at)) || (row.visitor_name !== null && typeof row.visitor_name !== 'string') || (row.visitor_email !== null && typeof row.visitor_email !== 'string')) throw new Error('Invalid link comments');
    seen.add(row.id); comments.push({ id: row.id, message: row.message, visitor_name: row.visitor_name, visitor_email: row.visitor_email, created_at: row.created_at });
  }
  await currentToken(owner); return { timeline, comments };
}
