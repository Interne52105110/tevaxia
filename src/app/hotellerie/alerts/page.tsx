"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

interface AlertRow {
  id: string;
  hotel_id: string;
  alert_type: "pickup_deviation" | "adr_compset_change" | "occupancy_drop" | "revpar_delta" | "gop_margin_below";
  threshold_pct: number;
  threshold_days: number;
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
  notify_email: boolean;
  notify_push: boolean;
  created_at: string;
}

interface HotelRow {
  id: string;
  name: string;
  nb_chambres: number | null;
  category: string | null;
}

const ALERT_TYPE_LABELS: Record<AlertRow["alert_type"], { title: string; desc: string; icon: string }> = {
  pickup_deviation: {
    title: "Dérive pickup vs forecast",
    desc: "Alerte si le taux de réservations à date diverge du forecast de plus de X%",
    icon: "📉",
  },
  adr_compset_change: {
    title: "Changement ADR compset",
    desc: "Alerte si l'ADR moyen du compset varie de X% sur Y jours",
    icon: "💰",
  },
  occupancy_drop: {
    title: "Chute d'occupation",
    desc: "Alerte si le taux d'occupation 7 jours tombe sous X%",
    icon: "🛏",
  },
  revpar_delta: {
    title: "Dérive RevPAR baseline",
    desc: "Alerte si le RevPAR s'écarte de la baseline historique de plus de X%",
    icon: "📊",
  },
  gop_margin_below: {
    title: "GOP margin sous benchmark",
    desc: "Alerte si la GOP margin mensuelle passe sous le benchmark catégorie",
    icon: "⚠️",
  },
};

export default function YieldAlertsPage() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user || !supabase) return;
    const { data: hs } = await supabase.from("hotels").select("id, name, nb_chambres, category").eq("created_by", user.id);
    setHotels((hs ?? []) as HotelRow[]);
    if (!selectedHotel && hs && hs.length > 0) setSelectedHotel((hs[0] as HotelRow).id);
    const { data: al } = await supabase.from("hotel_yield_alerts").select("*").eq("user_id", user.id);
    setAlerts((al ?? []) as AlertRow[]);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (type: AlertRow["alert_type"]) => {
    if (!supabase || !user || !selectedHotel) return;
    const defaults: Record<AlertRow["alert_type"], { threshold_pct: number; threshold_days: number }> = {
      pickup_deviation: { threshold_pct: 20, threshold_days: 30 },
      adr_compset_change: { threshold_pct: 10, threshold_days: 7 },
      occupancy_drop: { threshold_pct: 50, threshold_days: 7 },
      revpar_delta: { threshold_pct: 15, threshold_days: 14 },
      gop_margin_below: { threshold_pct: 25, threshold_days: 30 },
    };
    const d = defaults[type];
    await supabase.from("hotel_yield_alerts").insert({
      hotel_id: selectedHotel,
      user_id: user.id,
      alert_type: type,
      threshold_pct: d.threshold_pct,
      threshold_days: d.threshold_days,
      is_active: true,
      notify_email: true,
      notify_push: false,
    });
    await refresh();
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    if (!supabase) return;
    await supabase.from("hotel_yield_alerts").update({ is_active: !isActive }).eq("id", id);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm("Supprimer cette alerte ?")) return;
    await supabase.from("hotel_yield_alerts").delete().eq("id", id);
    await refresh();
  };

  const handleThresholdChange = async (id: string, pct: number) => {
    if (!supabase) return;
    await supabase.from("hotel_yield_alerts").update({ threshold_pct: pct }).eq("id", id);
    await refresh();
  };

  if (!user) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Connectez-vous pour gérer les alertes.</div>;
  if (loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;

  const hotelAlerts = alerts.filter((a) => a.hotel_id === selectedHotel);
  const availableTypes = (Object.keys(ALERT_TYPE_LABELS) as AlertRow["alert_type"][])
    .filter((t) => !hotelAlerts.some((a) => a.alert_type === t));

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">&larr; Hôtellerie</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Yield alerts « agentic »</h1>
          <p className="mt-2 text-muted">
            Alertes automatiques quand votre pickup, ADR, occupation ou GOP margin dévie de la norme.
            Fait partie de l&apos;évolution RMS 2026 : l&apos;IA ne recommande plus, elle <strong>agit</strong>.
          </p>
        </div>

        {hotels.length === 0 ? (
          <div className="rounded-xl border border-dashed border-card-border p-8 text-center text-sm text-muted">
            Aucun hôtel enregistré. Créez-en un d&apos;abord depuis{" "}
            <Link href="/hotellerie/groupe" className="text-navy underline">/hotellerie/groupe</Link>.
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate mb-1">Hôtel</label>
              <select value={selectedHotel} onChange={(e) => setSelectedHotel(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name} {h.nb_chambres ? `(${h.nb_chambres} ch.)` : ""}</option>
                ))}
              </select>
            </div>

            {/* Alertes configurées */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-navy mb-4">Alertes actives ({hotelAlerts.length})</h2>
              {hotelAlerts.length === 0 ? (
                <p className="text-sm text-muted">Aucune alerte configurée pour cet hôtel.</p>
              ) : (
                <div className="space-y-3">
                  {hotelAlerts.map((a) => {
                    const meta = ALERT_TYPE_LABELS[a.alert_type];
                    return (
                      <div key={a.id} className={`rounded-lg border p-4 ${a.is_active ? "border-emerald-200 bg-emerald-50/40" : "border-card-border bg-background opacity-60"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{meta.icon}</span>
                              <span className="text-sm font-semibold text-navy">{meta.title}</span>
                            </div>
                            <p className="text-xs text-muted mt-0.5">{meta.desc}</p>
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <label>Seuil %</label>
                              <input type="number" value={a.threshold_pct}
                                onChange={(e) => handleThresholdChange(a.id, Number(e.target.value))}
                                className="w-20 rounded border border-card-border bg-white px-2 py-0.5 text-xs font-mono" />
                              <span className="text-muted">sur {a.threshold_days} jours</span>
                              {a.trigger_count > 0 && (
                                <span className="ml-auto text-[10px] rounded-full bg-rose-100 text-rose-800 px-2 py-0.5">
                                  {a.trigger_count} déclenchement{a.trigger_count > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <button onClick={() => handleToggle(a.id, a.is_active)}
                              className={`rounded-full px-3 py-1 text-xs font-medium ${a.is_active ? "bg-emerald-600 text-white" : "border border-card-border bg-white text-slate"}`}>
                              {a.is_active ? "Active" : "Inactive"}
                            </button>
                            <button onClick={() => handleDelete(a.id)}
                              className="text-xs text-muted hover:text-rose-600">
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Ajout */}
            {availableTypes.length > 0 && (
              <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-semibold text-navy mb-3">Ajouter une alerte</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {availableTypes.map((t) => {
                    const meta = ALERT_TYPE_LABELS[t];
                    return (
                      <button key={t} onClick={() => handleCreate(t)}
                        className="rounded-lg border border-card-border bg-background p-3 text-left hover:bg-slate-50 hover:border-navy/30">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{meta.icon}</span>
                          <span className="text-sm font-semibold text-navy">{meta.title}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted">{meta.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-xs text-blue-900">
              <strong>Backend cron :</strong> les alertes sont évaluées quotidiennement à 07:00 UTC via Supabase cron (pg_cron).
              L&apos;email de notification utilise Supabase Auth SMTP (configurable). La transition vers les notifications push nécessite
              un worker web push (VAPID keys à configurer côté ops).
            </div>
          </>
        )}
      </div>
    </div>
  );
}
