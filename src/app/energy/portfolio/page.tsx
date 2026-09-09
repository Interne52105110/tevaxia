"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PdfButton } from "@/components/PdfButton";
import { ENERGY_CLASSES as CLASSES, type EnergyProperty as Property, validEnergyProperty, readEnergyPortfolio, summarizeEnergyPortfolio, parseEnergyCsv as parseCsv, energyPortfolioCsv as propertiesToCsv } from "@/lib/energy-portfolio";
import { buildEnergyPortfolioReport, PORTFOLIO_SOURCES as SOURCES } from "@/lib/energy-portfolio-report";
import Link from "next/link";
type Classe = (typeof CLASSES)[number];


const CLASS_COLORS: Record<string, string> = {
  "A+": "bg-green-700 text-white", "?": "bg-gray-500 text-white",
  A: "bg-green-600 text-white",
  B: "bg-green-500 text-white",
  C: "bg-lime-500 text-white",
  D: "bg-yellow-400 text-gray-900",
  E: "bg-orange-400 text-white",
  F: "bg-orange-600 text-white",
  G: "bg-red-600 text-white",
  H: "bg-red-700 text-white",
  I: "bg-red-900 text-white",
};

const BAR_COLORS: Record<string, string> = {
  "A+": "bg-green-700", "?": "bg-gray-500",
  A: "bg-green-600",
  B: "bg-green-500",
  C: "bg-lime-500",
  D: "bg-yellow-400",
  E: "bg-orange-400",
  F: "bg-orange-600",
  G: "bg-red-600",
  H: "bg-red-700",
  I: "bg-red-900",
};

const TYPE_KEYS = ["apartment", "house", "commercial"] as const;
const TYPE_VALUES = ["Appartement", "Maison", "Commercial"] as const;

const STORAGE_KEY = "tevaxia_energy_portfolio";

