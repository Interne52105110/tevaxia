import type { CaptureResult, PostHogConfig } from 'posthog-js';

// Deliberately exact: new/dynamic/private routes do not become measurable by accident.
const PUBLIC_PATHS = new Set(['/', '/propcalc', '/propcalc/developers', '/propcalc/integrations',
  '/frais-acquisition', '/loyer', '/plus-value', '/energy', '/syndic', '/professionnels',
  '/particuliers', '/a-propos', '/contact', '/tarifs', '/confidentialite', '/cgu', '/mentions-legales']);
export function publicAnalyticsPath(pathname: string): string | null {
  if (/[?#%\\]/.test(pathname)) return null;
  const match = pathname.match(/^\/(en|de|pt|lb)(?=\/|$)/);
  const path = (match ? pathname.slice(match[0].length) : pathname) || '/';
  if (!PUBLIC_PATHS.has(path) && !/^\/propcalc\/countries\/(lu|fr|de|be|es|uk|us|it|pt|nl)$/.test(path)) return null;
  return (match?.[0] ?? '') + (path === '/' && match ? '' : path);
}

export function sanitizeAudienceEvent(event: CaptureResult | null, pathname: string, consent: boolean): CaptureResult | null {
  const path = publicAnalyticsPath(pathname);
  if (!consent || !path || event?.event !== '$pageview') return null;
  // Rebuild both levels: SDK enrichment may include referrers, titles, person traits,
  // campaign parameters, query strings, and properties added by future callers.
  return { uuid: event.uuid, event: '$pageview', timestamp: event.timestamp, properties: {
    token: event.properties.token,
    distinct_id: event.properties.distinct_id,
    $process_person_profile: false,
    $current_url: 'https://tevaxia.lu' + path,
    $pathname: path,
    $host: 'tevaxia.lu',
  } };
}

export const PUBLIC_AUDIENCE_CONFIG: Partial<PostHogConfig> = {
  autocapture: false, capture_pageview: false, capture_pageleave: false,
  capture_dead_clicks: false, capture_exceptions: false, capture_heatmaps: false,
  capture_performance: false, disable_scroll_properties: true,
  disable_session_recording: true, disable_surveys: true,
  disable_external_dependency_loading: true, advanced_disable_decide: true,
  advanced_disable_feature_flags: true, person_profiles: 'never',
  persistence: 'memory', disable_persistence: true, ip: false,
  save_campaign_params: false, save_referrer: false,
  opt_out_capturing_by_default: true, opt_out_persistence_by_default: true,
};
