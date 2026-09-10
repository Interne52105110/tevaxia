"use client";
import { useEffect } from "react";
import { applyGoogleConsent, GA_MEASUREMENT_ID, listenAnalyticsConsent, readAnalyticsConsent } from "@/lib/analytics-consent";

function loadGtag() {
  if (readAnalyticsConsent() !== "granted" || document.querySelector(`script[data-gtag="${GA_MEASUREMENT_ID}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.setAttribute("data-gtag", GA_MEASUREMENT_ID);
  script.onload = () => {
    // A refusal may arrive while the script is downloading.
    const granted = readAnalyticsConsent() === "granted";
    applyGoogleConsent(granted);
    if (!granted) { script.remove(); return; }
    (window as unknown as { dataLayer: unknown[] }).dataLayer ??= [];
    const gtag = (...args: unknown[]) => (window as unknown as { dataLayer: unknown[] }).dataLayer.push(args);
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  };
  script.onerror = () => script.remove();
  document.head.appendChild(script);
}

export default function GtagLoader() {
  useEffect(() => {
    const update = () => { const granted = readAnalyticsConsent() === "granted"; applyGoogleConsent(granted); if (granted) loadGtag(); };
    update();
    return listenAnalyticsConsent(update);
  }, []);
  return null;
}
