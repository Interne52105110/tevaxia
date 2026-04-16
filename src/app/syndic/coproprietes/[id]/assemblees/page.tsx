"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import ConvocationPdf from "@/components/ConvocationPdf";
import AssemblyMinutesPdf from "@/components/AssemblyMinutesPdf";
import { getProfile } from "@/lib/profile";
import { getCoownership, listUnits, type Coownership, type CoownershipUnit } from "@/lib/coownerships";
import {
  listAssemblies, createAssembly, deleteAssembly,
  sendConvocation, openAssembly, closeAssembly,
  listResolutions, createResolution, deleteResolution,
  listVotes, setVote,
  STATUS_LABEL, VOTE_LABEL, MAJORITY_LABEL,
  type Assembly, type Resolution, type AssemblyVote,
  type AssemblyStatus, type MajorityType, type VoteValue,
} from "@/lib/coownership-assemblies";

const STATUS_COLOR: Record<AssemblyStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  convened: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  closed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export default function AssembliesPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [units, setUnits] = useState<CoownershipUnit[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [activeAssemblyId, setActiveAssemblyId] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [votesMap, setVotesMap] = useState<Record<string, AssemblyVote[]>>({});
  const [error, setError] = useState<string | null>(null);

  const [showCreateAssembly, setShowCreateAssembly] = useState(false);
  const [newAssembly, setNewAssembly] = useState({
    title: `AG ordinaire ${new Date().getFullYear()}`,
    assembly_type: "ordinary" as const,
    scheduled_at: "",
    location: "",
    virtual_url: "",
    quorum_pct: 50,
    notes: "",
  });

  const [showAddResolution, setShowAddResolution] = useState(false);
  const [resDraft, setResDraft] = useState<{ title: string; description: string; majority_type: MajorityType }>({
    title: "",
    description: "",
    majority_type: "simple",
  });

  const refresh = async () => {
    try {
      const [c, u, a] = await Promise.all([getCoownership(id), listUnits(id), listAssemblies(id)]);
      setCoown(c); setUnits(u); setAssemblies(a);
      const nextActive = activeAssemblyId && a.find((x) => x.id === activeAssemblyId) ? activeAssemblyId : (a[0]?.id ?? null);
      setActiveAssemblyId(nextActive);
      if (nextActive) await loadAssemblyDetails(nextActive);
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const loadAssemblyDetails = async (assemblyId: string) => {
    const r = await listResolutions(assemblyId);
    setResolutions(r);
    const votesByRes: Record<string, AssemblyVote[]> = {};
    for (const res of r) {
      votesByRes[res.id] = await listVotes(res.id);
    }
    setVotesMap(votesByRes);
  };

  useEffect(() => {
    if (id && user) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  useEffect(() => {
    if (activeAssemblyId) void loadAssemblyDetails(activeAssemblyId);
  }, [activeAssemblyId]);

  if (!coown) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;

  const activeAssembly = assemblies.find((a) => a.id === activeAssemblyId) ?? null;
  const activeResolutions = resolutions;

  const handleCreateAssembly = async () => {
    if (!newAssembly.title.trim() || !newAssembly.scheduled_at) return;
    try {
      const a = await createAssembly({
        coownership_id: id,
        title: newAssembly.title.trim(),
        assembly_type: newAssembly.assembly_type,
        scheduled_at: new Date(newAssembly.scheduled_at).toISOString(),
        location: newAssembly.location || undefined,
        virtual_url: newAssembly.virtual_url || undefined,
        quorum_pct: newAssembly.quorum_pct,
        notes: newAssembly.notes || undefined,
      });
      setShowCreateAssembly(false);
      setActiveAssemblyId(a.id);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleDeleteAssembly = async (aid: string) => {
    if (!confirm("Supprimer cette assemblée ? Les résolutions et votes associés seront également supprimés.")) return;
    try {
      await deleteAssembly(aid);
      if (activeAssemblyId === aid) setActiveAssemblyId(null);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleAddResolution = async () => {
    if (!activeAssemblyId || !resDraft.title.trim()) return;
    try {
      await createResolution({
        assembly_id: activeAssemblyId,
        title: resDraft.title.trim(),
        description: resDraft.description || undefined,
        majority_type: resDraft.majority_type,
      });
      setResDraft({ title: "", description: "", majority_type: "simple" });
      setShowAddResolution(false);
      await loadAssemblyDetails(activeAssemblyId);
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleVote = async (voteId: string, value: VoteValue) => {
    try {
      await setVote(voteId, value);
      if (activeAssemblyId) await loadAssemblyDetails(activeAssemblyId);
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleSendConvocation = async () => {
    if (!activeAssemblyId) return;
    if (!confirm("Marquer l'assemblée comme convoquée ? Vous pourrez ensuite télécharger les convocations PDF à envoyer.")) return;
    try {
      await sendConvocation(activeAssemblyId);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleOpen = async () => {
    if (!activeAssemblyId) return;
    try { await openAssembly(activeAssemblyId); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleClose = async () => {
    if (!activeAssemblyId) return;
    if (!confirm("Clôturer l'assemblée ? Les votes seront figés et le PV pourra être téléchargé.")) return;
    try { await closeAssembly(activeAssemblyId); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const downloadConvocation = async (unit?: CoownershipUnit) => {
    if (!activeAssembly || !coown) return;
    const profile = getProfile();
    const syndic = { name: profile.nomComplet || "Syndic", address: profile.adresse, email: profile.email, phone: profile.telephone };
    const blob = await pdf(
      <ConvocationPdf
        coownership={{ name: coown.name, address: coown.address, commune: coown.commune }}
        syndic={syndic}
        assembly={activeAssembly}
        resolutions={activeResolutions}
        recipient={unit ? {
          owner_name: unit.owner_name,
          owner_address: unit.owner_address,
          lot_number: unit.lot_number,
          tantiemes: unit.tantiemes,
        } : undefined}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = unit
      ? `convocation-${safe(coown.name)}-${safe(unit.lot_number)}.pdf`
      : `convocation-${safe(coown.name)}-${safe(activeAssembly.title)}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadMinutes = async () => {
    if (!activeAssembly || !coown) return;
    const profile = getProfile();
    const syndic = { name: profile.nomComplet || "Syndic", email: profile.email };
    const blob = await pdf(
      <AssemblyMinutesPdf
        coownership={{ name: coown.name, address: coown.address, total_tantiemes: coown.total_tantiemes }}
        syndic={syndic}
        assembly={activeAssembly}
        resolutions={activeResolutions}
        votesByResolution={votesMap}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = (s: string) => s.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `pv-${safe(coown.name)}-${safe(activeAssembly.title)}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const firstRes = activeResolutions[0];
  const expressedTantiemes = firstRes
    ? firstRes.votes_yes_tantiemes + firstRes.votes_no_tantiemes + firstRes.votes_abstain_tantiemes
    : 0;
  const attendancePct = coown.total_tantiemes > 0 ? (expressedTantiemes / coown.total_tantiemes) * 100 : 0;
  const quorumOk = activeAssembly ? attendancePct >= activeAssembly.quorum_pct : false;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes/${id}`} className="text-xs text-muted hover:text-navy">← {coown.name}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Assemblées générales</h1>
        <p className="mt-1 text-sm text-muted">
          Convocations, ordre du jour, vote électronique pondéré par tantièmes et procès-verbal automatique — loi du 16 mai 1975.
        </p>

        {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

        {/* Assemblies list + create */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {assemblies.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveAssemblyId(a.id)}
                className={`rounded-lg border px-3 py-2 text-xs ${
                  a.id === activeAssemblyId
                    ? "border-navy bg-navy text-white"
                    : "border-card-border bg-card text-navy hover:bg-slate-50"
                }`}
              >
                {a.title}{" "}
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${STATUS_COLOR[a.status]}`}>
                  {STATUS_LABEL[a.status]}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreateAssembly(!showCreateAssembly)}
            className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light"
          >
            {showCreateAssembly ? "Annuler" : "+ Nouvelle AG"}
          </button>
        </div>

        {showCreateAssembly && (
          <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Titre de l'assemblée"
                value={newAssembly.title}
                onChange={(e) => setNewAssembly({ ...newAssembly, title: e.target.value })}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
              <select
                value={newAssembly.assembly_type}
                onChange={(e) => setNewAssembly({ ...newAssembly, assembly_type: e.target.value as "ordinary" })}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              >
                <option value="ordinary">Assemblée ordinaire</option>
                <option value="extraordinary">Assemblée extraordinaire</option>
              </select>
              <input
                type="datetime-local"
                value={newAssembly.scheduled_at}
                onChange={(e) => setNewAssembly({ ...newAssembly, scheduled_at: e.target.value })}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Quorum requis (% des tantièmes)"
                value={newAssembly.quorum_pct}
                onChange={(e) => setNewAssembly({ ...newAssembly, quorum_pct: Number(e.target.value) || 50 })}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Lieu (adresse ou salle)"
                value={newAssembly.location}
                onChange={(e) => setNewAssembly({ ...newAssembly, location: e.target.value })}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
              <input
                type="url"
                placeholder="URL visioconférence (optionnel)"
                value={newAssembly.virtual_url}
                onChange={(e) => setNewAssembly({ ...newAssembly, virtual_url: e.target.value })}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Notes complémentaires (optionnel)"
                value={newAssembly.notes}
                onChange={(e) => setNewAssembly({ ...newAssembly, notes: e.target.value })}
                className="sm:col-span-2 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleCreateAssembly}
                disabled={!newAssembly.title.trim() || !newAssembly.scheduled_at}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                Créer l&apos;assemblée
              </button>
            </div>
          </div>
        )}

        {activeAssembly && (
          <>
            {/* Assembly summary + actions */}
            <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-navy">{activeAssembly.title}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(activeAssembly.scheduled_at).toLocaleString("fr-LU", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                    {activeAssembly.location ? ` · ${activeAssembly.location}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Quorum requis : <strong>{activeAssembly.quorum_pct} %</strong> ·
                    Atteint : <strong className={quorumOk ? "text-emerald-700" : "text-rose-700"}>
                      {attendancePct.toFixed(1)} %
                    </strong>
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeAssembly.status === "draft" && (
                    <button onClick={handleSendConvocation}
                      className="rounded-md bg-blue-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-blue-700">
                      Convoquer
                    </button>
                  )}
                  {activeAssembly.status === "convened" && (
                    <button onClick={handleOpen}
                      className="rounded-md bg-amber-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-amber-700">
                      Ouvrir le vote
                    </button>
                  )}
                  {activeAssembly.status === "in_progress" && (
                    <button onClick={handleClose}
                      className="rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700">
                      Clôturer
                    </button>
                  )}
                  <button onClick={() => downloadConvocation()}
                    className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] font-medium text-navy hover:bg-slate-50">
                    Convocation PDF
                  </button>
                  {(activeAssembly.status === "closed" || activeAssembly.status === "in_progress") && (
                    <button onClick={downloadMinutes}
                      className="rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-medium text-blue-800 hover:bg-blue-100">
                      PV PDF
                    </button>
                  )}
                  <button onClick={() => handleDeleteAssembly(activeAssembly.id)}
                    className="rounded-md p-1 text-muted hover:text-rose-600 hover:bg-rose-50" title="Supprimer">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Per-unit convocation downloads */}
              {activeAssembly.status !== "draft" && units.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-medium text-navy hover:underline">
                    Télécharger convocations individuelles ({units.length} lots)
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {units.map((u) => (
                      <button key={u.id} onClick={() => downloadConvocation(u)}
                        className="rounded-md border border-card-border bg-background px-2 py-1 text-[10px] font-medium text-navy hover:bg-slate-50">
                        Lot {u.lot_number} — {u.owner_name ?? "—"}
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Resolutions */}
            <div className="mt-6 flex items-center justify-between">
              <h3 className="text-base font-semibold text-navy">Ordre du jour &amp; résolutions</h3>
              {activeAssembly.status !== "closed" && (
                <button
                  onClick={() => setShowAddResolution(!showAddResolution)}
                  className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light"
                >
                  {showAddResolution ? "Annuler" : "+ Résolution"}
                </button>
              )}
            </div>

            {showAddResolution && (
              <div className="mt-3 rounded-xl border border-card-border bg-card p-4">
                <input
                  type="text"
                  placeholder="Intitulé de la résolution"
                  value={resDraft.title}
                  onChange={(e) => setResDraft({ ...resDraft, title: e.target.value })}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="Description détaillée (optionnel)"
                  value={resDraft.description}
                  onChange={(e) => setResDraft({ ...resDraft, description: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                  rows={2}
                />
                <select
                  value={resDraft.majority_type}
                  onChange={(e) => setResDraft({ ...resDraft, majority_type: e.target.value as MajorityType })}
                  className="mt-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                >
                  {(Object.keys(MAJORITY_LABEL) as MajorityType[]).map((m) => (
                    <option key={m} value={m}>{MAJORITY_LABEL[m]}</option>
                  ))}
                </select>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleAddResolution}
                    disabled={!resDraft.title.trim()}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            )}

            <div className="mt-3 space-y-3">
              {activeResolutions.length === 0 && (
                <div className="rounded-xl border border-dashed border-card-border bg-card p-6 text-center text-sm text-muted">
                  Aucune résolution à l&apos;ordre du jour. Ajoutez-en avant de convoquer l&apos;AG.
                </div>
              )}
              {activeResolutions.map((r) => {
                const expressed = r.votes_yes_tantiemes + r.votes_no_tantiemes + r.votes_abstain_tantiemes;
                const fmtPct = (n: number) => expressed > 0 ? `${((n / expressed) * 100).toFixed(1)} %` : "—";
                const votes = votesMap[r.id] ?? [];
                const votingAllowed = activeAssembly.status === "in_progress";

                return (
                  <div key={r.id} className="rounded-xl border border-card-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-blue-700">Résolution n° {r.number}</div>
                        <h4 className="mt-1 text-sm font-semibold text-navy">{r.title}</h4>
                        {r.description && <p className="mt-1 text-xs text-muted">{r.description}</p>}
                        <p className="mt-2 text-[10px] uppercase tracking-wider text-muted font-medium">
                          {MAJORITY_LABEL[r.majority_type]}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          r.result === "approved" ? "bg-emerald-100 text-emerald-800"
                          : r.result === "rejected" ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                        }`}>
                          {r.result === "approved" ? "Adoptée" : r.result === "rejected" ? "Rejetée" : "En attente"}
                        </span>
                        {activeAssembly.status !== "closed" && (
                          <button onClick={async () => {
                            if (!confirm("Supprimer cette résolution ?")) return;
                            await deleteResolution(r.id);
                            await loadAssemblyDetails(activeAssembly.id);
                          }} className="rounded-md p-1 text-muted hover:text-rose-600 hover:bg-rose-50" title="Supprimer">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                      <div className="rounded-lg bg-emerald-50 p-2">
                        <div className="text-[10px] uppercase text-emerald-800">Pour</div>
                        <div className="font-bold text-emerald-900">{r.votes_yes_tantiemes}</div>
                        <div className="text-[10px] text-emerald-700">{fmtPct(r.votes_yes_tantiemes)}</div>
                      </div>
                      <div className="rounded-lg bg-rose-50 p-2">
                        <div className="text-[10px] uppercase text-rose-800">Contre</div>
                        <div className="font-bold text-rose-900">{r.votes_no_tantiemes}</div>
                        <div className="text-[10px] text-rose-700">{fmtPct(r.votes_no_tantiemes)}</div>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-2">
                        <div className="text-[10px] uppercase text-amber-800">Abstention</div>
                        <div className="font-bold text-amber-900">{r.votes_abstain_tantiemes}</div>
                        <div className="text-[10px] text-amber-700">{fmtPct(r.votes_abstain_tantiemes)}</div>
                      </div>
                      <div className="rounded-lg bg-slate-100 p-2">
                        <div className="text-[10px] uppercase text-slate-700">Absents</div>
                        <div className="font-bold text-slate-900">{r.votes_absent_tantiemes}</div>
                        <div className="text-[10px] text-slate-600">tantièmes</div>
                      </div>
                    </div>

                    {/* Vote table */}
                    {votes.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-medium text-navy hover:underline">
                          Détail des votes ({votes.length} lots)
                        </summary>
                        <div className="mt-2 overflow-x-auto rounded-lg border border-card-border">
                          <table className="w-full text-xs">
                            <thead className="bg-background text-[10px] uppercase tracking-wider text-muted">
                              <tr>
                                <th className="px-3 py-1.5 text-left">Lot</th>
                                <th className="px-3 py-1.5 text-left">Copropriétaire</th>
                                <th className="px-3 py-1.5 text-right">Tantièmes</th>
                                <th className="px-3 py-1.5 text-center">Vote</th>
                                {votingAllowed && <th className="px-3 py-1.5 text-right">Modifier</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-card-border/50">
                              {votes.map((v) => {
                                const unit = units.find((u) => u.id === v.unit_id);
                                return (
                                  <tr key={v.id}>
                                    <td className="px-3 py-1.5 font-medium">{unit?.lot_number ?? "—"}</td>
                                    <td className="px-3 py-1.5">{v.voter_name ?? "—"}</td>
                                    <td className="px-3 py-1.5 text-right">{v.tantiemes_at_vote}</td>
                                    <td className="px-3 py-1.5 text-center">
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                        v.vote === "yes" ? "bg-emerald-100 text-emerald-800"
                                        : v.vote === "no" ? "bg-rose-100 text-rose-800"
                                        : v.vote === "abstain" ? "bg-amber-100 text-amber-800"
                                        : "bg-slate-100 text-slate-600"
                                      }`}>
                                        {VOTE_LABEL[v.vote]}
                                      </span>
                                    </td>
                                    {votingAllowed && (
                                      <td className="px-3 py-1.5 text-right space-x-1">
                                        {(["yes", "no", "abstain", "absent"] as VoteValue[]).map((val) => (
                                          <button key={val} onClick={() => handleVote(v.id, val)}
                                            className={`rounded px-1.5 py-0.5 text-[10px] ${
                                              v.vote === val ? "bg-navy text-white" : "border border-card-border hover:bg-slate-50"
                                            }`}>
                                            {val === "yes" ? "P" : val === "no" ? "C" : val === "abstain" ? "A" : "—"}
                                          </button>
                                        ))}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {assemblies.length === 0 && !showCreateAssembly && (
          <div className="mt-6 rounded-xl border border-dashed border-card-border bg-card p-10 text-center">
            <div className="text-4xl">🗳️</div>
            <h2 className="mt-3 text-lg font-semibold text-navy">Aucune assemblée programmée</h2>
            <p className="mt-1 text-sm text-muted">
              Créez une assemblée générale pour gérer convocation, ordre du jour, vote et PV en ligne.
            </p>
          </div>
        )}

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Rappel légal :</strong> la convocation doit parvenir à chaque copropriétaire au moins 15 jours avant la date
          de l&apos;assemblée (loi du 16 mai 1975). Le vote électronique nécessite mention explicite dans le règlement ou
          consentement préalable. Les majorités requises varient selon la nature de la résolution (travaux, syndic, modif. RC).
        </div>
      </div>
    </div>
  );
}
