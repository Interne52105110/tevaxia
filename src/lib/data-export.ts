// ============================================================
// EXPORT RGPD — Export JSON complet des données utilisateur
// ============================================================
// Agrège : profil, évaluations (local + cloud), lots locatifs (local +
// cloud), alertes marché, liens partagés, clés API. Ne contient PAS
// les clés API en clair (seulement les hashes). Téléchargement direct
// côté client.

import { supabase } from "./supabase";
import { listerEvaluationsAsync } from "./storage";
import { listLotsAsync } from "./gestion-locative";
import { getProfile } from "./profile";

export interface DataExport {
  exported_at: string;
  user_email: string | null;
  user_id: string | null;
  tier: {
    tier: string;
    items_cap: number;
    granted_at?: string;
    expires_at?: string | null;
  } | null;
  profile: Record<string, unknown>;
  valuations: unknown[];
  rental_lots: unknown[];
  market_alerts: unknown[];
  shared_links: unknown[];
  api_keys: unknown[];
}

export async function buildDataExport(): Promise<DataExport> {
  const now = new Date().toISOString();
  const exp: DataExport = {
    exported_at: now,
    user_email: null,
    user_id: null,
    tier: null,
    profile: getProfile() as unknown as Record<string, unknown>,
    valuations: [],
    rental_lots: [],
    market_alerts: [],
    shared_links: [],
    api_keys: [],
  };

  // Items locaux/mergés
  const [{ items: valuations }, { items: lots }] = await Promise.all([
    listerEvaluationsAsync(),
    listLotsAsync(),
  ]);
  exp.valuations = valuations;
  exp.rental_lots = lots;

  if (!supabase) return exp;

  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return exp;

    exp.user_email = user.email ?? null;
    exp.user_id = user.id;

    const [tierRes, alertsRes, sharedRes, keysRes] = await Promise.all([
      supabase.from("user_tiers").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("market_alerts").select("*").eq("user_id", user.id),
      supabase.from("shared_links").select("id,token,tool_type,title,view_count,max_views,expires_at,created_at").eq("owner_user_id", user.id),
      supabase.from("api_keys").select("id,name,tier,created_at,revoked_at,last_used_at").eq("user_id", user.id),
    ]);

    if (tierRes.data) {
      exp.tier = {
        tier: tierRes.data.tier,
        items_cap: tierRes.data.items_cap,
        granted_at: tierRes.data.granted_at,
        expires_at: tierRes.data.expires_at,
      };
    } else {
      exp.tier = { tier: "free", items_cap: 500 };
    }

    exp.market_alerts = alertsRes.data ?? [];
    exp.shared_links = sharedRes.data ?? [];
    exp.api_keys = keysRes.data ?? [];
  } catch (e) {
    console.warn("buildDataExport partial failure:", e);
  }

  return exp;
}

export function downloadAsJsonFile(data: DataExport) {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tevaxia-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
