"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  getCoownership, updateCoownership,
  listWorksFundMovements, addWorksFundMovement, deleteWorksFundMovement,
  type Coownership, type WorksFundMovement,
} from "@/lib/coownerships";
import { formatEUR } from "@/lib/calculations";
import AiAnalysisCard from "@/components/AiAnalysisCard";

const MOVEMENT_LABELS: Record<WorksFundMovement["movement_type"], string> = {
  contribution: "Cotisation",
  withdrawal: "Prélèvement (travaux)",
  adjustment: "Ajustement",
  interest: "Intérêts",
};

const MOVEMENT_COLORS: Record<WorksFundMovement["movement_type"], string> = {
  contribution: "text-emerald-700 bg-emerald-50",
  withdrawal: "text-rose-700 bg-rose-50",
  adjustment: "text-amber-700 bg-amber-50",
  interest: "text-blue-700 bg-blue-50",
};

export default function FondsTravauxPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const { user } = useAuth();

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [movements, setMovements] = useState<WorksFundMovement[]>([]);
  const [targetPct, setTargetPct] = useState(5);
  const [annualContribution, setAnnualContribution] = useState(0);
  const [savingTarget, setSavingTarget] = useState(false);

  // New movement form
  const [showForm, setShowForm] = useState(false);
  const [newMv, setNewMv] = useState<{ type: WorksFundMovement["movement_type"]; amount: number; description: string; project: string; date: string }>({
    type: "contribution",
    amount: 0,
    description: "",
    project: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const refresh = useCallback(async () => {
    if (!id || !user) return;
    const [c, mvs] = await Promise.all([getCoownership(id), listWorksFundMovements(id)]);
    setCoown(c);
    setMovements(mvs);
    if (c) {
      setTargetPct(c.works_fund_target_pct ?? 5);
      setAnnualContribution(c.works_fund_annual_contribution ?? 0);
    }
  }, [id, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSaveTarget = async () => {
    setSavingTarget(true);
    try {
      await updateCoownership(id, {
        works_fund_target_pct: targetPct,
        works_fund_annual_contribution: annualContribution,
      });
      await refresh();
    } finally {
      setSavingTarget(false);
    }
  };

  const handleAddMovement = async () => {
    if (!newMv.amount || newMv.amount <= 0) return;
    await addWorksFundMovement({
      coownership_id: id,
      movement_date: newMv.date,
      movement_type: newMv.type,
      amount: newMv.amount,
      description: newMv.description || null,
      related_works_project: newMv.project || null,
    });
    setNewMv({ type: "contribution", amount: 0, description: "", project: "", date: new Date().toISOString().slice(0, 10) });
    setShowForm(false);
    await refresh();
  };

  const handleDelete = async (mvId: string) => {
    if (!confirm("Supprimer ce mouvement du fonds ?")) return;
    await deleteWorksFundMovement(mvId);
    await refresh();
  };

  if (!coown) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;
  }

  const balance = coown.works_fund_balance ?? 0;
  const nbLots = coown.nb_lots || 1;
  const balancePerLot = balance / nbLots;

  // Recommandation selon projet 7763 : 5% du budget annuel en fonds de travaux
  const recommendedAnnual = annualContribution > 0 ? annualContribution : 0;
  const yearsOfReserves = recommendedAnnual > 0 ? balance / recommendedAnnual : 0;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href={`/syndic/coproprietes/${id}`} className="text-xs text-muted hover:text-navy">&larr; {coown.name}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Fonds de travaux</h1>
        <p className="mt-1 text-sm text-muted">
          Capitalisation pour gros travaux futurs — anticipation du projet de loi 7763 (modernisation loi 16 mai 1975).
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 text-white shadow-lg">
            <div className="text-xs uppercase tracking-wider text-white/60">Solde courant</div>
            <div className="mt-2 text-3xl font-bold">{formatEUR(balance)}</div>
            <div className="mt-1 text-xs text-white/60">
              {formatEUR(Math.round(balancePerLot))} / lot ({nbLots} lots)
            </div>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted">Cotisation annuelle votée</div>
            <div className="mt-2 text-3xl font-bold text-navy">{formatEUR(annualContribution)}</div>
            <div className="mt-1 text-xs text-muted">{targetPct.toFixed(1)}% budget prévisionnel</div>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted">Couverture</div>
            <div className="mt-2 text-3xl font-bold text-emerald-700">{yearsOfReserves.toFixed(1)} ans</div>
            <div className="mt-1 text-xs text-muted">de cotisations en réserve</div>
          </div>
        </div>

        {/* Paramétrage */}
        <div className="mt-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy">Paramétrage du fonds</h2>
          <p className="mt-1 text-xs text-muted">
            Le projet de loi 7763 prévoit une cotisation minimale de <strong>5% du budget prévisionnel annuel</strong>. À ajuster selon l&apos;âge du bâtiment et l&apos;état.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate mb-1">% du budget annuel</label>
              <input
                type="number"
                value={targetPct}
                onChange={(e) => setTargetPct(Number(e.target.value))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                min={0}
                max={100}
                step={0.5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate mb-1">Cotisation annuelle (EUR)</label>
              <input
                type="number"
                value={annualContribution}
                onChange={(e) => setAnnualContribution(Number(e.target.value))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                min={0}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveTarget}
              disabled={savingTarget}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-60"
            >
              {savingTarget ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Mouvements */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-navy">Historique des mouvements</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              {showForm ? "Annuler" : "+ Nouveau mouvement"}
            </button>
          </div>

          {showForm && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Type</label>
                  <select
                    value={newMv.type}
                    onChange={(e) => setNewMv({ ...newMv, type: e.target.value as WorksFundMovement["movement_type"] })}
                    className="w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm"
                  >
                    {Object.entries(MOVEMENT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Date</label>
                  <input
                    type="date"
                    value={newMv.date}
                    onChange={(e) => setNewMv({ ...newMv, date: e.target.value })}
                    className="w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Montant (EUR)</label>
                  <input
                    type="number"
                    value={newMv.amount}
                    onChange={(e) => setNewMv({ ...newMv, amount: Number(e.target.value) })}
                    className="w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm"
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Projet lié (facultatif)</label>
                  <input
                    type="text"
                    value={newMv.project}
                    onChange={(e) => setNewMv({ ...newMv, project: e.target.value })}
                    placeholder="ex: Ravalement façade 2027"
                    className="w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate mb-1">Description</label>
                  <input
                    type="text"
                    value={newMv.description}
                    onChange={(e) => setNewMv({ ...newMv, description: e.target.value })}
                    placeholder="ex: Cotisation annuelle 2026 votée AG 15/03/2026"
                    className="w-full rounded-lg border border-input-border bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleAddMovement}
                  disabled={!newMv.amount}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  Enregistrer le mouvement
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
            {movements.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted">
                Aucun mouvement pour l&apos;instant. Commencez par enregistrer la cotisation annuelle votée en AG.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border bg-background text-left">
                    <th className="px-4 py-2 font-semibold text-slate">Date</th>
                    <th className="px-4 py-2 font-semibold text-slate">Type</th>
                    <th className="px-4 py-2 font-semibold text-slate">Projet</th>
                    <th className="px-4 py-2 font-semibold text-slate">Description</th>
                    <th className="px-4 py-2 font-semibold text-slate text-right">Montant</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mv) => (
                    <tr key={mv.id} className="border-b border-card-border/50">
                      <td className="px-4 py-2 font-mono text-xs">{mv.movement_date}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${MOVEMENT_COLORS[mv.movement_type]}`}>
                          {MOVEMENT_LABELS[mv.movement_type]}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted">{mv.related_works_project ?? "—"}</td>
                      <td className="px-4 py-2 text-xs text-muted truncate max-w-[200px]">{mv.description ?? "—"}</td>
                      <td className={`px-4 py-2 text-right font-mono font-semibold ${mv.movement_type === "withdrawal" ? "text-rose-700" : "text-emerald-700"}`}>
                        {mv.movement_type === "withdrawal" ? "-" : "+"}{formatEUR(mv.amount)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleDelete(mv.id)}
                          className="text-muted hover:text-rose-600 text-xs"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="mt-8">
          <AiAnalysisCard
            context={[
              `Fonds de travaux copropriété Luxembourg`,
              `Copropriété: ${coown.name} (${coown.nb_lots} lots, ${coown.year_built ? `construite en ${coown.year_built}` : "année construction inconnue"})`,
              `Commune: ${coown.commune ?? "—"}, ${coown.has_elevator ? "avec ascenseur" : "sans ascenseur"}, ${coown.nb_floors ?? "?"} étages`,
              "",
              `Solde actuel fonds: ${formatEUR(balance)} (${formatEUR(Math.round(balancePerLot))}/lot)`,
              `Cotisation annuelle votée: ${formatEUR(annualContribution)} (${targetPct}% budget annuel visé)`,
              `Couverture actuelle: ${yearsOfReserves.toFixed(1)} ans de cotisations`,
              `Nombre mouvements enregistrés: ${movements.length}`,
            ].join("\n")}
            prompt="Analyse la santé du fonds de travaux de cette copropriété luxembourgeoise. Livre : (1) diagnostic capitalisation vs benchmark (5% budget projet loi 7763, mais ajustable selon âge bâti : 3% pour neuf <10 ans, 5-8% pour 10-30 ans, 10-15% pour >30 ans ou défaillant), (2) travaux probables à anticiper selon âge et type (toiture cycle 25 ans, façade 15-20 ans, ascenseur cycle 30 ans, VMC 20 ans, chauffage selon type), (3) suffisance actuelle pour absorber un gros chantier type sans appel de fonds exceptionnel, (4) recommandation cotisation annuelle si actuelle est insuffisante, (5) bonnes pratiques gouvernance : compte bancaire dédié séparé, placement taux 0 (sécurité), rapport annuel AG, accord conseil syndical avant tout prélèvement. Concret pour un syndic LU."
          />
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>Note réglementaire :</strong> Le projet de loi 7763 (modernisation de la loi du 16 mai 1975) prévoit un <strong>fonds de travaux obligatoire</strong> pour
          toutes les copropriétés LU, avec une cotisation minimale annuelle. Cette page anticipe l&apos;entrée en vigueur — adaptez les paramètres dès publication au Mémorial A.
        </div>
      </div>
    </div>
  );
}
