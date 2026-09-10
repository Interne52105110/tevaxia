"use client";
import { useEffect } from "react";
import { applyGoogleConsent, listenAnalyticsConsent } from "@/lib/analytics-consent";

/** Retired collector: remotely enabled enhanced measurement cannot be filtered here.
 * Public audience measurement is handled by the restricted PostHog provider.
 * Keep withdrawal/old-cookie cleanup on browsers that previously enabled GA.
 */
export default function GtagLoader() {
  useEffect(() => {
    const disable = () => applyGoogleConsent(false);
    disable();
    return listenAnalyticsConsent(disable);
  }, []);
  return null;
}
