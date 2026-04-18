"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { computePreAcquisition, defaultDeal, type PreAcqDeal } from "@/lib/hotellerie/pre-acquisition";
import type { HotelCategory } from "@/lib/hotellerie/types";

const STORAGE_KEY = "tevaxia-hotel-preacq-deal";

function fmtEUR(n: number, digits = 0): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: digits }).format(n);
}
function fmtPct(n: number, digits = 1): string {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)} %`;
}
function fmtNum(n: number, digits = 2): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(n);
}

export default function PreAcquisitionPage() {
  const [deal, setDeal] = useState<PreAcqDeal>(defaultDeal());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDeal(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(deal)); } catch {}
  }, [deal, hydrated]);

  const result = useMemo(() => computePreAcquisition(deal), [deal]);

  const update = <K extends keyof PreAcqDeal>(k: K, v: PreAcqDeal[K]) => setDeal({ ...deal, [k]: v });

  const scoreColor =
    result.score >= 70 ? "bg-emerald-600" :
    result.score >= 50 ? "bg-amber-500" :
    "bg-rose-600";

  const scoreLabel =
    result.score >= 70 ? "GO — deal attractif" :
    result.score >= 50 ? "À négocier — points de vigilance" :
    "NO GO — risques majeurs";

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Workflow pré-acquisition hôtelière</h1>
          <p className="text-sm text-muted mt-1">
            Triangulation de valorisation, DSCR, business plan 10 ans, exit value, IRR equity, score go/no-go.
          </p>
        </div>
        <button onClick={() => { if (confirm("Réinitialiser le deal ?")) setDeal(defaultDeal()); }}
          className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate hover:bg-background">
          Réinitialiser
        </button>
      </div>

      {/* Score global */}
      <section className={`${scoreColor} rounded-xl p-5 text-white mb-6 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold opacity-80">Score global go/no-go</div>
            <div className="text-4xl font-bold mt-1">{result.score.toFixed(0)}/100</div>
            <div className="text-sm font-semibold mt-1 opacity-95">{scoreLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider font-semibold opacity-80">Prix demandé</div>
            <div className="text-2xl font-bold mt-1">{fmtEUR(deal.asking_price)}</div>
            <div className="text-xs opacity-90 mt-1">
              Fair value : {fmtEUR(result.fair_value)} ·{" "}
              <span className={result.ask_vs_fair_pct > 0.05 ? "text-rose-100" : "text-emerald-100"}>
                {result.ask_vs_fair_pct > 0 ? "+" : ""}{fmtPct(result.ask_vs_fair_pct)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          {result.signals.map((s, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-2 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <span>{s.status === "ok" ? "✓" : s.status === "warn" ? "⚠" : "✗"}</span>
                <span>{s.label}</span>
              </div>
              <div className="text-[11px] opacity-90 mt-0.5">{s.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* Inputs */}
        <aside className="space-y-4">
          <Section title="Cible">
            <Field label="Nom" value={deal.name} onChange={(v) => update("name", v)} />
            <Field label="Commune" value={deal.commune} onChange={(v) => update("commune", v)} />
            <SelectField label="Catégorie" value={deal.category}
              options={[
                { v: "budget", l: "Budget (1-2★)" },
                { v: "midscale", l: "Midscale (3★)" },
                { v: "upscale", l: "Upscale (4★)" },
                { v: "luxury", l: "Luxury (5★)" },
              ]}
              onChange={(v) => update("category", v as HotelCategory)} />
            <NumField label="Nb chambres" value={deal.nb_rooms} onChange={(v) => update("nb_rooms", v)} />
            <NumField label="Prix demandé (€)" value={deal.asking_price} step={50000} onChange={(v) => update("asking_price", v)} />
          </Section>

          <Section title="Exploitation actuelle">
            <NumField label="ADR (€/nuit)" value={deal.adr} step={1} onChange={(v) => update("adr", v)} />
            <NumField label="Occupancy (0-1)" value={deal.occupancy} step={0.01} onChange={(v) => update("occupancy", v)} />
            <NumField label="F&B revenu/an (€)" value={deal.fb_revenue} step={10000} onChange={(v) => update("fb_revenue", v)} />
            <NumField label="Autres revenus/an (€)" value={deal.other_revenue} step={5000} onChange={(v) => update("other_revenue", v)} />
            <NumField label="Staff cost/an (€)" value={deal.staff_cost} step={10000} onChange={(v) => update("staff_cost", v)} />
            <NumField label="Énergie/an (€)" value={deal.energy_cost} step={5000} onChange={(v) => update("energy_cost", v)} />
            <NumField label="Autres opex/an (€)" value={deal.other_opex} step={10000} onChange={(v) => update("other_opex", v)} />
            <NumField label="Taxe foncière/an (€)" value={deal.taxe_fonciere} step={1000} onChange={(v) => update("taxe_fonciere", v)} />
          </Section>

          <Section title="Hypothèses croissance">
            <NumField label="Croissance ADR/an" value={deal.adr_growth_pct} step={0.005} onChange={(v) => update("adr_growth_pct", v)} />
            <NumField label="Croissance occupation/an" value={deal.occupancy_growth_pct} step={0.005} onChange={(v) => update("occupancy_growth_pct", v)} />
            <NumField label="Inflation opex/an" value={deal.opex_inflation_pct} step={0.005} onChange={(v) => update("opex_inflation_pct", v)} />
          </Section>

          <Section title="Financement">
            <NumField label="Equity (€)" value={deal.equity} step={100000} onChange={(v) => update("equity", v)} />
            <NumField label="Dette (€)" value={deal.debt} step={100000} onChange={(v) => update("debt", v)} />
            <NumField label="Taux dette" value={deal.debt_rate_pct} step={0.005} onChange={(v) => update("debt_rate_pct", v)} />
            <NumField label="Durée dette (années)" value={deal.debt_term_years} step={1} onChange={(v) => update("debt_term_years", v)} />
          </Section>

          <Section title="CAPEX & sortie">
            <NumField label="CAPEX entrée (€)" value={deal.capex_entry} step={50000} onChange={(v) => update("capex_entry", v)} />
            <NumField label="Réserve FF&E % CA" value={deal.capex_reserve_pct} step={0.005} onChange={(v) => update("capex_reserve_pct", v)} />
            <SelectField label="Horizon sortie"
              value={String(deal.exit_year)}
              options={[{ v: "5", l: "5 ans" }, { v: "7", l: "7 ans" }, { v: "10", l: "10 ans" }]}
              onChange={(v) => update("exit_year", Number(v) as 5 | 7 | 10)} />
            <NumField label="Cap rate exit" value={deal.exit_cap_rate} step={0.005} onChange={(v) => update("exit_cap_rate", v)} />
          </Section>
        </aside>

        {/* Results */}
        <main className="space-y-5 min-w-0">
          {/* Snapshot */}
          <Card title="1. Snapshot exploitation actuelle">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="RevPAR" value={`${fmtNum(result.current_revpar, 1)} €`} />
              <Stat label="CA total" value={fmtEUR(result.current_total_revenue)} />
              <Stat label="GOP" value={fmtEUR(result.current_gop)} sub={fmtPct(result.current_gop_margin)} />
              <Stat label="EBITDA" value={fmtEUR(result.current_ebitda)} sub={fmtPct(result.current_ebitda_margin)} />
              <Stat label="Revenu CA par chambre" value={fmtEUR(result.current_total_revenue / Math.max(1, deal.nb_rooms))} />
              <Stat label="Marge EBITDA par chambre" value={fmtEUR(result.current_ebitda / Math.max(1, deal.nb_rooms))} />
            </div>
          </Card>

          {/* Triangulation valorisation */}
          <Card title="2. Triangulation valorisation (3 méthodes)">
            <div className="grid gap-3 sm:grid-cols-3">
              <MethodCard label="Multiple EBITDA" value={result.val_ebitda_multiple}
                note={`EBITDA x ${(result.val_ebitda_multiple / Math.max(1, result.current_ebitda)).toFixed(1)}`} />
              <MethodCard label="Prix/clé" value={result.val_price_per_key}
                note={`${fmtEUR(result.val_price_per_key / Math.max(1, deal.nb_rooms))} /chambre`} />
              <MethodCard label="DCF 5 ans + Gordon" value={result.val_dcf} note={`Taux d'actualisation 9%`} />
            </div>
            <div className="mt-4 rounded-xl bg-navy/5 border border-navy/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-muted">Fair value pondérée</div>
                  <div className="text-xl font-bold text-navy mt-1">{fmtEUR(result.fair_value)}</div>
                  <div className="text-[11px] text-muted mt-0.5">Pondération : 40% EBITDA + 30% prix/clé + 30% DCF</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider font-semibold text-muted">Écart vs demandé</div>
                  <div className={`text-xl font-bold mt-1 ${result.ask_vs_fair_pct > 0.05 ? "text-rose-600" : result.ask_vs_fair_pct < -0.05 ? "text-emerald-600" : "text-amber-600"}`}>
                    {result.ask_vs_fair_pct > 0 ? "+" : ""}{fmtPct(result.ask_vs_fair_pct)}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Financement */}
          <Card title="3. Structure de financement">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="LTV" value={fmtPct(result.ltv)} sub={`${fmtEUR(deal.debt)} / ${fmtEUR(deal.asking_price)}`} />
              <Stat label="Equity / Dette" value={`${fmtEUR(deal.equity)} / ${fmtEUR(deal.debt)}`} />
              <Stat label="Annuité dette" value={fmtEUR(result.loan_payment_annual)} sub={`${fmtPct(deal.debt_rate_pct)} sur ${deal.debt_term_years} ans`} />
              <Stat label="DSCR année 1"
                value={`${fmtNum(result.dscr_year1, 2)}x`}
                sub={result.dscr_year1 >= 1.35 ? "Bankable" : result.dscr_year1 >= 1.15 ? "Limite" : "Refus probable"}
                tone={result.dscr_year1 >= 1.35 ? "emerald" : result.dscr_year1 >= 1.15 ? "amber" : "rose"} />
            </div>
          </Card>

          {/* Business plan */}
          <Card title="4. Business plan 10 ans">
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="text-left py-2 text-muted font-semibold">Année</th>
                    <th className="text-right py-2 text-muted font-semibold">CA</th>
                    <th className="text-right py-2 text-muted font-semibold">GOP</th>
                    <th className="text-right py-2 text-muted font-semibold">EBITDA</th>
                    <th className="text-right py-2 text-muted font-semibold">% marge</th>
                    <th className="text-right py-2 text-muted font-semibold">DSCR</th>
                    <th className="text-right py-2 text-muted font-semibold">CF equity</th>
                  </tr>
                </thead>
                <tbody>
                  {result.projection.map((p) => {
                    const isExit = p.year === deal.exit_year;
                    return (
                      <tr key={p.year} className={`border-b border-card-border/50 ${isExit ? "bg-emerald-50/40 font-semibold" : ""}`}>
                        <td className="py-1.5">
                          Y{p.year}
                          {isExit && <span className="ml-2 text-[10px] bg-emerald-600 text-white rounded px-1.5 py-0.5">EXIT</span>}
                        </td>
                        <td className="py-1.5 text-right font-mono">{fmtEUR(p.total_revenue)}</td>
                        <td className="py-1.5 text-right font-mono">{fmtEUR(p.gop)}</td>
                        <td className="py-1.5 text-right font-mono">{fmtEUR(p.ebitda)}</td>
                        <td className="py-1.5 text-right font-mono">{fmtPct(p.ebitda_margin)}</td>
                        <td className={`py-1.5 text-right font-mono ${p.dscr >= 1.35 ? "text-emerald-700" : p.dscr >= 1.15 ? "text-amber-700" : "text-rose-700"}`}>
                          {fmtNum(p.dscr, 2)}x
                        </td>
                        <td className={`py-1.5 text-right font-mono ${p.cash_flow_to_equity >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {fmtEUR(p.cash_flow_to_equity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Exit + IRR */}
          <Card title={`5. Sortie année ${deal.exit_year} & rendement`}>
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="EBITDA exit" value={fmtEUR(result.exit_ebitda)} />
              <Stat label="Valeur de sortie" value={fmtEUR(result.exit_value)}
                sub={`Cap rate ${fmtPct(deal.exit_cap_rate)}`} />
              <Stat label="Solde dette exit" value={fmtEUR(result.debt_balance_at_exit)} />
              <Stat label="Retour equity" value={fmtEUR(result.equity_return)} tone="emerald" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-xs uppercase tracking-wider font-semibold text-emerald-900">TRI equity</div>
                <div className="text-3xl font-bold text-emerald-700 mt-1">{fmtPct(result.irr_equity)}</div>
                <div className="text-[11px] text-emerald-900/80 mt-1">
                  {result.irr_equity >= 0.15 ? "Excellent pour hôtellerie LU" :
                   result.irr_equity >= 0.10 ? "Conforme marché" :
                   result.irr_equity >= 0.05 ? "En dessous attentes" :
                   "Insuffisant — passer"}
                </div>
              </div>
              <div className="rounded-xl border border-navy/20 bg-navy/5 p-4">
                <div className="text-xs uppercase tracking-wider font-semibold text-navy">Multiple equity</div>
                <div className="text-3xl font-bold text-navy mt-1">{fmtNum(result.equity_multiple, 2)}x</div>
                <div className="text-[11px] text-navy/70 mt-1">
                  Equity x{fmtNum(result.equity_multiple, 2)} en {deal.exit_year} ans
                </div>
              </div>
            </div>
          </Card>

          {/* Outils liés */}
          <Card title="6. Aller plus loin — outils liés">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <LinkCard href="/hotellerie/due-diligence" title="Due diligence 50 items" desc="Technique, commercial, juridique, fiscal, ESG, RH" />
              <LinkCard href="/hotellerie/valorisation" title="Valorisation détaillée" desc="3 méthodes, override ratios par catégorie" />
              <LinkCard href="/hotellerie/dscr" title="DSCR — simulation dette" desc="Covenant limites banques LU" />
              <LinkCard href="/hotellerie/compset" title="Compset MPI/ARI/RGI" desc="Positionnement vs concurrence" />
              <LinkCard href="/hotellerie/capex" title="CAPEX plan 10 ans" desc="Rénovation + FF&E lifecycle" />
              <LinkCard href="/hotellerie/score-e2" title="Score E-2 visa US" desc="Pour investisseurs americains" />
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider font-bold text-navy mb-2.5">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">{label}</div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm" />
    </label>
  );
}

function NumField({ label, value, onChange, step = 1 }: {
  label: string; value: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">{label}</div>
      <input type="number" value={value} step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm text-right font-mono" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: Array<{ v: string; l: string }>; onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-card-border bg-card p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, sub, tone }: {
  label: string; value: string; sub?: string; tone?: "emerald" | "amber" | "rose";
}) {
  const border =
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    tone === "rose" ? "border-rose-200 bg-rose-50/40" :
    "border-card-border bg-background/30";
  const txt =
    tone === "emerald" ? "text-emerald-900" :
    tone === "amber" ? "text-amber-900" :
    tone === "rose" ? "text-rose-900" :
    "text-navy";
  return (
    <div className={`rounded-lg border ${border} p-3`}>
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`text-lg font-bold mt-0.5 ${txt}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function MethodCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className="text-xl font-bold text-navy mt-1">{fmtEUR(value)}</div>
      <div className="text-[10px] text-muted mt-0.5">{note}</div>
    </div>
  );
}

function LinkCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href}
      className="rounded-lg border border-card-border bg-background/30 p-3 hover:border-navy hover:bg-navy/5 transition-colors block">
      <div className="text-xs font-bold text-navy">{title}</div>
      <div className="text-[11px] text-muted mt-0.5">{desc}</div>
    </Link>
  );
}
