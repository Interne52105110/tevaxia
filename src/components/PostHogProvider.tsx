"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Initialise PostHog côté client. Respecte le consentement RGPD :
 * l'utilisateur doit avoir coché « consent_analytics » OU le bandeau
 * cookies (localStorage.tevaxia_consent === 'granted').
 * Si aucune des conditions n'est remplie, PostHog reste dormant.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    const consent = typeof window !== "undefined" ? localStorage.getItem("tevaxia_consent") : null;
    if (consent !== "granted") return;

    if (!posthog.__loaded) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
        capture_pageview: "history_change",
        capture_pageleave: true,
        disable_session_recording: true,
        persistence: "localStorage+cookie",
      });
    }
  }, []);

  return <>{children}</>;
}
