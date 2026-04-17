"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { formatEUR } from "@/lib/calculations";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import PdfExtractButton from "@/components/PdfExtractButton";

interface LotRow {
  id: string;
  name: string;
  commune: string | null;
  loyer_mensuel_actuel: number;
  charges_mensuelles: number;
  surface: number;
  prix_acquisition: number;
  annee_acquisition: number;
  classe_energie: string;
}

interface PaymentRow {
  lot_id: string;
  period_year: number;
  period_month: number;
  amount_rent: number;
  amount_charges: number;
  amount_total: number;
  status: string;
}

export default function DashboardFiscal() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear - 1);

  const [lots, setLots] = useState<LotRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Estimations charges déductibles (saisies manuelles, stockage session pour le moment)
  const [deductibles, setDeductibles] = useState<Record<string, {
    interets: number; assurance: number; entretien: number; charges_copro: number; taxe_fonciere: number; amortissement: number;
  }>>({});

  useEffect(() => {
    if (!user || !supabase) return;
    const load = async () => {
      const { data: lotsData } = await supabase!
        .from("rental_lots")
        .select("id, name, commune, loyer_mensuel_actuel, charges_mensuelles, surface, prix_acquisition, annee_acquisition, classe_energie")
        .eq("user_id", user.id);
      const lotList = (lotsData ?? []) as LotRow[];
      setLots(lotList);

      if (lotList.length > 0) {
        const { data: pays } = await supabase!
          .from("rental_payments")
          .select("lot_id, period_year, period_month, amount_rent, amount_charges, amount_total, status")
          .eq("user_id", user.id)
          .eq("period_year", year);
        setPayments((pays ?? []) as PaymentRow[]);
      }
      setLoading(false);
    };
    void load();
  }, [user, year]);

  const setLotDeductible = (lotId: string, field: string, value: number) => {
    setDeductibles((prev) => ({
      ...prev,
      [lotId]: { ...(prev[lotId] ?? { interets: 0, assurance: 450, entretien: 0, charges_copro: 0, taxe_fonciere: 0, amortissement: 0 }), [field]: value },
    }));
  };

  // OCR facture : route le montant extrait vers le bon poste selon la catégorie
  // détectée par l'IA (champ 'categorie' du schéma facture_immo)
  const CATEGORIE_TO_FIELD: Record<string, "interets" | "assurance" | "entretien" | "charges_copro" | "taxe_fonciere" | "amortissement"> = {
    entretien: "entretien",
    travaux: "entretien",
    reparation: "entretien",
    assurance: "assurance",
    copropriete: "charges_copro",
    syndic: "charges_copro",
    "taxe fonciere": "taxe_fonciere",
    interets: "interets",
  };
  const handleOcrInvoice = (lotId: string) => (data: Record<string, unknown>) => {
    const raw = data as { montantTTC?: number; montant_ttc?: number; montant?: number; categorie?: string; fournisseur?: string };
    const montant = Number(raw.montantTTC ?? raw.montant_ttc ?? raw.montant ?? 0);
    if (!montant || !Number.isFinite(montant) || montant <= 0) {
      alert("Aucun montant détecté sur la facture. Saisissez manuellement.");
      return;
    }
    const catRaw = (raw.categorie ?? "").toString().toLowerCase();
    const field = (Object.entries(CATEGORIE_TO_FIELD).find(([k]) => catRaw.includes(k))?.[1]) ?? "entretien";
    const current = deductibles[lotId] ?? { interets: 0, assurance: 450, entretien: 0, charges_copro: 0, taxe_fonciere: 0, amortissement: 0 };
    setLotDeductible(lotId, field, (current[field] ?? 0) + montant);
    const fournisseurText = raw.fournisseur ? ` (${raw.fournisseur})` : "";
    alert(`Facture importée${fournisseurText} : ${montant.toFixed(2)} € ajoutés à « ${field === "entretien" ? "Entretien & réparation" : field === "charges_copro" ? "Charges copropriété" : field} ».`);
  };

  const summary = useMemo(() => {
    const rows = lots.map((lot) => {
      const paid = payments.filter((p) => p.lot_id === lot.id && p.status === "paid");
      const revenus = paid.reduce((s, p) => s + p.amount_rent, 0);
      const chargesRecues = paid.reduce((s, p) => s + p.amount_charges, 0);
      const d = deductibles[lot.id] ?? { interets: 0, assurance: 450, entretien: 0, charges_copro: 0, taxe_fonciere: 0, amortissement: 0 };
      const chargesDeduc = d.interets + d.assurance + d.entretien + d.charges_copro + d.taxe_fonciere + d.amortissement;
      const netImposable = Math.max(0, revenus + chargesRecues - chargesDeduc);
      return { lot, revenus, chargesRecues, deductibles: d, chargesDeduc, netImposable };
    });
    const totalRevenus = rows.reduce((s, r) => s + r.revenus + r.chargesRecues, 0);
    const totalDeduc = rows.reduce((s, r) => s + r.chargesDeduc, 0);
    const totalImposable = rows.reduce((s, r) => s + r.netImposable, 0);
    return { rows, totalRevenus, totalDeduc, totalImposable };
  }, [lots, payments, deductibles]);

  if (!user) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Connectez-vous pour accéder au dashboard fiscal.</div>;
  if (loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/gestion-locative" className="text-xs text-muted hover:text-navy">&larr; Gestion locative</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Dashboard fiscal Luxembourg</h1>
          <p className="mt-1 text-sm text-muted">
            Consolidation de vos revenus et charges locatives pour votre déclaration IR (formulaires 100 F et 102 LU).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
            {[currentYear - 3, currentYear - 2, currentYear - 1, currentYear].map((y) => (
              <option key={y} value={y}>Année fiscale {y}</option>
            ))}
          </select>
          <span className="text-xs text-muted">
            Déclaration IR à déposer avant le 31 mars {year + 1}
          </span>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-600 p-5 text-white">
            <div className="text-xs uppercase tracking-wider text-white/70">Revenus bruts {year}</div>
            <div className="mt-1 text-3xl font-bold">{formatEUR(summary.totalRevenus)}</div>
            <div className="mt-1 text-xs text-white/60">Loyers + charges perçues</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-rose-700 to-orange-600 p-5 text-white">
            <div className="text-xs uppercase tracking-wider text-white/70">Charges déductibles</div>
            <div className="mt-1 text-3xl font-bold">- {formatEUR(summary.totalDeduc)}</div>
            <div className="mt-1 text-xs text-white/60">Intérêts, assurance, entretien, copro…</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-5 text-white">
            <div className="text-xs uppercase tracking-wider text-white/70">Revenu imposable</div>
            <div className="mt-1 text-3xl font-bold">{formatEUR(summary.totalImposable)}</div>
            <div className="mt-1 text-xs text-white/60">À reporter en case revenus locatifs</div>
          </div>
        </div>

        {/* Détail par lot */}
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-4">Détail par lot</h2>
          {summary.rows.length === 0 ? (
            <p className="text-sm text-muted">Aucun lot enregistré. Commencez par créer vos lots sur <Link className="text-navy underline" href="/gestion-locative">/gestion-locative</Link>.</p>
          ) : (
            <div className="space-y-4">
              {summary.rows.map((r) => (
                <div key={r.lot.id} className="rounded-lg border border-card-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-navy">{r.lot.name}</h3>
                      <p className="text-xs text-muted">{r.lot.commune ?? "—"} · {r.lot.surface} m² · classe {r.lot.classe_energie}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted">Imposable</div>
                      <div className="font-mono font-bold text-navy">{formatEUR(r.netImposable)}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs">
                      <div className="font-semibold text-emerald-900 mb-1">Revenus {year}</div>
                      <div className="flex justify-between"><span className="text-muted">Loyers perçus</span><span className="font-mono">{formatEUR(r.revenus)}</span></div>
                      <div className="flex justify-between"><span className="text-muted">Charges perçues</span><span className="font-mono">{formatEUR(r.chargesRecues)}</span></div>
                    </div>
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="font-semibold text-rose-900">Charges déductibles</div>
                        <PdfExtractButton
                          schema="facture_immo"
                          onExtracted={handleOcrInvoice(r.lot.id)}
                          label="📄 OCR facture"
                          className="text-[10px]"
                        />
                      </div>
                      <div className="space-y-1">
                        {([
                          ["interets", "Intérêts d'emprunt"],
                          ["assurance", "Assurance PNO"],
                          ["entretien", "Entretien & réparation"],
                          ["charges_copro", "Charges copropriété"],
                          ["taxe_fonciere", "Taxe foncière"],
                          ["amortissement", "Amortissement (méthode forfaitaire)"],
                        ] as const).map(([k, label]) => (
                          <div key={k} className="flex items-center justify-between gap-2">
                            <label className="text-muted flex-1">{label}</label>
                            <input
                              type="number"
                              value={(deductibles[r.lot.id] ?? { [k]: 0 })[k] ?? 0}
                              onChange={(e) => setLotDeductible(r.lot.id, k, Number(e.target.value) || 0)}
                              className="w-24 rounded border border-rose-200 bg-white px-2 py-1 text-xs text-right font-mono"
                            />
                          </div>
                        ))}
                        <div className="pt-1 border-t border-rose-200 flex justify-between font-semibold">
                          <span>Total déductibles</span>
                          <span className="font-mono">{formatEUR(r.chargesDeduc)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {summary.rows.length > 0 && (
          <div className="mt-6">
            <AiAnalysisCard
              context={[
                `Déclaration fiscale locative Luxembourg — année ${year}`,
                `Nombre de lots: ${summary.rows.length}`,
                `Revenus bruts totaux: ${formatEUR(summary.totalRevenus)}`,
                `Charges déductibles totales: ${formatEUR(summary.totalDeduc)}`,
                `Revenu net imposable: ${formatEUR(summary.totalImposable)}`,
                "",
                `Détail par lot:`,
                ...summary.rows.map((r) => `  ${r.lot.name} (${r.lot.commune ?? "—"}, ${r.lot.surface}m²): revenus ${formatEUR(r.revenus + r.chargesRecues)} - charges déduc ${formatEUR(r.chargesDeduc)} = imposable ${formatEUR(r.netImposable)}`),
              ].join("\n")}
              prompt="Analyse ce dashboard fiscal locatif luxembourgeois avant déclaration IR. Livre : (1) complétude des charges déductibles (rappel des catégories : intérêts emprunt art. 105 LIR, PNO, entretien, charges copro non récupérables, taxe foncière, amortissement forfaitaire 2% pour bâti, frais de gestion 5% forfaitaire ou réels), (2) optimisations fiscales LU spécifiques (déduction plafonnée intérêts pour non-résidents ?, régime forfaitaire vs réel, impact art. 106 abattements), (3) cases à compléter dans le formulaire 100 F / 102 (revenus immobiliers, charges, amortissement), (4) timing optimal de déclaration, (5) points d'attention si plusieurs lots ou société (SCI/SPF). Pratique, actionnable pour un bailleur particulier non fiscaliste."
            />
          </div>
        )}

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>Important :</strong> les charges déductibles saisies ici ne sont pas persistées (usage session uniquement pour le moment).
          Conservez vos justificatifs pendant 10 ans (art. 14 LIR). Cette analyse est indicative — validez avec votre expert-comptable ou via une
          déclaration préalable myguichet.lu.
        </div>
      </div>
    </div>
  );
}
