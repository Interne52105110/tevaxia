"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { pdf } from "@react-pdf/renderer";

import RentalInspectionPdf from "@/components/RentalInspectionPdf";
import { inspectionProgress, validInspectionMeta, type RoomItem, type RoomSection } from "@/lib/rental-inspection";

export default function EtatDesLieuxPage() {
  const t = useTranslations("glEdl");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const exporting = useRef(false);
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);

  const DEFAULT_SECTIONS: RoomSection[] = [
    { id: "general", name: t("sectionGeneral"), items: [
      { id: "cles", label: t("itemCles"), state: "", notes: "" },
      { id: "boite_aux_lettres", label: t("itemBoite"), state: "", notes: "" },
      { id: "interphone", label: t("itemInterphone"), state: "", notes: "" },
    ]},
    { id: "sejour", name: t("sectionSejour"), items: [
      { id: "sol", label: t("itemSol"), state: "", notes: "" },
      { id: "murs", label: t("itemMurs"), state: "", notes: "" },
      { id: "plafond", label: t("itemPlafond"), state: "", notes: "" },
      { id: "fenetres", label: t("itemFenetres"), state: "", notes: "" },
      { id: "volets", label: t("itemVolets"), state: "", notes: "" },
      { id: "prises", label: t("itemPrises"), state: "", notes: "" },
      { id: "luminaires", label: t("itemLuminaires"), state: "", notes: "" },
    ]},
    { id: "cuisine", name: t("sectionCuisine"), items: [
      { id: "meubles", label: t("itemMeubles"), state: "", notes: "" },
      { id: "plan_travail", label: t("itemPlanTravail"), state: "", notes: "" },
      { id: "evier", label: t("itemEvier"), state: "", notes: "" },
      { id: "hotte", label: t("itemHotte"), state: "", notes: "" },
      { id: "plaques", label: t("itemPlaques"), state: "", notes: "" },
      { id: "four", label: t("itemFour"), state: "", notes: "" },
      { id: "frigo", label: t("itemFrigo"), state: "", notes: "" },
      { id: "lave_vaisselle", label: t("itemLaveVaisselle"), state: "", notes: "" },
    ]},
    { id: "chambre1", name: t("sectionChambre1"), items: [
      { id: "sol", label: t("itemSol"), state: "", notes: "" },
      { id: "murs", label: t("itemMurs"), state: "", notes: "" },
      { id: "placards", label: t("itemPlacards"), state: "", notes: "" },
      { id: "fenetres", label: t("itemFenetresVolets"), state: "", notes: "" },
    ]},
    { id: "sdb", name: t("sectionSdb"), items: [
      { id: "sol", label: t("itemSol"), state: "", notes: "" },
      { id: "faience", label: t("itemFaience"), state: "", notes: "" },
      { id: "lavabo", label: t("itemLavabo"), state: "", notes: "" },
      { id: "douche", label: t("itemDouche"), state: "", notes: "" },
      { id: "wc", label: t("itemWc"), state: "", notes: "" },
      { id: "seche_serviette", label: t("itemSecheServiette"), state: "", notes: "" },
      { id: "vmc", label: t("itemVmc"), state: "", notes: "" },
    ]},
    { id: "chauffage", name: t("sectionChauffage"), items: [
      { id: "chaudiere", label: t("itemChaudiere"), state: "", notes: "" },
      { id: "radiateurs", label: t("itemRadiateurs"), state: "", notes: "" },
      { id: "compteur_elec", label: t("itemCompteurElec"), state: "", notes: "" },
      { id: "compteur_gaz", label: t("itemCompteurGaz"), state: "", notes: "" },
      { id: "compteur_eau", label: t("itemCompteurEau"), state: "", notes: "" },
    ]},
    { id: "exterieur", name: t("sectionExterieur"), items: [
      { id: "balcon", label: t("itemBalcon"), state: "", notes: "" },
      { id: "cave", label: t("itemCave"), state: "", notes: "" },
      { id: "parking", label: t("itemParking"), state: "", notes: "" },
    ]},
  ];

  const STATE_LABELS: Record<RoomItem["state"], { label: string; color: string }> = {
    "": { label: t("stateEmpty"), color: "bg-gray-100 text-gray-500" },
    neuf: { label: t("stateNeuf"), color: "bg-emerald-100 text-emerald-800" },
    bon: { label: t("stateBon"), color: "bg-green-100 text-green-700" },
    usage: { label: t("stateUsage"), color: "bg-amber-100 text-amber-800" },
    non_applicable: { label: t("stateNotApplicable"), color: "bg-slate-100 text-slate-700" },
    a_remplacer: { label: t("stateARemplacer"), color: "bg-rose-100 text-rose-800" },
  };

  const [sections, setSections] = useState<RoomSection[]>(DEFAULT_SECTIONS);
  const [lotName, setLotName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState<"entree" | "sortie">("entree");
  const [date, setDate] = useState("");
  const [bailleur, setBailleur] = useState("");
  const [locataire, setLocataire] = useState("");
  const [notesGeneral, setNotesGeneral] = useState("");
  const [keysCount, setKeysCount] = useState("");
  const [waterMeter, setWaterMeter] = useState("");
  const [elecMeter, setElecMeter] = useState("");
  const [gasMeter, setGasMeter] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(DEFAULT_SECTIONS[0].id);

  const activeSection = useMemo(() => sections.find((s) => s.id === activeSectionId), [sections, activeSectionId]);

  const setItem = (sectionId: string, itemId: string, patch: Partial<RoomItem>) => {
    setSections((prev) => prev.map((s) =>
      s.id !== sectionId ? s : { ...s, items: s.items.map((it) => it.id !== itemId ? it : { ...it, ...patch }) },
    ));
  };

  const progress = inspectionProgress(sections);

  const handleExportPDF = async () => {
    if (exporting.current) return;
    const meta = { lotName, address, type, date, bailleur, locataire };
    if (!validInspectionMeta(meta, keysCount)) { setError(t("invalidExport")); return; }
    exporting.current = true; setBusy(true); setError("");
    try {
      const stateLabels = Object.fromEntries(Object.entries(STATE_LABELS).map(([key, value]) => [key, value.label])) as Record<RoomItem["state"], string>;
      const labels = {
        title: type === "entree" ? t("pdfTitleEntree") : t("pdfTitleSortie"),
        landlord: t("pdfBailleur", { name: bailleur }), tenant: t("pdfLocataire", { name: locataire }),
        keysMeters: t("pdfKeysMeters", { keys: keysCount || t("notRecorded"), water: waterMeter.trim() || t("notRecorded"), elec: elecMeter.trim() || t("notRecorded"), gas: gasMeter.trim() || t("notRecorded") }),
        obsGeneral: t("pdfObsGeneral"), signLandlord: t("pdfSignLandlord"), signTenant: t("pdfSignTenant"), footer: t("pdfFooter"),
        draft: t("draftNotice"), progress: t("progressDone", { done: progress.done, total: progress.total }), scope: t("checklistScope"),
      };
      const blob = await pdf(<RentalInspectionPdf meta={meta} locale={locale} sections={sections} notesGeneral={notesGeneral} stateLabels={stateLabels} labels={labels} />).toBlob();
      if (!live.current) return;
      const url = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = url;
        const safe = (value: string) => value.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 80);
        a.download = `etat-des-lieux-${type}-${safe(lotName || "bien")}-${date}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
      } finally { setTimeout(() => URL.revokeObjectURL(url), 60_000); }
    } catch { if (live.current) setError(t("exportFailed")); }
    finally { exporting.current = false; if (live.current) setBusy(false); }
  };

  return (
    <div className="bg-background min-h-screen py-6 sm:py-10 [overflow-wrap:anywhere]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link href={`${locale === "fr" ? "" : "/" + locale}/gestion-locative`} className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("pageSubtitle")}</p>
        </div>

        <p className="mb-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{t("sessionNotice")}</p>
        <fieldset disabled={busy} className="min-w-0">
        <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("typeLabel")}</label>
              <div className="flex rounded-lg border border-input-border overflow-hidden">
                {(["entree", "sortie"] as const).map((opt) => (
                  <button key={opt} aria-pressed={type === opt} onClick={() => setType(opt)}
                    className={`flex-1 py-2 text-sm font-medium ${type === opt ? "bg-navy text-white" : "bg-background text-muted hover:bg-slate-50"}`}>
                    {opt === "entree" ? t("typeEntree") : t("typeSortie")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("dateLabel")}</label>
              <input type="date" aria-label={t("dateLabel")} value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("nameLabel")}</label>
              <input type="text" aria-label={t("nameLabel")} maxLength={300} value={lotName} onChange={(e) => setLotName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("addressLabel")}</label>
              <input type="text" aria-label={t("addressLabel")} maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("landlordLabel")}</label>
              <input type="text" aria-label={t("landlordLabel")} maxLength={300} value={bailleur} onChange={(e) => setBailleur(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("tenantLabel")}</label>
              <input type="text" aria-label={t("tenantLabel")} maxLength={300} value={locataire} onChange={(e) => setLocataire(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy mb-3">{t("metersTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("nbKeysLabel")}</label>
              <input type="number" min="0" max="999" step="1" aria-label={t("nbKeysLabel")} value={keysCount} onChange={(e) => setKeysCount(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("waterLabel")}</label>
              <input type="text" aria-label={t("waterLabel")} maxLength={100} value={waterMeter} onChange={(e) => setWaterMeter(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("elecLabel")}</label>
              <input type="text" aria-label={t("elecLabel")} maxLength={100} value={elecMeter} onChange={(e) => setElecMeter(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1">{t("gasLabel")}</label>
              <input type="text" aria-label={t("gasLabel")} maxLength={100} value={gasMeter} onChange={(e) => setGasMeter(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-card-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">{t("progressDone", { done: progress.done, total: progress.total })}</span>
            <span className="font-medium text-navy">{progress.pct}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {sections.map((s) => {
            const filled = s.items.filter((it) => it.state).length;
            const total = s.items.length;
            return (
              <button key={s.id} onClick={() => setActiveSectionId(s.id)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap ${
                  activeSectionId === s.id ? "border-navy bg-navy text-white" : "border-card-border bg-card text-slate hover:bg-slate-50"
                }`}>
                {s.name} <span className="ml-1 opacity-70">{filled}/{total}</span>
              </button>
            );
          })}
        </div>

        {activeSection && (
          <div className="mt-4 rounded-xl border border-card-border bg-card">
            <div className="border-b border-card-border bg-background px-4 py-2">
              <h2 className="text-sm font-semibold text-navy">{activeSection.name}</h2>
            </div>
            <div className="divide-y divide-card-border/50">
              {activeSection.items.map((item) => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-navy flex-1">{item.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATE_LABELS[item.state].color}`}>
                      {STATE_LABELS[item.state].label}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(["", "neuf", "bon", "usage", "a_remplacer", "non_applicable"] as const).map((s) => (
                      <button key={s} aria-pressed={item.state === s} onClick={() => setItem(activeSection.id, item.id, { state: s })}
                        className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                          item.state === s ? STATE_LABELS[s].color + " ring-2 ring-navy/20" : "border border-card-border bg-background text-muted"
                        }`}>
                        {STATE_LABELS[s].label}
                      </button>
                    ))}
                  </div>
                  <input type="text" aria-label={`${item.label} - ${t("generalNotesLabel")}`} maxLength={2000} value={item.notes}
                    onChange={(e) => setItem(activeSection.id, item.id, { notes: e.target.value })}
                    placeholder={t("notesPlaceholder")}
                    className="mt-2 w-full rounded border border-card-border bg-transparent px-2 py-1 text-xs" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <label className="block text-sm font-semibold text-navy mb-2">{t("generalNotesLabel")}</label>
          <textarea aria-label={t("generalNotesLabel")} maxLength={10000} value={notesGeneral} onChange={(e) => setNotesGeneral(e.target.value)}
            rows={4}
            placeholder={t("generalNotesPlaceholder")}
            className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
        </div>

        <p className="mt-4 text-sm text-muted">{t("checklistScope")}</p>
        <p className="mt-2 text-sm text-muted">{t("draftNotice")}</p>
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={handleExportPDF}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {busy ? t("exportBusy") : t("exportBtn")}
          </button>
        </div>

        </fieldset>
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p>{t("legalBody")}</p>
          <a className="mt-2 inline-block underline" href="https://guichet.public.lu/fr/citoyens/logement/location/contrat-litige/etat-lieux-bail-loyer.html" target="_blank" rel="noopener noreferrer">{t("officialSource")}</a>
        </div>
      </div>
    </div>
  );
}
