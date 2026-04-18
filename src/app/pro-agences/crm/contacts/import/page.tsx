"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createContact } from "@/lib/crm";
import {
  buildImportResult, detectColumnMapping, mapRowToContact,
  type CsvImportResult,
} from "@/lib/crm/import-csv";
import { errMsg } from "@/lib/errors";

export default function ContactsImportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [defaultKind, setDefaultKind] = useState<"prospect" | "lead" | "acquereur">("prospect");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);
    try {
      const content = await file.text();
      const parsed = buildImportResult(content);
      setResult(parsed);
      setMapping(detectColumnMapping(parsed.headers));
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const handleDoImport = async () => {
    if (!result) return;
    if (!confirm(`Importer ${result.valid} contacts valides ?`)) return;
    setImporting(true);
    setImported(0);
    let done = 0;
    let failed = 0;
    for (const row of result.rows) {
      if (row.errors.length > 0) continue;
      try {
        const p = row.parsed;
        await createContact({
          kind: p.kind || defaultKind,
          is_company: p.is_company,
          first_name: p.first_name,
          last_name: p.last_name,
          company_name: p.company_name,
          email: p.email,
          phone: p.phone,
          address: p.address,
          postal_code: p.postal_code,
          city: p.city,
          country: p.country,
          budget_min: p.budget_min,
          budget_max: p.budget_max,
          target_surface_min: p.target_surface_min,
          target_surface_max: p.target_surface_max,
          target_zones: p.target_zones,
          tags: p.tags,
          notes: p.notes,
        });
        done++;
        setImported(done);
      } catch {
        failed++;
      }
    }
    setImporting(false);
    alert(`Import terminé : ${done} ajoutés, ${failed} erreurs.`);
    router.push("/pro-agences/crm/contacts");
  };

  if (authLoading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">Se connecter</Link></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/pro-agences/crm/contacts" className="text-xs text-muted hover:text-navy">← Contacts</Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Import contacts CSV</h1>
      <p className="mt-1 text-sm text-muted">
        Import bulk de contacts depuis un fichier CSV exporté d&apos;Excel, d&apos;Apimo,
        de votre ancien CRM ou de votre carnet d&apos;adresses. Détection automatique
        des colonnes par nom.
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* Étape 1 : upload fichier */}
      {!result && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-navy/20 bg-navy/5 p-12 text-center">
          <div className="text-4xl mb-3">📂</div>
          <h2 className="text-lg font-bold text-navy">Sélectionnez votre fichier CSV</h2>
          <p className="mt-2 text-xs text-muted">
            Séparateur ; ou , détecté automatiquement. UTF-8 recommandé. Max 10 MB.
          </p>
          <input type="file" ref={fileInputRef} accept=".csv,text/csv"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
            className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="mt-6 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light">
            Choisir un fichier CSV
          </button>
          <div className="mt-6 text-[11px] text-muted">
            <strong>Colonnes reconnues :</strong> Prénom, Nom, Société, Email, Téléphone,
            Adresse, CP, Ville, Pays, Budget_min, Budget_max, Surface_min/max, Zones, Tags, Notes, Catégorie.
          </div>
        </div>
      )}

      {/* Étape 2 : preview */}
      {result && !importing && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Stat label="Total lignes" value={result.total} />
            <Stat label="Valides" value={result.valid} tone="emerald" />
            <Stat label="Avec erreurs" value={result.invalid} tone="rose" />
            <Stat label="Séparateur" value={result.delimiter} />
          </div>

          {/* Catégorie par défaut */}
          <div className="mt-5 rounded-xl border border-card-border bg-card p-4">
            <label className="text-xs">
              <span className="text-muted">Catégorie par défaut (si non détectée dans CSV)</span>
              <select value={defaultKind}
                onChange={(e) => setDefaultKind(e.target.value as "prospect" | "lead" | "acquereur")}
                className="ml-2 rounded border border-input-border bg-input-bg px-2 py-1 text-xs">
                <option value="prospect">Prospect</option>
                <option value="lead">Lead</option>
                <option value="acquereur">Acquéreur</option>
              </select>
            </label>
          </div>

          {/* Mapping détecté */}
          <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Mapping auto-détecté
            </h3>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {Object.entries(mapping).map(([target, source]) => (
                <span key={target} className="rounded-full bg-background px-2 py-0.5">
                  <span className="font-mono text-navy">{target}</span>
                  {" ← "}
                  <span className="font-mono text-muted">{source}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 rounded-xl border border-card-border bg-card overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-2 py-2 text-left">#</th>
                  <th className="px-2 py-2 text-left">Prénom / Nom / Société</th>
                  <th className="px-2 py-2 text-left">Email</th>
                  <th className="px-2 py-2 text-left">Téléphone</th>
                  <th className="px-2 py-2 text-left">Budget</th>
                  <th className="px-2 py-2 text-left">Zones</th>
                  <th className="px-2 py-2 text-left">Erreurs</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className={row.errors.length > 0 ? "bg-rose-50/40" : ""}>
                    <td className="px-2 py-1 font-mono text-[10px]">{i + 1}</td>
                    <td className="px-2 py-1">
                      {row.parsed.is_company
                        ? row.parsed.company_name
                        : [row.parsed.first_name, row.parsed.last_name].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-2 py-1 text-[10px]">{row.parsed.email ?? "—"}</td>
                    <td className="px-2 py-1 text-[10px]">{row.parsed.phone ?? "—"}</td>
                    <td className="px-2 py-1 text-[10px]">
                      {row.parsed.budget_min || row.parsed.budget_max
                        ? `${row.parsed.budget_min ?? "?"}-${row.parsed.budget_max ?? "?"}`
                        : "—"}
                    </td>
                    <td className="px-2 py-1 text-[10px]">
                      {row.parsed.target_zones.join(", ") || "—"}
                    </td>
                    <td className="px-2 py-1 text-[10px] text-rose-700">
                      {row.errors.join("; ") || "✓"}
                    </td>
                  </tr>
                ))}
                {result.rows.length > 50 && (
                  <tr><td colSpan={7} className="px-2 py-2 text-center text-[10px] text-muted">
                    …{result.rows.length - 50} lignes supplémentaires (import complet lors du submit)
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={() => setResult(null)}
              className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-semibold text-slate hover:bg-background">
              Choisir un autre fichier
            </button>
            {result.valid > 0 && (
              <button onClick={handleDoImport}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Importer {result.valid} contact(s) valide(s)
              </button>
            )}
          </div>
        </>
      )}

      {/* Étape 3 : import en cours */}
      {importing && result && (
        <div className="mt-6 rounded-xl border border-navy/20 bg-navy/5 p-8 text-center">
          <div className="text-3xl mb-3">⏳</div>
          <h2 className="text-lg font-bold text-navy">Import en cours…</h2>
          <div className="mt-3 text-sm text-muted">
            {imported} / {result.valid} contacts importés
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-background overflow-hidden max-w-sm mx-auto">
            <div className="h-full bg-emerald-500 transition-all"
              style={{ width: `${(imported / Math.max(1, result.valid)) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>RGPD :</strong> marketing_opt_in est toujours initialisé à false
        lors de l&apos;import. Pour marketing email, vous devez obtenir le consentement
        explicite des contacts après l&apos;import (checkbox dans leur profil).
        Conformément à l&apos;article 6(1)(a) RGPD, conservez la preuve du consentement.
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "emerald" | "rose" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200" :
    tone === "rose" ? "bg-rose-50 border-rose-200" : "bg-card border-card-border";
  const txt = tone === "emerald" ? "text-emerald-900" :
    tone === "rose" ? "text-rose-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-xl font-bold ${txt}`}>{value}</div>
    </div>
  );
}
