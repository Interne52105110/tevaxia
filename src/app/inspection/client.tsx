"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";

// ============================================================
// TEGOVA EVS 2025 — Checklist d'inspection terrain
// ============================================================
// Section → items avec statut OK/NC/NA, notes et horodatage.
// Sauvegardé en localStorage pour usage offline.

interface CheckItem {
  id: string;
  label: string;
}

interface CheckSection {
  id: string;
  title: string;
  items: CheckItem[];
}

const CHECKLIST: CheckSection[] = [
  {
    id: "identification",
    title: "1. Identification du bien",
    items: [
      { id: "adresse", label: "Adresse complète vérifiée" },
      { id: "cadastre", label: "Référence cadastrale relevée" },
      { id: "acces", label: "Accès au bien confirmé" },
      { id: "proprietaire", label: "Identité du propriétaire/contact" },
      { id: "type_bien", label: "Type de bien (appartement, maison, terrain, commercial)" },
    ],
  },
  {
    id: "environnement",
    title: "2. Environnement & localisation",
    items: [
      { id: "quartier", label: "Caractéristiques du quartier" },
      { id: "transports", label: "Desserte transports en commun (bus, tram, gare)" },
      { id: "commerces", label: "Proximité commerces et services" },
      { id: "nuisances", label: "Nuisances identifiées (bruit, olfactives, visuelles)" },
      { id: "zone_inondable", label: "Zone inondable / risques naturels" },
      { id: "plu_pad", label: "PAG/PAP — classement urbanistique" },
    ],
  },
  {
    id: "exterieur",
    title: "3. État extérieur",
    items: [
      { id: "facade", label: "État de la façade (fissures, enduit, ravalement)" },
      { id: "toiture", label: "État de la toiture visible" },
      { id: "menuiseries_ext", label: "Menuiseries extérieures (fenêtres, volets)" },
      { id: "parties_communes", label: "Parties communes (hall, escalier, ascenseur)" },
      { id: "parking", label: "Stationnement (type, nombre de places)" },
      { id: "espaces_verts", label: "Espaces verts / terrasse / balcon" },
    ],
  },
  {
    id: "interieur",
    title: "4. État intérieur",
    items: [
      { id: "surface", label: "Surface habitable mesurée / vérifiée" },
      { id: "distribution", label: "Distribution des pièces (cohérence, luminosité)" },
      { id: "sols", label: "État des sols" },
      { id: "murs", label: "État des murs et plafonds (fissures, humidité)" },
      { id: "menuiseries_int", label: "Menuiseries intérieures (portes, placard)" },
      { id: "sdb_cuisine", label: "Salle de bain et cuisine (équipements, état)" },
      { id: "electricite", label: "Installation électrique (tableau, conformité)" },
      { id: "plomberie", label: "Plomberie (état visible, fuites)" },
      { id: "chauffage", label: "Système de chauffage (type, état, entretien)" },
      { id: "ventilation", label: "Ventilation (VMC, naturelle)" },
    ],
  },
  {
    id: "energetique",
    title: "5. Performance énergétique",
    items: [
      { id: "cpe", label: "CPE (Certificat de Performance Énergétique) disponible" },
      { id: "classe_energie", label: "Classe énergie relevée (A-I)" },
      { id: "classe_isolation", label: "Classe isolation thermique relevée" },
      { id: "type_vitrage", label: "Type de vitrage (simple, double, triple)" },
      { id: "isolation", label: "Isolation identifiable (murs, toiture, sol)" },
      { id: "panneaux", label: "Panneaux solaires / pompe à chaleur" },
    ],
  },
  {
    id: "juridique",
    title: "6. Aspects juridiques & documents",
    items: [
      { id: "titre_propriete", label: "Titre de propriété vérifié" },
      { id: "servitudes", label: "Servitudes éventuelles identifiées" },
      { id: "reglement_copro", label: "Règlement de copropriété (si applicable)" },
      { id: "charges_copro", label: "Charges de copropriété annuelles" },
      { id: "travaux_votes", label: "Travaux votés en AG (en cours / prévus)" },
      { id: "bail_en_cours", label: "Bail en cours (type, durée, loyer)" },
    ],
  },
  {
    id: "photos",
    title: "7. Relevé photographique",
    items: [
      { id: "photo_facade", label: "Photo façade principale" },
      { id: "photo_rue", label: "Photo vue de la rue / environnement" },
      { id: "photo_sejour", label: "Photo pièce principale (séjour)" },
      { id: "photo_cuisine", label: "Photo cuisine" },
      { id: "photo_sdb", label: "Photo salle de bain" },
      { id: "photo_chambres", label: "Photos chambres" },
      { id: "photo_exterieur", label: "Photo espaces extérieurs" },
      { id: "photo_defauts", label: "Photos des défauts / anomalies identifiés" },
    ],
  },
];

