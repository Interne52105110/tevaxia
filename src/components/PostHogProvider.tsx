"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { listenAnalyticsConsent, readAnalyticsConsent } from "@/lib/analytics-consent";
import { PUBLIC_AUDIENCE_CONFIG, publicAnalyticsPath, sanitizeAudienceEvent } from "@/lib/analytics-privacy";
import type { PostHog } from "posthog-js";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const instance = useRef<PostHog | null>(null);
  const lastPage = useRef<string | null>(null);
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    let active = true, loading = false;
    const allowed = () => readAnalyticsConsent() === "granted" && publicAnalyticsPath(location.pathname) !== null;
    const update = async () => {
      if (!allowed()) { instance.current?.opt_out_capturing(); lastPage.current = null; return; }
      if (loading) return;
      loading = true;
      try {
        const { default: posthog } = await import("posthog-js");
        if (!active || !allowed()) return;
        const config = { ...PUBLIC_AUDIENCE_CONFIG,
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
          get_current_url: () => 'https://tevaxia.lu' + (publicAnalyticsPath(location.pathname) ?? '/'),
          before_send: (event: Parameters<typeof sanitizeAudienceEvent>[0]) => sanitizeAudienceEvent(event, location.pathname, readAnalyticsConsent() === "granted"),
        };
        if (!posthog.__loaded) posthog.init(key, config);
        else posthog.set_config(config);
        instance.current = posthog;
        posthog.opt_in_capturing({ captureEventName: false });
        const page = publicAnalyticsPath(location.pathname);
        if (page !== lastPage.current) { posthog.capture('$pageview'); lastPage.current = page; }
      } catch { /* Audience measurement must not break the user's workflow. */ }
      finally { loading = false; }
    };
    void update();
    const unsubscribe = listenAnalyticsConsent(() => { void update(); });
    return () => { active = false; unsubscribe(); };
  }, [pathname]);
  return <>{children}</>;
}
