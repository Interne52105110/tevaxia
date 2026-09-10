"use client";
import { useEffect } from "react";
import { listenAnalyticsConsent, readAnalyticsConsent } from "@/lib/analytics-consent";
import type { PostHog } from "posthog-js";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    let active = true;
    let instance: PostHog | null = null;
    let loading = false;
    const update = async () => {
      if (readAnalyticsConsent() !== "granted") { instance?.opt_out_capturing(); return; }
      if (instance) { instance.opt_in_capturing({ captureEventName: false }); return; }
      if (loading) return;
      loading = true;
      try {
        const { default: posthog } = await import("posthog-js");
        if (!active || readAnalyticsConsent() !== "granted") return;
        instance = posthog;
        if (!posthog.__loaded) posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
          capture_pageview: "history_change", capture_pageleave: true,
          disable_session_recording: true, persistence: "localStorage+cookie",
          opt_out_capturing_by_default: true, opt_out_persistence_by_default: true,
          before_send: event => readAnalyticsConsent() === "granted" ? event : null,
        });
        posthog.opt_in_capturing({ captureEventName: false });
      } catch { /* Analytics failure must not break the user's workflow. */ }
      finally { loading = false; }
    };
    void update();
    const unsubscribe = listenAnalyticsConsent(() => { void update(); });
    return () => { active = false; unsubscribe(); };
  }, []);
  return <>{children}</>;
}