type ItemStatus = "pending" | "ok" | "nc" | "na";

interface InspectionData {
  id: string;
  address: string;
  inspector: string;
  date: string;
  startTime: string;
  endTime: string;
  items: Record<string, { status: ItemStatus; note: string }>;
  generalNotes: string;
}

const STORAGE_KEY = "tevaxia_inspection_draft";

function loadDraft(): InspectionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(data: InspectionData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function generateId(): string {
  return `INS-${Date.now().toString(36).toUpperCase()}`;
}

function emptyInspection(): InspectionData {
  const items: Record<string, { status: ItemStatus; note: string }> = {};
  for (const section of CHECKLIST) {
    for (const item of section.items) {
      items[item.id] = { status: "pending", note: "" };
    }
  }
  return {
    id: generateId(),
    address: "",
    inspector: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: new Date().toTimeString().slice(0, 5),
    endTime: "",
    items,
    generalNotes: "",
  };
}

export function InspectionClient() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [data, setData] = useState<InspectionData>(emptyInspection);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft) setData(draft);
    setLoaded(true);
  }, []);

  const update = useCallback((patch: Partial<InspectionData>) => {
    setData((prev) => {
      const next = { ...prev, ...patch };
      saveDraft(next);
      return next;
    });
  }, []);

  const setItemStatus = useCallback((itemId: string, status: ItemStatus) => {
    setData((prev) => {
      const next = {
        ...prev,
        items: { ...prev.items, [itemId]: { ...prev.items[itemId], status } },
      };
      saveDraft(next);
      return next;
    });
  }, []);

  const setItemNote = useCallback((itemId: string, note: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        items: { ...prev.items, [itemId]: { ...prev.items[itemId], note } },
      };
      saveDraft(next);
      return next;
    });
  }, []);

  const handleReset = () => {
    if (!confirm("Effacer l'inspection en cours et recommencer ?")) return;
    const fresh = emptyInspection();
    setData(fresh);
    saveDraft(fresh);
  };

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inspection-${data.id}-${data.date}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    let text = `RAPPORT D'INSPECTION TERRAIN — TEGOVA EVS 2025\n`;
    text += `${"=".repeat(60)}\n\n`;
    text += `Référence : ${data.id}\n`;
    text += `Adresse : ${data.address || "—"}\n`;
    text += `Inspecteur : ${data.inspector || "—"}\n`;
    text += `Date : ${data.date} · ${data.startTime || "—"} → ${data.endTime || "—"}\n\n`;

    for (const section of CHECKLIST) {
      text += `\n${section.title}\n${"-".repeat(50)}\n`;
      for (const item of section.items) {
        const d = data.items[item.id];
        const statusLabel = d?.status === "ok" ? "✓ OK" : d?.status === "nc" ? "✗ NC" : d?.status === "na" ? "— N/A" : "? En attente";
        text += `  [${statusLabel}] ${item.label}`;
        if (d?.note) text += ` · Note: ${d.note}`;
        text += "\n";
      }
    }

    if (data.generalNotes) {
      text += `\nNOTES GÉNÉRALES\n${"-".repeat(50)}\n${data.generalNotes}\n`;
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inspection-${data.id}-${data.date}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!loaded) return null;

  const allItems = CHECKLIST.flatMap((s) => s.items);
  const completed = allItems.filter((i) => data.items[i.id]?.status !== "pending").length;
  const okCount = allItems.filter((i) => data.items[i.id]?.status === "ok").length;
  const ncCount = allItems.filter((i) => data.items[i.id]?.status === "nc").length;
  const progressPct = allItems.length > 0 ? (completed / allItems.length) * 100 : 0;

  return (
    <div className="bg-background min-h-screen py-6 sm:py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link href={`${lp}/`} className="text-xs text-muted hover:text-navy">← tevaxia.lu</Link>
        <h1 className="mt-2 text-xl font-bold text-navy sm:text-2xl">Inspection terrain TEGOVA</h1>
        <p className="mt-1 text-xs text-muted">
          Checklist conforme EVS 2025. Sauvegarde locale automatique — fonctionne hors connexion.
        </p>

        {/* Header info */}
        <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">Adresse du bien</label>
              <input type="text" value={data.address} onChange={(e) => update({ address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                placeholder="12 rue de la Gare, Luxembourg" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">Inspecteur</label>
              <input type="text" value={data.inspector} onChange={(e) => update({ inspector: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                placeholder="Nom de l'évaluateur" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">Date</label>
              <input type="date" value={data.date} onChange={(e) => update({ date: e.target.value })}
                className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">Heure début</label>
                <input type="time" value={data.startTime} onChange={(e) => update({ startTime: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-muted font-semibold">Heure fin</label>
                <input type="time" value={data.endTime} onChange={(e) => update({ endTime: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted">Réf. : {data.id}</div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Progression : {completed}/{allItems.length} points</span>
            <span className="font-medium text-navy">{progressPct.toFixed(0)} %</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-2 flex gap-3 text-[10px]">
            <span className="text-emerald-700">{okCount} OK</span>
            <span className="text-rose-700">{ncCount} Non conforme</span>
            <span className="text-muted">{allItems.length - completed} en attente</span>
          </div>
        </div>

        {/* Checklist sections */}
        {CHECKLIST.map((section) => (
          <div key={section.id} className="mt-4 rounded-xl border border-card-border bg-card">
            <div className="border-b border-card-border bg-background px-4 py-2">
              <h2 className="text-sm font-semibold text-navy">{section.title}</h2>
            </div>
            <div className="divide-y divide-card-border/50">
              {section.items.map((item) => {
                const d = data.items[item.id] ?? { status: "pending", note: "" };
                return (
                  <div key={item.id} className={`px-4 py-3 ${d.status === "nc" ? "bg-rose-50/40" : d.status === "ok" ? "bg-emerald-50/20" : ""}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-navy">{item.label}</span>
                      <div className="flex gap-1">
                        {(["ok", "nc", "na"] as ItemStatus[]).map((s) => (
                          <button key={s} onClick={() => setItemStatus(item.id, d.status === s ? "pending" : s)}
                            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                              d.status === s
                                ? s === "ok" ? "bg-emerald-600 text-white" : s === "nc" ? "bg-rose-600 text-white" : "bg-slate-500 text-white"
                                : "border border-card-border text-muted hover:bg-slate-50"
                            }`}>
                            {s === "ok" ? "OK" : s === "nc" ? "NC" : "N/A"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input type="text" value={d.note}
                      onChange={(e) => setItemNote(item.id, e.target.value)}
                      placeholder="Note..."
                      className="mt-1.5 w-full rounded border border-card-border/50 bg-transparent px-2 py-1 text-[11px] text-muted placeholder:text-slate-300 focus:border-navy focus:outline-none" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* General notes */}
        <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
          <label className="text-sm font-semibold text-navy">Notes générales</label>
          <textarea value={data.generalNotes} onChange={(e) => update({ generalNotes: e.target.value })}
            className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
            rows={4} placeholder="Observations complémentaires, points d'attention..." />
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={handleExportText}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            Exporter rapport (TXT)
          </button>
          <button onClick={handleExport}
            className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium text-navy hover:bg-slate-50">
            Exporter données (JSON)
          </button>
          <button onClick={handleReset}
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100">
            Nouvelle inspection
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Usage hors connexion :</strong> cette page sauvegarde automatiquement dans le stockage local
          de votre navigateur. Vous pouvez remplir la checklist sur le terrain sans connexion internet.
          Exportez le rapport avant d&apos;effacer les données. Compatible mobile (responsive).
        </div>
      </div>
    </div>
  );
}
