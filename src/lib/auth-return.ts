const FALLBACK = '/mes-evaluations';

/** OAuth return destinations are internal page paths, never URLs or nested redirects. */
export function safeAuthReturnPath(value: string | null): string {
  if (!value || value.length > 2048) return FALLBACK;
  const rawPath = value.split(/[?#]/, 1)[0];
  let decoded = rawPath;
  try {
    for (let i = 0; i < 4; i++) {
      if (!decoded.startsWith('/') || decoded.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(decoded)) return FALLBACK;
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    if (decoded.includes('%') || decoded.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(decoded)) return FALLBACK;
    const parsed = new URL(decoded, 'https://tevaxia.lu');
    if (parsed.origin !== 'https://tevaxia.lu') return FALLBACK;
    const normalized = parsed.pathname.replace(/^\/(en|de|pt|lb)(?=\/|$)/, '');
    if (/^\/(api|auth)(\/|$)/.test(normalized)) return FALLBACK;
    return parsed.pathname;
  } catch { return FALLBACK; }
}

export function authErrorPath(destination: string, code: 'no_code' | 'not_configured' | 'auth_failed' | 'cookie_failed'): string {
  const locale = destination.match(/^\/(en|de|pt|lb)(?=\/|$)/)?.[0] ?? '';
  return `${locale}/connexion?error=${code}`;
}
