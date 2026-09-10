import { combineChunks, isChunkLike, parseCookieHeader, serializeCookieHeader, stringFromBase64URL } from '@supabase/ssr';
import { supabase } from './supabase';
import { markSignedOutSession, sessionIdentity, type SessionIdentity } from './signed-out-session';

export interface SignOutResult { serverRevoked: boolean; localCleared: boolean; accountChanged: boolean; remembered: boolean }

/** Cookie comparison shares the lock used by the installed Supabase Auth client.
 * Recheck the owner/session after the remote response before clearing chunks.
 */
export async function clearOwnedAuthCookies(storageKey: string, expected: SessionIdentity): Promise<'cleared' | 'changed'> {
  if (!navigator.locks) throw new Error('Safe session cleanup unavailable');
  return navigator.locks.request(`lock:${storageKey}`, { mode: 'exclusive', signal: AbortSignal.timeout(10_000) }, async () => {
    const cookies = parseCookieHeader(document.cookie);
    const cookieMap = new Map(cookies.map(item => [item.name, item.value]));
    const raw = await combineChunks(storageKey, name => cookieMap.get(name));
    if (!raw) return 'cleared';
    const session = JSON.parse(raw.startsWith('base64-') ? stringFromBase64URL(raw.slice(7)) : raw);
    const identity = sessionIdentity(session.access_token);
    if (!identity) throw new Error('Unrecognized browser session');
    if (identity.owner !== expected.owner || identity.sessionId !== expected.sessionId) return 'changed';
    const domains = ['', location.hostname, ...(location.hostname === 'tevaxia.lu' || location.hostname.endsWith('.tevaxia.lu') ? ['.tevaxia.lu'] : [])];
    for (const cookie of cookies) {
      if (!isChunkLike(cookie.name, storageKey)) continue;
      for (const domain of domains) document.cookie = serializeCookieHeader(cookie.name, '', {
        path: '/', ...(domain ? { domain } : {}), maxAge: 0, expires: new Date(0), sameSite: 'lax', secure: location.protocol === 'https:',
      });
    }
    // Blocked cookie writes must not be presented as successful local logout.
    if (parseCookieHeader(document.cookie).some(item => isChunkLike(item.name, storageKey))) throw new Error('Browser session could not be cleared');
    return 'cleared';
  });
}

export async function signOutOwnedSession(expected: SessionIdentity, scope: 'local' | 'global', stillCurrent: () => boolean): Promise<SignOutResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabase || !url || !key || !stillCurrent()) throw new Error('Session changed');
  const snapshot = await supabase.auth.getSession();
  const token = snapshot.data.session?.access_token;
  const identity = sessionIdentity(token);
  if (snapshot.error || !token || identity?.owner !== expected.owner || identity.sessionId !== expected.sessionId || !stillCurrent()) throw new Error('Session changed');
  // The Auth server validates this JWT. Do not call SDK signOut, which re-reads
  // the mutable current session after taking a lock and may target another user.
  let serverRevoked = false;
  try {
    const response = await fetch(`${url}/auth/v1/logout?scope=${scope}`, {
      method: 'POST', headers: { apikey: key, Authorization: `Bearer ${token}` },
      cache: 'no-store', signal: AbortSignal.timeout(15_000),
    });
    serverRevoked = response.ok;
  } catch { /* Local logout remains possible offline; remote revocation is unconfirmed. */ }
  const storageKey = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
  try {
    const cleanup = await clearOwnedAuthCookies(storageKey, expected);
    const remembered = markSignedOutSession(expected);
    return { serverRevoked, localCleared: true, accountChanged: cleanup === 'changed', remembered };
  } catch {
    return { serverRevoked, localCleared: false, accountChanged: !stillCurrent(), remembered: false };
  }
}
