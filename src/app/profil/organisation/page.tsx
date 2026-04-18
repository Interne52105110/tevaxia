"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import OrgAgencyStats from "@/components/OrgAgencyStats";
import {
  acceptInvitationToken,
  buildInvitationLink,
  createOrganization,
  deleteInvitation,
  inviteMember,
  listMembers,
  listMyOrganizations,
  listPendingInvitations,
  rolesForOrgType,
  type Organization,
  type OrgInvitation,
  type OrgMember,
  type OrgRole,
  type OrgType,
} from "@/lib/orgs";
import { errMsg } from "@/lib/errors";

const ROLE_LABEL: Record<OrgRole, string> = {
  admin: "Admin",
  member: "Négociateur",
  viewer: "Lecture seule",
  syndic: "Syndic",
  conseil_syndical: "Conseil syndical",
  coproprietaire: "Copropriétaire",
  locataire: "Locataire",
  prestataire: "Prestataire",
  hotel_owner: "Propriétaire hôtel",
  hotel_director: "Directeur d'exploitation",
  revenue_manager: "Revenue manager",
  fb_manager: "Responsable F&B",
  reception: "Réception",
};

const ORG_TYPE_LABEL: Record<OrgType, { label: string; desc: string; accent: string }> = {
  agency: { label: "Agence immobilière", desc: "Vente/location, mandats, rapports co-brandés.", accent: "from-rose-500 to-rose-700" },
  syndic: { label: "Syndic / copropriété", desc: "Gestion copropriétés, règle des 5 %, appels de fonds.", accent: "from-teal-600 to-emerald-700" },
  hotel_group: { label: "Groupe hôtelier", desc: "Multi-hôtels, RevPAR, EBITDA, owner reports.", accent: "from-purple-600 to-purple-800" },
  bank: { label: "Banque / institution", desc: "Valorisation MLV, LTV, API d'estimation.", accent: "from-slate-700 to-slate-900" },
  other: { label: "Autre", desc: "Usage générique, à préciser.", accent: "from-amber-500 to-amber-700" },
};

