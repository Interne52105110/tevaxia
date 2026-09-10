// Legacy business-event interface retained without sending private data.

export function track(event: string, properties?: Record<string, unknown>): void {
  // Only the provider emits audience pageviews; private business events are excluded.
  void event; void properties;
  return;
}

/** Account identity and traits are deliberately excluded from audience measurement. */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  void userId; void traits;
}

/** Reset à la déconnexion. */
export function reset(): void {
  if (typeof window === "undefined") return;
  import("posthog-js").then((mod) => {
    const ph = mod.default;
    if (!ph?.__loaded) return;
    ph.reset();
  }).catch(() => { /* silence */ });
}

/**
 * Capture une exception vers Sentry. Aucun événement métier de mesure d’audience.
 * Silent fail si Sentry pas configuré (DSN env var absent).
 *
 * Usage : captureError(err, { module: "facturation", action: "generate", ... })
 */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  // Toujours log en console — utile dev et fallback prod sans Sentry

  console.error("[tevaxia error]", err, context);

  if (typeof window === "undefined") return;
  // Track en analytics aussi pour stats funnel
  track("client_error", {
    message: err instanceof Error ? err.message : String(err),
    ...(context ?? {}),
  });
  // Sentry capture si dispo
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureException(err, { extra: context });
  }).catch(() => { /* sentry non chargé / non configuré */ });
}
