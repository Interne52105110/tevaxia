"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listMyOrganizations, type Organization } from "@/lib/orgs";
import { listCoownerships, createCoownership, deleteCoownership, type Coownership } from "@/lib/coownerships";

export default function SyndicCopropsPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user } = useAuth();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [coowns, setCoowns] = useState<Coownership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCommune, setNewCommune] = useState("");
  const [newTantiemes, setNewTantiemes] = useState(1000);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    listMyOrganizations()
      .then((list) => {
        const syndicOrgs = list.filter((o) => o.org_type === "syndic");
        setOrgs(syndicOrgs);
        if (syndicOrgs.length > 0 && !activeOrgId) setActiveOrgId(syndicOrgs[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"));
  }, [user, activeOrgId]);

  useEffect(() => {
    if (!activeOrgId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listCoownerships(activeOrgId)
      .then(setCoowns)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [activeOrgId]);

  const handleCreate = async () => {
    if (!activeOrgId || !newName.trim()) return;
    try {
      await createCoownership({
        org_id: activeOrgId,
        name: newName.trim(),
        address: newAddress.trim() || undefined,
        commune: newCommune.trim() || undefined,
        total_tantiemes: newTantiemes,
      });
      setNewName(""); setNewAddress(""); setNewCommune(""); setNewTantiemes(1000);
      setShowCreate(false);
      setCoowns(await listCoownerships(activeOrgId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur création");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette copropriété ? Tous les lots associés seront également supprimés.")) return;
    try {
      await deleteCoownership(id);
      setCoowns(await listCoownerships(activeOrgId!));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur suppression");
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-muted">Connectez-vous pour accéder au dashboard syndic.</p>
        <Link href={`${lp}/connexion`} className="mt-4 inline-flex rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
          Se connecter
        </Link>
      </div>
    );
  }

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null;
  const totalLots = coowns.reduce((s, c) => s + (c.nb_lots ?? 0), 0);

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href={`${lp}/syndic`} className="text-xs text-muted hover:text-navy">← Syndic</Link>
            <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Mes copropriétés</h1>
            <p className="mt-1 text-sm text-muted">
              Gestion des copropriétés sous mandat de votre cabinet syndic.
              Chaque copropriété regroupe ses lots avec leurs quotes-parts (millièmes).
            </p>
          </div>
          {orgs.length === 0 && (
            <Link href={`${lp}/profil/organisation`} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
              Créer un cabinet syndic
            </Link>
          )}
        </div>

        {orgs.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-card-border bg-card p-10 text-center">
            <div className="text-4xl">🏢</div>
            <h2 className="mt-3 text-lg font-semibold text-navy">Aucun cabinet syndic</h2>
            <p className="mt-1 text-sm text-muted">
              Créez une organisation de type « Syndic / copropriété » depuis votre profil pour commencer à gérer vos copropriétés.
            </p>
          </div>
        )}

        {orgs.length > 1 && (
          <div className="mt-6 flex items-center gap-2">
            <label className="text-xs text-muted">Cabinet :</label>
            <select value={activeOrgId ?? ""} onChange={(e) => setActiveOrgId(e.target.value)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm">
              {orgs.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
            </select>
          </div>
        )}

        {activeOrg && (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted font-semibold">Copropriétés</div>
                <div className="mt-1 text-2xl font-bold text-navy">{coowns.length}</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted font-semibold">Lots totaux</div>
                <div className="mt-1 text-2xl font-bold text-navy">{totalLots.toLocaleString("fr-LU")}</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted font-semibold">Cabinet</div>
                <div className="mt-1 text-sm font-bold text-navy truncate">{activeOrg.name}</div>
                <div className="mt-0.5 text-xs text-muted">Syndic / copropriété</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-xs uppercase tracking-wider text-muted font-semibold">AG à venir</div>
                <div className="mt-1 text-sm font-bold text-navy">
                  {coowns.filter((c) => c.next_ag_date && new Date(c.next_ag_date) > new Date()).length}
                </div>
                <div className="mt-0.5 text-xs text-muted">dans 3 mois</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy">Copropriétés sous gestion</h2>
              <button onClick={() => setShowCreate(!showCreate)}
                className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light">
                {showCreate ? "Annuler" : "+ Ajouter une copropriété"}
              </button>
            </div>

            {showCreate && (
              <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="text" placeholder="Nom de l'immeuble (ex. Résidence Belair)"
                    value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                  <input type="text" placeholder="Adresse"
                    value={newAddress} onChange={(e) => setNewAddress(e.target.value)}
                    className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                  <input type="text" placeholder="Commune"
                    value={newCommune} onChange={(e) => setNewCommune(e.target.value)}
                    className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                  <input type="number" placeholder="Total tantièmes (souvent 1000 ou 10000)"
                    value={newTantiemes} onChange={(e) => setNewTantiemes(Number(e.target.value) || 1000)}
                    className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                </div>
                <div className="mt-3 flex justify-end">
                  <button onClick={handleCreate} disabled={!newName.trim()}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
                    Créer la copropriété
                  </button>
                </div>
              </div>
            )}

            {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

            {!loading && coowns.length === 0 && !showCreate && (
              <div className="mt-4 rounded-xl border border-dashed border-card-border bg-card p-8 text-center text-sm text-muted">
                Aucune copropriété. Cliquez sur « + Ajouter une copropriété » pour commencer.
              </div>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {coowns.map((c) => (
                <div key={c.id} className="rounded-xl border border-card-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-navy truncate">{c.name}</h3>
                      <div className="mt-1 text-xs text-muted">
                        {c.commune ? `${c.commune} · ` : ""}
                        {c.nb_lots} lot{c.nb_lots !== 1 ? "s" : ""}
                        {c.total_tantiemes !== 1000 ? ` · ${c.total_tantiemes.toLocaleString("fr-LU")} tantièmes` : ""}
                      </div>
                      {c.address && <div className="text-xs text-muted truncate">{c.address}</div>}
                    </div>
                    <button onClick={() => handleDelete(c.id)}
                      className="rounded-md p-1 text-muted hover:text-rose-600 hover:bg-rose-50" title="Supprimer">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" />
                      </svg>
                    </button>
                  </div>

                  {(c.last_ag_date || c.next_ag_date || c.year_built) && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      {c.year_built && (
                        <div className="flex justify-between border-t border-card-border/50 pt-1.5">
                          <span className="text-muted">Année</span>
                          <span className="font-medium text-navy">{c.year_built}</span>
                        </div>
                      )}
                      {c.last_ag_date && (
                        <div className="flex justify-between border-t border-card-border/50 pt-1.5">
                          <span className="text-muted">Dernière AG</span>
                          <span className="font-medium text-navy">{new Date(c.last_ag_date).toLocaleDateString("fr-LU")}</span>
                        </div>
                      )}
                      {c.next_ag_date && (
                        <div className="flex justify-between col-span-2 border-t border-card-border/50 pt-1.5">
                          <span className="text-muted">Prochaine AG</span>
                          <span className="font-medium text-navy">{new Date(c.next_ag_date).toLocaleDateString("fr-LU")}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2 border-t border-card-border pt-3">
                    <Link href={`${lp}/syndic/coproprietes/${c.id}`}
                      className="flex-1 rounded-md bg-navy text-white px-3 py-1.5 text-xs font-medium text-center hover:bg-navy-light">
                      Voir les lots →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