export default function OrgPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user, loading: authLoading } = useAuth();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgType, setNewOrgType] = useState<OrgType>("agency");
  const [newOrgPhone, setNewOrgPhone] = useState("");
  const [newOrgVat, setNewOrgVat] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("member");
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const reloadOrgs = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listMyOrganizations();
      setOrgs(list);
      if (!activeOrgId && list.length > 0) {
        setActiveOrgId(list[0].id);
      } else if (activeOrgId && !list.some((o) => o.id === activeOrgId)) {
        setActiveOrgId(list[0]?.id ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  const reloadMembersAndInvites = useCallback(async (orgId: string) => {
    try {
      const [m, inv] = await Promise.all([listMembers(orgId), listPendingInvitations(orgId)]);
      setMembers(m);
      setInvitations(inv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    }
  }, []);

  useEffect(() => {
    if (user) reloadOrgs();
  }, [user, reloadOrgs]);

  useEffect(() => {
    if (activeOrgId) reloadMembersAndInvites(activeOrgId);
  }, [activeOrgId, reloadMembersAndInvites]);

  if (authLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-muted">Chargement…</div>;
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-lg font-semibold">Supabase non configuré</h2>
          <p className="mt-2 text-sm">La gestion d&apos;agences nécessite Supabase. Configurez les variables d&apos;environnement <code>NEXT_PUBLIC_SUPABASE_URL</code> et <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> et appliquez la migration SQL <code>003_create_organizations.sql</code>.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="rounded-xl border border-card-border bg-card p-8">
          <h2 className="text-lg font-semibold text-navy">Connexion requise</h2>
          <p className="mt-2 text-sm text-muted">Connectez-vous pour gérer votre agence.</p>
          <Link href={`${lp}/connexion`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null;

  const handleCreate = async () => {
    if (!newOrgName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createOrganization({
        name: newOrgName.trim(),
        org_type: newOrgType,
        contact_phone: newOrgPhone.trim() || undefined,
        vat_number: newOrgVat.trim() || undefined,
      });
      setNewOrgName("");
      setNewOrgType("agency");
      setNewOrgPhone("");
      setNewOrgVat("");
      setShowCreate(false);
      setActiveOrgId(created.id);
      await reloadOrgs();
    } catch (e) {
      setError(errMsg(e, "Erreur de création."));
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!activeOrgId || !inviteEmail.trim()) return;
    setLoading(true);
    setError(null);
    setLastInviteLink(null);
    try {
      const inv = await inviteMember(activeOrgId, inviteEmail.trim(), inviteRole);
      setLastInviteLink(buildInvitationLink(inv.token));
      setInviteEmail("");
      await reloadMembersAndInvites(activeOrgId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if (!activeOrgId) return;
    try {
      await deleteInvitation(id);
      await reloadMembersAndInvites(activeOrgId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur suppression.");
    }
  };

  const myRole = activeOrgId ? members.find((m) => m.user_id === user.id)?.role : undefined;
  const isAdmin = myRole === "admin";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Mon agence</h1>
          <p className="mt-1 text-sm text-muted">Gérez vos agences immobilières et invitez vos négociateurs.</p>
        </div>
        <Link href={`${lp}/profil`} className="text-sm text-muted hover:text-navy">← Profil</Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      )}

      {/* Org switcher + create */}
      <div className="mb-8 rounded-xl border border-card-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-navy">Agence active :</span>
          {orgs.length === 0 ? (
            <span className="text-sm text-muted italic">aucune agence</span>
          ) : (
            <select
              value={activeOrgId ?? ""}
              onChange={(e) => setActiveOrgId(e.target.value || null)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="ml-auto rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light"
          >
            + Créer une organisation
          </button>
        </div>

        {showCreate && (
          <div className="mt-4 border-t border-card-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Type d&apos;organisation</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {(Object.keys(ORG_TYPE_LABEL) as OrgType[]).map((key) => {
                const info = ORG_TYPE_LABEL[key];
                const selected = newOrgType === key;
                return (
                  <button
                    key={key}
                    onClick={() => setNewOrgType(key)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      selected ? "border-navy bg-navy/5" : "border-card-border bg-background hover:bg-slate-50"
                    }`}
                  >
                    <div className={`inline-flex h-6 rounded-full bg-gradient-to-br ${info.accent} px-2 py-0.5 text-[10px] font-semibold text-white items-center`}>
                      {info.label}
                    </div>
                    <p className="mt-1.5 text-xs text-muted leading-snug">{info.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder={
                  newOrgType === "syndic" ? "Nom du cabinet syndic"
                    : newOrgType === "hotel_group" ? "Nom du groupe hôtelier"
                    : newOrgType === "bank" ? "Nom de la banque ou institution"
                    : "Nom de l'organisation"
                }
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Téléphone (optionnel)"
                value={newOrgPhone}
                onChange={(e) => setNewOrgPhone(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="N° TVA (optionnel)"
                value={newOrgVat}
                onChange={(e) => setNewOrgVat(e.target.value)}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
              <button
                onClick={handleCreate}
                disabled={loading || !newOrgName.trim()}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-muted"
              >
                Créer l&apos;organisation
              </button>
            </div>
          </div>
        )}
      </div>

      {activeOrg && (
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy">{activeOrg.name}</h2>
            <div className="mt-1 text-xs text-muted">
              Slug : <code>{activeOrg.slug}</code> · Mon rôle : <strong>{ROLE_LABEL[myRole ?? "viewer"]}</strong>
            </div>
            {activeOrg.contact_email && (
              <div className="mt-1 text-xs text-muted">Contact : {activeOrg.contact_email}</div>
            )}
          </div>

          {activeOrg.org_type === "agency" && myRole === "admin" && (
            <OrgAgencyStats orgId={activeOrg.id} />
          )}

          {/* Members */}
          <div className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy">Membres ({members.length})</h2>
            <ul className="mt-3 divide-y divide-card-border/50">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-medium text-navy">{m.user_id === user.id ? "Vous" : m.user_id.slice(0, 8) + "…"}</span>
                    <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-navy">{ROLE_LABEL[m.role]}</span>
                  </div>
                  <span className="text-xs text-muted">depuis {new Date(m.joined_at).toLocaleDateString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Invite form */}
          {isAdmin && (
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h2 className="text-base font-semibold text-navy">Inviter un négociateur</h2>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <input
                  type="email"
                  placeholder="email@exemple.lu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 min-w-[200px] rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                  className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                >
                  {rolesForOrgType(activeOrg?.org_type ?? "agency").map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
                <button
                  onClick={handleInvite}
                  disabled={loading || !inviteEmail.trim()}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:bg-muted"
                >
                  Inviter
                </button>
              </div>

              {lastInviteLink && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs">
                  <div className="font-medium text-emerald-900">Lien d&apos;invitation à transmettre :</div>
                  <code className="mt-1 block break-all text-emerald-800">{lastInviteLink}</code>
                  <div className="mt-1 text-emerald-700">Envoyez ce lien par email ou messagerie. Valable 14 jours.</div>
                </div>
              )}

              {invitations.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Invitations en attente</h3>
                  <ul className="mt-2 divide-y divide-card-border/50">
                    {invitations.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between py-2 text-sm">
                        <div>
                          <span className="font-medium text-navy">{inv.email}</span>
                          <span className="ml-2 text-xs text-muted">{ROLE_LABEL[inv.role]}</span>
                          <span className="ml-2 text-xs text-muted">expire le {new Date(inv.expires_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(buildInvitationLink(inv.token))}
                            className="text-xs text-navy hover:underline"
                          >
                            Copier lien
                          </button>
                          <button
                            onClick={() => handleDeleteInvite(inv.id)}
                            className="text-xs text-rose-700 hover:underline"
                          >
                            Annuler
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const __notUsed = { acceptInvitationToken };
