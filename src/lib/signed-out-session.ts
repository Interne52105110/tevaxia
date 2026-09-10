import { stringFromBase64URL } from '@supabase/ssr';
export const SIGNED_OUT_PREFIX = 'tevaxia_signed_out_session:v1:';
export const SIGNED_OUT_EVENT = 'tevaxia-session-signed-out';
const memory = new Set<string>();
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export interface SessionIdentity { owner: string; sessionId: string }
/** Local session matching only. Server authorization always uses the captured JWT. */
export function sessionIdentity(token: unknown): SessionIdentity | null {
  if (typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const claims = JSON.parse(stringFromBase64URL(parts[1]));
    return UUID.test(claims.sub) && UUID.test(claims.session_id) ? { owner: claims.sub, sessionId: claims.session_id } : null;
  } catch { return null; }
}
export function isSignedOutSession(token: unknown): boolean {
  const identity = sessionIdentity(token);
  if (!identity) return false;
  if (memory.has(identity.sessionId)) return true;
  try { return localStorage.getItem(SIGNED_OUT_PREFIX + identity.sessionId) === 'confirmed'; }
  catch { return false; }
}
export function markSignedOutSession(identity: SessionIdentity): boolean {
  memory.add(identity.sessionId);
  let remembered = true;
  try { localStorage.setItem(SIGNED_OUT_PREFIX + identity.sessionId, 'confirmed'); } catch { remembered = false; }
  window.dispatchEvent(new CustomEvent<SessionIdentity>(SIGNED_OUT_EVENT, { detail: identity }));
  return remembered;
}
