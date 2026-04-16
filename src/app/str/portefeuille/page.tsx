"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { formatEUR, formatPct } from "@/lib/calculations";
import AiAnalysisCard from "@/components/AiAnalysisCard";

interface StrProperty {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  commune: string | null;
  surface: number;
  capacity: number;
  property_type: "apartment" | "house" | "room" | "studio" | "villa";
  avg_adr: number;
  avg_occupancy_pct: number;
  annual_revenue: number | null;
  annual_costs: number | null;
  eu_registry_number: string | null;
  license_status: "not_required" | "pending" | "obtained" | "expired";
  primary_ota: string | null;
  notes: string | null;
}

const PROPERTY_TYPE_LABELS: Record<StrProperty["property_type"], string> = {
  apartment: "Appartement",
  house: "Maison",
  room: "Chambre",
  studio: "Studio",
  villa: "Villa",
};

const LICENSE_COLORS: Record<StrProperty["license_status"], string> = {
  not_required: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  obtained: "bg-emerald-100 text-emerald-800",
  expired: "bg-rose-100 text-rose-800",
};

const LICENSE_LABELS: Record<StrProperty["license_status"], string> = {
  not_required: "Non requise (< 90j)",
  pending: "En cours",
  obtained: "Obtenue",
  expired: "Expirée",
};

