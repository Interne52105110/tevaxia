"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  listArchives,
  uploadArchive,
  getSignedUrl,
  type CoownershipArchive,
  type ArchiveType,
} from "@/lib/coownership-archives";

const ARCHIVE_TYPE_LABELS: Record<ArchiveType, string> = {
  pv_ag: "PV d'assemblée générale",
  facture: "Facture fournisseur",
  contrat: "Contrat (assurance, chauffage, ascenseur)",
  devis: "Devis travaux",
  reglement: "Règlement de copropriété",
  compta_clot: "Comptes annuels clôturés",
  audit: "Audit / commissaire aux comptes",
  correspondance: "Correspondance formelle",
  autre: "Autre",
};

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("fr-LU", { year: "numeric", month: "short", day: "numeric" });
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function msUntil(isoDate: string): number {
  return new Date(isoDate).getTime() - Date.now();
}

export default function ArchivesPage() {
  const params = useParams();
  const coownershipId = String(params?.id ?? "");
  const { user, loading: authLoading } = useAuth();

  const [archives, setArchives] = useState<CoownershipArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    archiveType: "pv_ag" as ArchiveType,
    title: "",
    description: "",
    periodStart: "",
    periodEnd: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const reload = useCallback(async () => {
    if (!coownershipId || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const list = await listArchives(coownershipId);
      setArchives(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [coownershipId]);

  useEffect(() => { if (user) void reload(); }, [user, reload]);

  const handleUpload = async () => {
    if (!file) {
      setError("Sélectionnez un fichier.");
      return;
    }
    if (!form.title.trim()) {
      setError("Titre requis.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 50 Mo).");
      return;
    }
    setUploading(true);
    try {
      await uploadArchive({
        coownershipId,
        archiveType: form.archiveType,
        title: form.title,
        description: form.description || undefined,
        periodStart: form.periodStart || undefined,
        periodEnd: form.periodEnd || undefined,
        file,
      });
      setForm({ archiveType: "pv_ag", title: "", description: "", periodStart: "", periodEnd: "" });
      setFile(null);
      setShowUpload(false);
      setError(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (archive: CoownershipArchive) => {
    try {
      const url = await getSignedUrl(archive.storage_path);
      window.open(url, "_blank");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur téléchargement");
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Supabase + bucket &quot;coownership-archives&quot; requis.
        </div>
      </div>
    );
  }

  if (authLoading || loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center">
      <Link href="/connexion" className="text-navy underline">Se connecter</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href={`/syndic/coproprietes/${coownershipId}`} className="text-xs text-muted hover:text-navy">
        ← Retour copropriété
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">Archives — conservation 10 ans</h1>
      <p className="mt-1 text-sm text-muted">
        Conservation conforme loi du 16 mai 1975 (art. 13bis) : PV d&apos;AG, factures, contrats, comptes clôturés.
        Fichiers chiffrés au repos (AES-256), immuables, checksum SHA-256.
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      <div className="mt-6 flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm text-muted">
          {archives.length} archive(s) · rétention min. 10 ans
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
        >
          {showUpload ? "Annuler" : "+ Archiver un document"}
        </button>
      </div>

      {showUpload && (
        <div className="mt-4 rounded-xl border border-navy/20 bg-navy/5 p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Type *</div>
              <select
                value={form.archiveType}
                onChange={(e) => setForm((f) => ({ ...f, archiveType: e.target.value as ArchiveType }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              >
                {(Object.entries(ARCHIVE_TYPE_LABELS) as [ArchiveType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Titre *</div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="ex. PV AG ordinaire 2025-11-14"
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs sm:col-span-2">
              <div className="mb-1 font-semibold text-slate">Description</div>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Période début</div>
              <input
                type="date"
                value={form.periodStart}
                onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">Période fin</div>
              <input
                type="date"
                value={form.periodEnd}
                onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs sm:col-span-2">
              <div className="mb-1 font-semibold text-slate">Fichier * (PDF, image, max 50 Mo)</div>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
              />
              {file && <div className="mt-1 text-[10px] text-muted">{file.name} · {fmtSize(file.size)}</div>}
            </label>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || !file || !form.title.trim()}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50"
          >
            {uploading ? "Upload en cours…" : "Archiver (irréversible)"}
          </button>
          <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
            ⚠ Une fois archivé, le document est <strong>immuable et non-supprimable</strong> pendant 10 ans
            (loi 16.05.1975 art. 13bis). Vérifiez avant d&apos;archiver.
          </p>
        </div>
      )}

      {archives.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          Aucune archive pour cette copropriété.
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-card-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background/60">
                <th className="px-4 py-3 text-left font-semibold text-navy">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Titre</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Période</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Archivé le</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">Jusqu&apos;au</th>
                <th className="px-4 py-3 text-right font-semibold text-navy">Taille</th>
                <th className="px-4 py-3 text-right font-semibold text-navy"></th>
              </tr>
            </thead>
            <tbody>
              {archives.map((a) => {
                const remaining = msUntil(a.retention_until);
                const daysRemaining = Math.floor(remaining / (1000 * 60 * 60 * 24));
                const expiringSoon = daysRemaining < 180;
                return (
                  <tr key={a.id} className="border-b border-card-border/40 hover:bg-background/40">
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-navy/10 px-2 py-0.5 text-[10px] text-navy">
                        {ARCHIVE_TYPE_LABELS[a.archive_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{a.title}</div>
                      {a.description && <div className="text-[11px] text-muted">{a.description}</div>}
                      <div className="text-[10px] text-muted font-mono">SHA-256 {a.sha256.slice(0, 16)}…</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted font-mono">
                      {a.period_start ? fmtDate(a.period_start) : "—"}
                      {(a.period_start || a.period_end) && " → "}
                      {a.period_end ? fmtDate(a.period_end) : ""}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{fmtDate(a.archived_at)}</td>
                    <td className={`px-4 py-3 text-xs font-mono ${expiringSoon ? "text-amber-700 font-semibold" : ""}`}>
                      {fmtDate(a.retention_until)}
                      {expiringSoon && <div className="text-[9px]">expire dans {daysRemaining}j</div>}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-mono">{fmtSize(a.file_size)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDownload(a)} className="text-xs text-navy hover:underline">
                        Télécharger
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Conformité légale :</strong> les archives sont conservées 10 ans conformément à la loi modifiée
        du 16 mai 1975 sur la copropriété (art. 13bis). Chaque fichier a un checksum SHA-256 pour garantir
        l&apos;intégrité. Les fichiers sont chiffrés au repos (AES-256). La table est immuable côté DB
        (trigger `archive_is_immutable`) — aucune modification ni suppression possible avant expiration.
      </div>
    </div>
  );
}
