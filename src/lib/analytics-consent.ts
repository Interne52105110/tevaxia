export const ANALYTICS_CONSENT_KEY = "tevaxia_consent";
export const ANALYTICS_CONSENT_EVENT = "tevaxia:consent-changed";
export const OPEN_COOKIE_SETTINGS_EVENT = "tevaxia:cookie-settings";
export const GA_MEASUREMENT_ID = "G-4033901KHR";
export type AnalyticsConsent = "granted" | "denied";
declare global { interface Window { gtag: (...args: unknown[]) => void } }
let temporaryChoice: AnalyticsConsent | undefined;

export function readAnalyticsConsent(): AnalyticsConsent | null {
  if (temporaryChoice) return temporaryChoice;
  try {
    const value = typeof window === "undefined" ? null : localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch { return null; }
}

export function applyGoogleConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = !granted;
  try {
    if (typeof window.gtag === "function") window.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    });
  } catch { /* A third-party SDK failure must not prevent withdrawal. */ }
  if (!granted) {
    try {
    const domains = ["", location.hostname, ...(location.hostname === "tevaxia.lu" || location.hostname.endsWith(".tevaxia.lu") ? [".tevaxia.lu"] : [])];
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0].trim();
      if (name !== "_ga" && !name.startsWith("_ga_")) continue;
      for (const domain of domains) document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""}`;
    }
    } catch { /* Some browsers block cookie access; collection is disabled above. */ }
  }
}

/** Returns whether the explicit choice could be remembered beyond this page. */
export function setAnalyticsConsent(choice: AnalyticsConsent): boolean {
  if (choice !== "granted" && choice !== "denied") throw new Error("Invalid consent choice");
  let persisted = true;
  try { localStorage.setItem(ANALYTICS_CONSENT_KEY, choice); temporaryChoice = undefined; }
  catch { temporaryChoice = choice; persisted = false; }
  applyGoogleConsent(choice === "granted");
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT));
  return persisted;
}

export function listenAnalyticsConsent(handler: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ANALYTICS_CONSENT_KEY || event.key === null) { temporaryChoice = undefined; handler(); }
  };
  window.addEventListener(ANALYTICS_CONSENT_EVENT, handler);
  window.addEventListener("storage", onStorage);
  return () => { window.removeEventListener(ANALYTICS_CONSENT_EVENT, handler); window.removeEventListener("storage", onStorage); };
}