export default function StrPortefeuillePage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<StrProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newProp, setNewProp] = useState<Partial<StrProperty>>({
    name: "", commune: "Luxembourg", surface: 50, capacity: 2,
    property_type: "apartment", avg_adr: 100, avg_occupancy_pct: 60,
    license_status: "not_required", primary_ota: "Airbnb",
  });

  const refresh = async () => {
    if (!user || !supabase) return;
    const { data } = await supabase.from("str_properties").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setProperties((data ?? []) as StrProperty[]);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!user || !supabase || !newProp.name) return;
    const adr = newProp.avg_adr ?? 0;
    const occ = (newProp.avg_occupancy_pct ?? 0) / 100;
    const estimatedRevenue = Math.round(adr * 365 * occ);
    await supabase.from("str_properties").insert({
      ...newProp,
      user_id: user.id,
      annual_revenue: estimatedRevenue,
    });
    setShowNew(false);
    setNewProp({ name: "", commune: "Luxembourg", surface: 50, capacity: 2, property_type: "apartment", avg_adr: 100, avg_occupancy_pct: 60, license_status: "not_required", primary_ota: "Airbnb" });
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm("Supprimer ce bien du portefeuille ?")) return;
    await supabase.from("str_properties").delete().eq("id", id);
    await refresh();
  };

  const stats = useMemo(() => {
    const total = properties.reduce((s, p) => s + (p.annual_revenue ?? 0), 0);
    const avgAdr = properties.length > 0 ? properties.reduce((s, p) => s + p.avg_adr, 0) / properties.length : 0;
    const avgOcc = properties.length > 0 ? properties.reduce((s, p) => s + p.avg_occupancy_pct, 0) / properties.length / 100 : 0;
    const licensesPending = properties.filter((p) => p.license_status === "pending").length;
    const licensesObtained = properties.filter((p) => p.license_status === "obtained").length;
    const euRegistered = properties.filter((p) => p.eu_registry_number).length;
    return { total, avgAdr, avgOcc, licensesPending, licensesObtained, euRegistered };
  }, [properties]);

  if (!user) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Connectez-vous pour gérer votre portefeuille STR.</div>;
  if (loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/str" className="text-xs text-muted hover:text-navy">&larr; Location courte durée</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Portefeuille STR</h1>
          <p className="mt-2 text-muted">
            Dashboard multi-biens pour conciergerie ou investisseur courte durée (10-50 biens).
            Suivi ADR/occupation/revenu agrégé, statut licence LU (seuil 90j), enregistrement EU 2024/1028.
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">Nb biens</div>
            <div className="mt-1 text-2xl font-bold text-navy">{properties.length}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">Revenu annuel estimé</div>
            <div className="mt-1 text-2xl font-bold text-emerald-700">{formatEUR(stats.total)}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">ADR moyen</div>
            <div className="mt-1 text-2xl font-bold text-navy">{stats.avgAdr.toFixed(0)} €</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">Occupation moyenne</div>
            <div className="mt-1 text-2xl font-bold text-navy">{formatPct(stats.avgOcc)}</div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted">
            Licences : {stats.licensesObtained} obtenues · {stats.licensesPending} en cours · {stats.euRegistered}/{properties.length} enregistrées EU
          </div>
          <button onClick={() => setShowNew(!showNew)}
            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
            {showNew ? "Annuler" : "+ Ajouter un bien"}
          </button>
        </div>

        {showNew && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <input type="text" placeholder="Nom" value={newProp.name} onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <input type="text" placeholder="Commune" value={newProp.commune ?? ""} onChange={(e) => setNewProp({ ...newProp, commune: e.target.value })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <select value={newProp.property_type} onChange={(e) => setNewProp({ ...newProp, property_type: e.target.value as StrProperty["property_type"] })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm">
                {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="number" placeholder="Surface m²" value={newProp.surface || ""}
                onChange={(e) => setNewProp({ ...newProp, surface: Number(e.target.value) })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <input type="number" placeholder="Capacité pax" value={newProp.capacity || ""}
                onChange={(e) => setNewProp({ ...newProp, capacity: Number(e.target.value) })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <input type="number" placeholder="ADR €" value={newProp.avg_adr || ""}
                onChange={(e) => setNewProp({ ...newProp, avg_adr: Number(e.target.value) })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <input type="number" placeholder="Occupation %" value={newProp.avg_occupancy_pct || ""}
                onChange={(e) => setNewProp({ ...newProp, avg_occupancy_pct: Number(e.target.value) })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <select value={newProp.license_status} onChange={(e) => setNewProp({ ...newProp, license_status: e.target.value as StrProperty["license_status"] })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm">
                {Object.entries(LICENSE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="text" placeholder="OTA principal" value={newProp.primary_ota ?? ""} onChange={(e) => setNewProp({ ...newProp, primary_ota: e.target.value })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
            </div>
            <button onClick={handleAdd} disabled={!newProp.name}
              className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40">
              Ajouter au portefeuille
            </button>
          </div>
        )}

        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left">
                <th className="px-4 py-2 text-xs font-semibold text-slate">Nom</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">Type</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">Commune</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Surface</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">ADR</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Occ.</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Revenu an</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">Licence</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted">Aucun bien. Ajoutez-en pour démarrer.</td></tr>
              ) : properties.map((p) => (
                <tr key={p.id} className="border-b border-card-border/50 hover:bg-background">
                  <td className="px-4 py-2 font-medium text-navy">{p.name}</td>
                  <td className="px-4 py-2 text-xs">{PROPERTY_TYPE_LABELS[p.property_type]}</td>
                  <td className="px-4 py-2 text-xs">{p.commune}</td>
                  <td className="px-4 py-2 text-right font-mono">{p.surface} m²</td>
                  <td className="px-4 py-2 text-right font-mono">{p.avg_adr} €</td>
                  <td className="px-4 py-2 text-right font-mono">{p.avg_occupancy_pct}%</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold">{formatEUR(p.annual_revenue ?? 0)}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${LICENSE_COLORS[p.license_status]}`}>
                      {LICENSE_LABELS[p.license_status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => handleDelete(p.id)}
                      className="text-muted hover:text-rose-600 text-xs">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {properties.length > 0 && (
          <div className="mt-6">
            <AiAnalysisCard
              context={[
                `Portefeuille STR ${properties.length} biens au Luxembourg`,
                `Revenu annuel total estimé: ${formatEUR(stats.total)}`,
                `ADR moyen: ${stats.avgAdr.toFixed(0)}€ · Occupation moyenne: ${formatPct(stats.avgOcc)}`,
                `Licences obtenues: ${stats.licensesObtained}/${properties.length}`,
                `Enregistrement EU 2024/1028: ${stats.euRegistered}/${properties.length}`,
                "",
                `Détail: ${properties.slice(0, 10).map((p) => `${p.name} (${p.commune}, ${p.surface}m², ADR ${p.avg_adr}€, occ ${p.avg_occupancy_pct}%)`).join(" / ")}`,
              ].join("\n")}
              prompt="Analyse ce portefeuille STR (conciergerie Airbnb/Booking) au Luxembourg. Livre : (1) diagnostic performance globale vs benchmark LU (ADR moyen quartiers, occupation cible selon typologie), (2) compliance réglementaire — combien de biens dépassent 90j donc nécessitent licence, combien sont au registre EU 2024/1028, (3) risques de concentration géographique (si trop dans Luxembourg-Ville), de saisonnalité (mix ville/tourisme nord), de typologie (studios vs maisons), (4) recommandations scaling : nouveaux biens où ? diversification ? automatisation via PMS type Hostaway/Guesty ? passage en société SOPARFI ?, (5) indicateur SaaS à suivre pour une conciergerie professionnelle : NPS, turnover guests, review score moyen, coût par booking, LTV host. Concret pour un opérateur pro LU."
            />
          </div>
        )}
      </div>
    </div>
  );
}
