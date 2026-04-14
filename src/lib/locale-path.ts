// ============================================================
// LOCALE-AWARE PATH HELPER
// ============================================================
// Prefixes paths with the current locale when not French (default).
// French has no prefix (e.g., /estimation), others do (e.g., /en/estimation).

const LOCALE_PREFIXES = ["en", "de", "pt", "lb"];

/**
 * Detects the current locale from the browser pathname.
 * Returns "" for French (default), "/en", "/de", "/pt", "/lb" for others.
 */
export function getLocalePrefix(): string {
  if (typeof window === "undefined") return "";
  const pathname = window.location.pathname;
  for (const loc of LOCALE_PREFIXES) {
    if (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)) {
      return `/${loc}`;
    }
  }
  return "";
}

/**
 * Prefixes a path with the current locale.
 * - localePath("/estimation") → "/en/estimation" (if on English)
 * - localePath("/estimation") → "/estimation" (if on French)
 * - localePath("/energy/impact") → "/de/energy/impact" (if on German)
 * - Already-prefixed paths are returned as-is.
 */
export function localePath(path: string): string {
  const prefix = getLocalePrefix();
  if (!prefix) return path;
  // Don't double-prefix
  if (path.startsWith(prefix)) return path;
  return `${prefix}${path}`;
}
