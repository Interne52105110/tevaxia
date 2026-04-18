"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getCoownership, type Coownership } from "@/lib/coownerships";
import { markChargePaid } from "@/lib/coownership-finance";
import {
  parseBankStatement, matchTransactions,
  type ParsedBankStatement, type MatchResult, type UnpaidChargeForMatch,
} from "@/lib/syndic-bank-import";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

export default function RapprochementPage() {
  const params = useParams();
  const coownershipId = String(params?.id ?? "");
  const { user, loading: authLoading } = useAuth();
  const [coown, setCoown] = useState<Coownership | null>(null);
  const [unpaid, setUnpaid] = useState<UnpaidChargeForMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statement, setStatement] = useState<ParsedBankStatement | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [applying, setApplying] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    if (!coownershipId || !isSupabaseConfigured || !supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const c = await getCoownership(coownershipId);
      setCoown(c);
      const { data } = await supabase
        .from("coownership_unpaid_charges")
        .select("charge_id, unit_id, lot_number, owner_name, amount_due, amount_paid, amount_outstanding, payment_reference, call_label")
        .eq("coownership_id", coownershipId);
      const rows = ((data ?? []) as Array<{
        charge_id: string; unit_id: string; lot_number: string;
        owner_name: string | null; amount_due: number; amount_paid: number;
        amount_outstanding: number; payment_reference: string | null;
        call_label: string;
      }>).map((r) => ({
        charge_id: r.charge_id,
        unit_id: r.unit_id,
        lot_number: r.lot_number,
        owner_name: r.owner_name,
        amount_due: Number(r.amount_due),
        amount_paid: Number(r.amount_paid),
        outstanding: Number(r.amount_outstanding),
        payment_reference: r.payment_reference,
        call_label: r.call_label,
      }));
      setUnpaid(rows);
    } catch (e) {
      setError(errMsg(e));
    }
    setLoading(false);
  }, [coownershipId]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const handleFile = async (file: File) => {
    try {
      const content = await file.text();
      const parsed = parseBankStatement(content);
      setStatement(parsed);
      const matchResults = matchTransactions(parsed.transactions, unpaid);
      setMatches(matchResults);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const applyMatch = async (m: MatchResult) => {
    if (!m.matched_charge) return;
    await markChargePaid(m.matched_charge.charge_id, m.matched_charge.outstanding, "bank_transfer");
    setFlash(`✓ Charge lot ${m.matched_charge.lot_number} marquée payée`);
    setTimeout(() => setFlash(null), 3000);
    await reload();
  };

  const applyAll = async () => {
    const toApply = matches.filter((m) => m.matched_charge && m.match_score >= 60);
    if (toApply.length === 0) return;
    if (!confirm(`Valider ${toApply.length} rapprochements (score ≥ 60) ?`)) return;
    setApplying(true);
    let done = 0;
    for (const m of toApply) {
      if (m.matched_charge) {
        await markChargePaid(m.matched_charge.charge_id, m.matched_charge.outstanding, "bank_transfer");
        done++;
      }
    }
    setApplying(false);
    setFlash(`✓ ${done} charges marquées payées`);
    setTimeout(() => setFlash(null), 3500);
    await reload();
    setStatement(null);
    setMatches([]);
  };

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !coown) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">Se connecter</Link></div>;

  const matchedCount = matches.filter((m) => m.matched_charge && m.match_score >= 60).length;
  const uncertainCount = matches.filter((m) => m.matched_charge && m.match_score >= 30 && m.match_score < 60).length;
  const unmatchedCount = matches.filter((m) => !m.matched_charge).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-navy">Rapprochement bancaire</h1>
      <p className="mt-1 text-sm text-muted">
        Upload du relevé bancaire CSV de la copropriété. Rapprochement automatique
        des crédits entrants avec les appels de fonds impayés via référence de paiement
        ou montant + nom propriétaire.
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}
      {flash && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{flash}</div>}

      {/* Stats impayés */}
      <div className="mt-5 rounded-xl border border-card-border bg-card p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">État actuel</div>
        <div className="mt-1 flex flex-wrap gap-4 text-sm">
          <div><strong>{unpaid.length}</strong> charges impayées</div>
          <div>Total outstanding : <strong>{formatEUR(unpaid.reduce((s, u) => s + u.outstanding, 0))}</strong></div>
        </div>
      </div>

      {/* Upload */}
      {!statement && (
        <div className="mt-5 rounded-xl border-2 border-dashed border-navy/20 bg-navy/5 p-12 text-center">
          <div className="text-4xl mb-3">🏦</div>
          <h2 className="text-lg font-bold text-navy">Uploadez votre relevé bancaire CSV</h2>
          <p className="mt-2 text-xs text-muted">
            Export CSV depuis votre web banking (BCEE, BIL, Spuerkeess, ING, Raiffeisen…).
          </p>
          <input type="file" ref={fileInputRef} accept=".csv,text/csv"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
            className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="mt-6 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light">
            Choisir un fichier CSV
          </button>
          <div className="mt-4 text-[11px] text-muted">
            Colonnes reconnues : Date, Montant, Libellé, Référence, Contrepartie (tout format LU standard).
          </div>
        </div>
      )}

      {/* Résultats rapprochement */}
      {statement && matches.length > 0 && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Stat label="Transactions" value={String(statement.total)} />
            <Stat label="Matches fiables (≥60)" value={String(matchedCount)} tone="emerald" />
            <Stat label="Matches incertains (30-59)" value={String(uncertainCount)} tone="amber" />
            <Stat label="Non matchés" value={String(unmatchedCount)} tone="rose" />
          </div>

          <div className="mt-5 flex justify-between">
            <button onClick={() => { setStatement(null); setMatches([]); }}
              className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-semibold text-slate">
              Changer de fichier
            </button>
            {matchedCount > 0 && (
              <button onClick={applyAll} disabled={applying}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {applying ? "Application…" : `✓ Valider ${matchedCount} rapprochements fiables`}
              </button>
            )}
          </div>

          <div className="mt-5 space-y-2">
            {matches.map((m, i) => {
              const tier = m.match_score >= 60 ? "emerald" : m.match_score >= 30 ? "amber" : "slate";
              return (
                <div key={i} className={`rounded-xl border p-4 ${
                  tier === "emerald" ? "border-emerald-200 bg-emerald-50/30" :
                  tier === "amber" ? "border-amber-200 bg-amber-50/30" :
                  "border-card-border bg-card"
                }`}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Transaction */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Transaction</div>
                      <div className="mt-1 text-lg font-bold text-navy">
                        {m.tx.amount > 0 ? "+" : ""}{formatEUR(m.tx.amount)}
                      </div>
                      <div className="text-xs text-muted">{new Date(m.tx.date).toLocaleDateString("fr-LU")}</div>
                      <div className="mt-1 text-xs">{m.tx.label}</div>
                      {m.tx.reference && (
                        <div className="text-[11px] font-mono text-muted">Réf : {m.tx.reference}</div>
                      )}
                      {m.tx.counterparty && (
                        <div className="text-[11px] text-muted">{m.tx.counterparty}</div>
                      )}
                    </div>

                    {/* Match */}
                    <div>
                      {m.matched_charge ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                              Appel proposé
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              tier === "emerald" ? "bg-emerald-600 text-white" :
                              "bg-amber-600 text-white"
                            }`}>
                              Score {m.match_score}
                            </span>
                          </div>
                          <div className="mt-1 text-sm font-semibold text-navy">
                            Lot {m.matched_charge.lot_number} — {m.matched_charge.owner_name ?? "?"}
                          </div>
                          <div className="text-xs text-muted">{m.matched_charge.call_label}</div>
                          <div className="text-xs font-mono">
                            Dû : {formatEUR(m.matched_charge.outstanding)}
                            {" · "}
                            Réf : {m.matched_charge.payment_reference ?? "?"}
                          </div>
                          <div className="text-[10px] text-muted italic mt-1">
                            Critères : {m.match_reason}
                          </div>
                          <button onClick={() => applyMatch(m)}
                            className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                            ✓ Marquer payé
                          </button>
                        </>
                      ) : (
                        <div className="text-sm text-rose-700 font-semibold">Aucun appel correspondant</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Conseil :</strong> exportez le relevé CSV depuis votre web banking LU
        (BCEE : Menu &raquo; Extraits &raquo; Export CSV · BIL : Comptes &raquo; Historique &raquo; CSV).
        Les matches avec score ≥ 60 sont fiables (référence exacte + montant).
        Les scores 30–59 demandent une validation manuelle.
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "amber" | "rose" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200" :
    tone === "amber" ? "bg-amber-50 border-amber-200" :
    tone === "rose" ? "bg-rose-50 border-rose-200" : "bg-card border-card-border";
  const txt = tone === "emerald" ? "text-emerald-900" :
    tone === "amber" ? "text-amber-900" :
    tone === "rose" ? "text-rose-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${txt}`}>{value}</div>
    </div>
  );
}