const CSV_TEMPLATE_ROWS = propertiesToCsv([
 {nom:"12 rue de la Gare Bettembourg",classe:"D",surface:85,valeur:650000,type:"Appartement",annee:1990},
 {nom:"Villa Strassen",classe:"B",surface:200,valeur:1500000,type:"Maison",annee:2015},
]);
function classeIndex(c: string) { return CLASSES.indexOf(c as Classe); }
function generateId() { return crypto.randomUUID(); }
function downloadCsvFile(content: string, filename: string) {
  const json = filename.endsWith(".json");
  const blob = new Blob([json ? content : "\uFEFF" + content], { type: json ? "application/json" : "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Sort types                                                         */
/* ------------------------------------------------------------------ */

type SortKey = "nom" | "classe" | "surface" | "valeur";
type SortDir = "asc" | "desc";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PortfolioPage() {
  const t = useTranslations("energy.portfolio"), a = useTranslations("energyPortfolioAudit"), locale = useLocale();
  const numberLocale = locale === "lb" ? "de-DE" : locale;
  const fmt = (n: number) => new Intl.NumberFormat(numberLocale, {maximumFractionDigits:2}).format(n);
  const fmtDec = (n: number) => new Intl.NumberFormat(numberLocale, {maximumFractionDigits:1}).format(n);
  const [storageError, setStorageError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const rawSaved = useRef<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [nom, setNom] = useState("");
  const [classe, setClasse] = useState<string>("?");
  const [surface, setSurface] = useState<number | "">("");
  const [valeur, setValeur] = useState<number | "">("");
  const [type, setType] = useState<string>("Appartement");
  const [annee, setAnnee] = useState<number | "">(1990);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>("nom");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // CSV import state
  const [csvMessage, setCsvMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Type options with translated labels
  const TYPE_OPTIONS = TYPE_KEYS.map((key, i) => ({
    key,
    value: TYPE_VALUES[i],
    label: t(`type_${key}`),
  }));

  /* ---- localStorage persistence ---------------------------------- */

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      rawSaved.current = raw;
      if (raw) setProperties(readEnergyPortfolio(raw));
    } catch { setStorageError(true); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || storageError) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(properties)); }
    catch { setSaveError(true); }
  }, [properties, loaded, storageError]);

  /* ---- Add property ---------------------------------------------- */

  const formValid = validEnergyProperty({nom, classe, surface, valeur, type, annee});
  function handleAdd() {
    if (storageError || !formValid) return;
    const newProp: Property = {
      id: generateId(),
      nom: nom.trim(),
      classe,
      surface: Number(surface),
      valeur: Number(valeur),
      type,
      annee: Number(annee),
    };
    setProperties((prev) => [...prev, newProp]);
    // Reset form
    setNom("");
    setClasse("?");
    setSurface("");
    setValeur("");
    setType("Appartement");
    setAnnee(1990);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }

  /* ---- CSV import / export -------------------------------------- */

  const handleCsvImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvMessage(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const { properties: parsed, errors } = parseCsv(text);

        if (parsed.length === 0 && errors.length > 0) {
          setCsvMessage({ type: "error", text: t("csvErrorFormat") });
          return;
        }

        const withIds = parsed.map((p) => ({ ...p, id: generateId() }));
        setProperties((prev) => [...prev, ...withIds]);

        let msg = t("csvSuccess", { count: withIds.length });
        if (errors.length > 0) {
          msg += ` (${t("csvSkipped", { count: errors.length })})`;
        }
        setCsvMessage({ type: "success", text: msg });
      } catch {
        setCsvMessage({ type: "error", text: t("csvErrorFormat") });
      }
    };
    reader.onerror = () => {
      setCsvMessage({ type: "error", text: t("csvErrorRead") });
    };
    reader.readAsText(file);

    // Reset input so same file can be re-imported
    e.target.value = "";
  }, [t]);

  function handleCsvExport() {
    if (properties.length === 0) return;
    const csv = propertiesToCsv(properties);
    downloadCsvFile(csv, `portfolio-energy-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  function handleDownloadTemplate() {
    downloadCsvFile(CSV_TEMPLATE_ROWS, "modele-portfolio-energy.csv");
  }

  /* ---- Computed portfolio stats ---------------------------------- */

  const stats = useMemo(() => {
    return properties.length ? summarizeEnergyPortfolio(properties) : null;
  }, [properties]);

  /* ---- Sort logic for comparison table --------------------------- */

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sortedProperties = useMemo(() => {
    const arr = [...properties];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "nom": return a.nom.localeCompare(b.nom) * dir;
        case "classe": return (classeIndex(a.classe) - classeIndex(b.classe)) * dir;
        case "surface": return (a.surface - b.surface) * dir;
        case "valeur": return (a.valeur - b.valeur) * dir;
        default: return 0;
      }
    });
    return arr;
  }, [properties, sortKey, sortDir]);

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " \u25B2" : " \u25BC") : "";

  /* ---- Helper to get translated type label ----------------------- */

  function typeLabel(storedValue: string): string {
    const opt = TYPE_OPTIONS.find((o) => o.value === storedValue);
    return opt ? opt.label : storedValue;
  }

  const report = buildEnergyPortfolioReport(properties,t,a,locale);

  /* ---- Render ---------------------------------------------------- */

  if (!loaded) return null;

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {a("intro")}
          </p>
        </div>

        <section className="mb-6 space-y-3 rounded-xl border border-card-border bg-card p-5 text-sm text-muted">
          <h2 className="font-semibold text-foreground">{a("scopeTitle")}</h2><p>{a("scope")}</p><p>{a("method")}</p>
          <p>{a("regulation")}</p><Link href={(locale === "fr" ? "" : "/"+locale)+"/energy/epbd"} className="block text-energy underline">{a("epbdLink")}</Link>
          <Link href={(locale === "fr" ? "" : "/"+locale)+"/energy/impact"} className="block text-energy underline">{a("impactLink")}</Link>
          {SOURCES.map((url,i)=><a key={url} href={url} className="block text-energy underline">{a(i===0?"cpeSource":"epbdSource")}</a>)}
        </section>
        {storageError && <div role="alert" className="mb-6 rounded-xl border border-red-200 p-5 text-red-800"><p>{a("storageError")}</p>{rawSaved.current && <button className="mt-3 underline" onClick={()=>downloadCsvFile(rawSaved.current!,"portfolio-original.json")}>{a("backup")}</button>}</div>}
        {saveError && <p role="alert" className="mb-6 text-red-700">{a("saveError")}</p>}
        <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvImport} disabled={storageError}/>
        {csvMessage && <p role="status" className="mb-4 rounded-lg border border-card-border p-3">{csvMessage.text}</p>}
        {/* ============================================================ */}
        {/*  EMPTY STATE                                                  */}
        {/* ============================================================ */}
        {properties.length === 0 && !showForm && !storageError && (
          <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-12 text-center shadow-sm">
            <div className="text-5xl mb-4">🏠</div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {t("emptyTitle")}
            </h2>
            <p className="text-muted mb-6 max-w-md mx-auto">
              {a("empty")}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-energy px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-energy/90 transition-colors"
            >
              + {t("addFirstProperty")}
            </button>
            <p className="mt-3 text-xs text-muted">{t("csvOrImport")}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => csvInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm hover:bg-background transition-colors"
              >
                {t("csvImport")}
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-4 py-2 text-xs font-medium text-muted hover:text-foreground shadow-sm hover:bg-background transition-colors"
              >
                {t("csvTemplate")}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  ADD PROPERTY BUTTON + COLLAPSIBLE FORM                       */}
        {/* ============================================================ */}
        {(properties.length > 0 || showForm) && (
          <div className="mb-8">
            {!showForm && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-energy px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-energy/90 transition-colors"
                >
                  + {t("addProperty")}
                </button>
                <button
                  onClick={() => csvInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-background transition-colors"
                >
                  {t("csvImport")}
                </button>
                <button
                  onClick={handleCsvExport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-background transition-colors"
                >
                  {t("csvExport")}
                </button>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground shadow-sm hover:bg-background transition-colors"
                >
                  {t("csvTemplate")}
                </button>
              </div>
            )}

            {showForm && (
              <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="font-semibold text-foreground">
                    {t("addProperty")}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-muted hover:text-foreground text-sm"
                  >
                    {t("close")}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Nom / adresse */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label htmlFor="portfolio-nom" className="block text-sm font-medium text-foreground mb-1.5">
                      {t("labelNom")}
                    </label>
                    <input id="portfolio-nom"
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder={t("placeholderNom")}
                      className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground placeholder:text-muted/50"
                    />
                  </div>

                  {/* Classe energie */}
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {a("classLabel")}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CLASSES.map((c) => (
                        <button
                          key={c}
                          onClick={() => setClasse(c)}
                          aria-pressed={classe === c}
                          className={`min-w-9 flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                            classe === c
                              ? `${CLASS_COLORS[c]} ring-2 ring-offset-2 ring-energy`
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Surface */}
                  <div>
                    <label htmlFor="portfolio-surface" className="block text-sm font-medium text-foreground mb-1.5">
                      {t("labelSurface")}
                    </label>
                    <input id="portfolio-surface"
                      type="number"
                      value={surface}
                      onChange={(e) =>
                        setSurface(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="120"
                      className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground"
                      min={1}
                    />
                  </div>

                  {/* Valeur estimée */}
                  <div>
                    <label htmlFor="portfolio-valeur" className="block text-sm font-medium text-foreground mb-1.5">
                      {a("valueLabel")}
                    </label>
                    <div className="relative">
                      <input id="portfolio-valeur"
                        type="number"
                        value={valeur}
                        onChange={(e) =>
                          setValeur(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        placeholder="750 000"
                        className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 pr-10 text-foreground"
                        min={0}
                        step={10000}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                        EUR
                      </span>
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {t("labelType")}
                    </label>
                    <div className="flex gap-1.5">
                      {TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setType(opt.value)}
                          className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition-all ${
                            type === opt.value
                              ? "bg-energy text-white ring-2 ring-offset-1 ring-energy"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Annee construction */}
                  <div>
                    <label htmlFor="portfolio-annee" className="block text-sm font-medium text-foreground mb-1.5">
                      {t("labelAnnee")}
                    </label>
                    <input id="portfolio-annee"
                      type="number"
                      value={annee}
                      onChange={(e) =>
                        setAnnee(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="1990"
                      className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground"
                      min={1000}
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handleAdd}
                    disabled={!formValid}
                    className="inline-flex items-center gap-2 rounded-xl bg-energy px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-energy/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t("btnAdd")}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-card-border px-6 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 transition-colors"
                  >
                    {t("btnCancel")}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ============================================================ */}
        {/*  PROPERTIES CARDS                                             */}
        {/* ============================================================ */}
        {properties.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold text-foreground">
                {t("yourProperties", { count: properties.length })}
              </h2>
              {stats && <PdfButton generateBlob={async () => (await import("@/components/energy/EnergyAuditPdf")).generateEnergyAuditPdf(report)} filename="energy-portfolio.pdf" label={t("downloadPdf")} />}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-card-border bg-card p-5 shadow-sm relative group"
                >
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors opacity-100"
                    title={t("delete")} aria-label={t("delete")+" : "+p.nom}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold shrink-0 ${CLASS_COLORS[p.classe]}`}
                    >
                      {p.classe}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {p.nom}
                      </div>
                      <div className="text-xs text-muted">
                        {typeLabel(p.type)} · {p.annee}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{fmt(p.surface)} m²</span>
                    <span className="font-semibold text-foreground">
                      {fmt(p.valeur)} EUR
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  PORTFOLIO SUMMARY (2+ properties)                            */}
        {/* ============================================================ */}
        {stats && <section id="portfolio-summary" className="mb-8 space-y-4 rounded-2xl border border-card-border bg-card p-5">
          <h2 className="font-semibold">{a("summary")}</h2>
          <dl className="grid gap-4 sm:grid-cols-2"><div><dt>{a("valueLabel")}</dt><dd className="text-xl font-bold break-words">{fmt(stats.totalValeur)} EUR</dd></div><div><dt>{t("colSurface")}</dt><dd className="text-xl font-bold">{fmt(stats.totalSurface)} m²</dd></div></dl>
          <h3 className="font-semibold">{t("distributionByClass")}</h3>
          <div className="space-y-2">{CLASSES.filter(c=>stats.repartition[c]>0).map(c=><div key={c}><div className="flex flex-wrap justify-between gap-2 text-sm"><span>{c==="?"?a("unknown"):c}</span><span>{fmt(stats.repartition[c])} m² · {fmtDec(stats.repartition[c]/stats.totalSurface*100)} %</span></div><div className="mt-1 h-3 rounded bg-gray-100"><div className={"h-3 rounded "+BAR_COLORS[c]} style={{width:`${stats.repartition[c]/stats.totalSurface*100}%`}}/></div></div>)}</div>
          <p className="text-sm text-muted">{a("distributionNote")}</p>
        </section>}

        {/* ============================================================ */}
        {/*  COMPARISON TABLE                                             */}
        {/* ============================================================ */}
        {properties.length >= 1 && (
          <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
              <h2 className="font-semibold text-foreground">
                {t("comparisonTitle")}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left">
                    <th
                      className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground select-none"
                      onClick={() => toggleSort("nom")}
                    >
                      {t("colNom")}{sortArrow("nom")}
                    </th>
                    <th
                      className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground select-none text-center"
                      onClick={() => toggleSort("classe")}
                    >
                      {t("colClasse")}{sortArrow("classe")}
                    </th>
                    <th
                      className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground select-none text-right"
                      onClick={() => toggleSort("surface")}
                    >
                      {t("colSurface")}{sortArrow("surface")}
                    </th>
                    <th
                      className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground select-none text-right"
                      onClick={() => toggleSort("valeur")}
                    >
                      {t("colValeur")}{sortArrow("valeur")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProperties.map((p) => {
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-card-border last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-foreground font-medium max-w-[200px] truncate">
                          {p.nom}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${CLASS_COLORS[p.classe]}`}
                          >
                            {p.classe}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {fmt(p.surface)} m²
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">
                          {fmt(p.valeur)} EUR
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>


          </div>
        )}
      </div>
    </div>
  );
}
