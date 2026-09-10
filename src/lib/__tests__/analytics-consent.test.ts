import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
let consent: typeof import("../analytics-consent"), store: Map<string, string>, cookies: Map<string, string>;
beforeEach(async () => {
  vi.resetModules(); store = new Map(); cookies = new Map([["_ga", "analytics"], ["_ga_TEST", "stream"], ["sb-auth-token", "session"], ["other", "keep"]]);
  vi.stubGlobal("window", new EventTarget()); window.gtag = vi.fn();
  vi.stubGlobal("location", { hostname: "app.tevaxia.lu" });
  vi.stubGlobal("localStorage", { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) });
  vi.stubGlobal("document", { get cookie() { return [...cookies].map(([k, v]) => `${k}=${v}`).join("; "); }, set cookie(value: string) { if (value.includes("Max-Age=0")) cookies.delete(value.split("=")[0]); } });
  consent = await import("../analytics-consent");
});
afterEach(() => vi.unstubAllGlobals());
describe("browser analytics consent", () => {
  it("starts undecided with no implicit grant", () => expect(consent.readAnalyticsConsent()).toBeNull());
  it.each(["true", "accepted", "invalid"])("does not accept an unknown stored value %s", value => { store.set(consent.ANALYTICS_CONSENT_KEY, value); expect(consent.readAnalyticsConsent()).toBeNull(); });
  it("remembers a grant and keeps all advertising permissions denied", () => {
    const handler = vi.fn(); consent.listenAnalyticsConsent(handler);
    expect(consent.setAnalyticsConsent("granted")).toBe(true); expect(consent.readAnalyticsConsent()).toBe("granted");
    expect((window as unknown as Record<string, unknown>)[`ga-disable-${consent.GA_MEASUREMENT_ID}`]).toBe(false);
    expect(window.gtag).toHaveBeenCalledWith("consent", "update", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it("withdraws a prior grant synchronously and only clears GA cookies", () => {
    consent.setAnalyticsConsent("granted"); consent.setAnalyticsConsent("denied");
    expect(consent.readAnalyticsConsent()).toBe("denied"); expect((window as unknown as Record<string, unknown>)[`ga-disable-${consent.GA_MEASUREMENT_ID}`]).toBe(true);
    expect([...cookies]).toEqual([["sb-auth-token", "session"], ["other", "keep"]]);
  });
  it("reports blocked persistence and still applies refusal on this page", () => {
    store.set(consent.ANALYTICS_CONSENT_KEY, "granted"); localStorage.setItem = () => { throw new Error("blocked"); };
    expect(consent.setAnalyticsConsent("denied")).toBe(false); expect(consent.readAnalyticsConsent()).toBe("denied");
    expect(store.get(consent.ANALYTICS_CONSENT_KEY)).toBe("granted");
  });
  it("synchronizes a changed choice from another tab", () => {
    const handler = vi.fn(); consent.listenAnalyticsConsent(handler);
    const event = new Event("storage"); Object.defineProperty(event, "key", { value: consent.ANALYTICS_CONSENT_KEY });
    store.set(consent.ANALYTICS_CONSENT_KEY, "denied"); window.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(1); expect(consent.readAnalyticsConsent()).toBe("denied");
  });
  it("unsubscribes the page listener", () => { const handler = vi.fn(), stop = consent.listenAnalyticsConsent(handler); stop(); consent.setAnalyticsConsent("denied"); expect(handler).not.toHaveBeenCalled(); });
  it("keeps withdrawal working when the external SDK throws", () => { window.gtag = () => { throw new Error("SDK failed"); }; expect(consent.setAnalyticsConsent("denied")).toBe(true); expect(consent.readAnalyticsConsent()).toBe("denied"); });
  it("keeps withdrawal working when cookie access is blocked", () => { vi.stubGlobal("document", { get cookie() { throw new Error("blocked"); } }); expect(consent.setAnalyticsConsent("denied")).toBe(true); });
  it("treats unreadable storage as undecided", () => { localStorage.getItem = () => { throw new Error("blocked"); }; expect(consent.readAnalyticsConsent()).toBeNull(); });
  it("rejects an invalid explicit choice", () => expect(() => consent.setAnalyticsConsent("invalid" as "granted")).toThrow());
});
