import type { SharedToolType } from './shared-links';
export interface SharedLinkDraft {
  id: string; owner_user_id: string; tool_type: SharedToolType; title: string | null;
  payload: Record<string, unknown>; org_id: null; max_views: number | null; expires_at: string;
}
/** Snapshot JSON at the user's action; omit optional object fields but reject non-JSON numbers/functions. */
export function sharedPayloadJson(payload: Record<string, unknown>): string {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Invalid shared calculation');
  const json = JSON.stringify(payload, (_key, value) => {
    if ((typeof value === 'number' && !Number.isFinite(value)) || ['function','symbol','bigint'].includes(typeof value)) throw new Error('Invalid shared calculation');
    return value;
  });
  if (!json || new TextEncoder().encode(json).length > 250000) throw new Error('Shared calculation too large');
  return json;
}
export function prepareSharedLinkDraft(owner: string, input: { tool_type: SharedToolType; payload: Record<string, unknown>; title: string; days: string; maxViews: string }): SharedLinkDraft {
  if (!owner || !['bilan-promoteur','estimation','valorisation','dcf-multi','hotel-valorisation','hotel-dscr'].includes(input.tool_type) || typeof input.title !== 'string' || input.title.trim().length > 200) throw new Error('Invalid shared-link choice');
  if (!/^\d+$/.test(input.days) || Number(input.days) < 1 || Number(input.days) > 365) throw new Error('Invalid shared-link duration');
  const maximum = input.maxViews.trim();
  if (maximum !== '' && (!/^\d+$/.test(maximum) || !Number.isSafeInteger(Number(maximum)) || Number(maximum) < 1 || Number(maximum) > 1000000)) throw new Error('Invalid view limit');
  return { id: crypto.randomUUID(), owner_user_id: owner, tool_type: input.tool_type, title: input.title.trim() || null, payload: JSON.parse(sharedPayloadJson(input.payload)), org_id: null, max_views: maximum === '' ? null : Number(maximum), expires_at: new Date(Date.now() + Number(input.days) * 86400000).toISOString() };
}
export function canonicalSharedJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalSharedJson).join(',') + ']';
  const object = value as Record<string, unknown>;
  return '{' + Object.keys(object).sort().map(key => JSON.stringify(key) + ':' + canonicalSharedJson(object[key])).join(',') + '}';
}
