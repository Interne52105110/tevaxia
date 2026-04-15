import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "État des services — tevaxia.lu",
  description: "Statut en temps réel des services tevaxia.lu : site web, API, base de données, paiements.",
  robots: { index: true, follow: true },
};

export const revalidate = 60;

interface Check {
  name: string;
  description: string;
  url?: string;
  status: "ok" | "degraded" | "down" | "unknown";
  latencyMs?: number;
}

async function probe(name: string, description: string, url: string, timeoutMs = 5000): Promise<Check> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    const latency = Date.now() - start;
    clearTimeout(timeout);
    if (!res.ok) return { name, description, url, status: "degraded", latencyMs: latency };
    return { name, description, url, status: latency < 2000 ? "ok" : "degraded", latencyMs: latency };
  } catch {
    return { name, description, url, status: "down" };
  }
}

export default async function StatusPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const checks: Check[] = await Promise.all([
    probe(
      "Site web",
      "Frontend Vercel",
      `https://www.tevaxia.lu/robots.txt`
    ),
    supabaseUrl && anon
      ? probe(
          "Base de données",
          "Supabase (auth + Postgres)",
          `${supabaseUrl}/auth/v1/settings`
        )
      : Promise.resolve<Check>({
          name: "Base de données",
          description: "Supabase (auth + Postgres)",
          status: "unknown",
        }),
    probe(
      "API estimation",
      "Endpoint /api/v1/estimation",
      `https://www.tevaxia.lu/api/v1/estimation?commune=Luxembourg&surface=80`
    ),
    probe(
      "data.public.lu",
      "Observatoire de l'Habitat",
      `https://data.public.lu`
    ),
  ]);

  const globalStatus: Check["status"] = checks.some((c) => c.status === "down")
    ? "down"
    : checks.some((c) => c.status === "degraded")
      ? "degraded"
      : "ok";

  const overallLabel: Record<Check["status"], { label: string; color: string; emoji: string }> = {
    ok: { label: "Tous les services sont opérationnels", color: "from-emerald-600 to-emerald-800", emoji: "✓" },
    degraded: { label: "Certains services sont dégradés", color: "from-amber-500 to-amber-700", emoji: "⚠" },
    down: { label: "Incident en cours", color: "from-rose-600 to-rose-800", emoji: "✕" },
    unknown: { label: "Statut indéterminé", color: "from-slate-500 to-slate-700", emoji: "?" },
  };

  const overall = overallLabel[globalStatus];

  return (
    <div className="bg-background min-h-screen py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-2 text-xs text-muted">
          <Link href="/" className="hover:text-navy">← tevaxia.lu</Link>
        </div>
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">État des services</h1>
        <p className="mt-2 text-sm text-muted">
          Contrôles en direct exécutés côté serveur, rafraîchis toutes les 60 secondes.
        </p>

        <div className={`mt-6 rounded-2xl bg-gradient-to-br ${overall.color} p-6 text-white shadow-lg`}>
          <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">Statut global</div>
          <div className="mt-2 flex items-center gap-3 text-xl font-bold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              {overall.emoji}
            </span>
            {overall.label}
          </div>
          <div className="mt-2 text-xs text-white/80">
            Dernière vérification : {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {checks.map((c) => (
            <div key={c.name} className="rounded-xl border border-card-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusDot status={c.status} />
                    <span className="font-semibold text-navy">{c.name}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">{c.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-navy">{statusLabel(c.status)}</div>
                  {c.latencyMs != null && (
                    <div className="text-xs text-muted">{c.latencyMs} ms</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Incident majeur ?</strong> Signalez-le à{" "}
          <a href="mailto:contact@tevaxia.lu" className="underline hover:no-underline">contact@tevaxia.lu</a>.
          Cette page n&apos;a pas d&apos;historique publique — elle reflète uniquement l&apos;état en direct.
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: Check["status"] }) {
  const color = status === "ok" ? "bg-emerald-500"
    : status === "degraded" ? "bg-amber-500"
    : status === "down" ? "bg-rose-500"
    : "bg-slate-400";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />;
}

function statusLabel(s: Check["status"]): string {
  return s === "ok" ? "Opérationnel"
    : s === "degraded" ? "Dégradé"
    : s === "down" ? "Hors service"
    : "Inconnu";
}
