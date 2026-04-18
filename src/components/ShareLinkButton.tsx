"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { buildSharedLinkUrl, createSharedLink, type SharedToolType } from "@/lib/shared-links";
import { errMsg } from "@/lib/errors";

interface Props {
  toolType: SharedToolType;
  payload: Record<string, unknown>;
  defaultTitle?: string;
  className?: string;
}

export default function ShareLinkButton({ toolType, payload, defaultTitle, className }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [maxViews, setMaxViews] = useState<number | "">("");
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [copied, setCopied] = useState(false);

  if (!isSupabaseConfigured || !user) return null;

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    setCreatedUrl(null);
    try {
      const link = await createSharedLink({
        tool_type: toolType,
        payload,
        title: title.trim() || undefined,
        max_views: maxViews === "" ? undefined : Number(maxViews),
        expires_in_days: expiresInDays,
      });
      setCreatedUrl(buildSharedLinkUrl(link.token));
    } catch (e) {
      setError(errMsg(e, "Erreur lors de la création du lien."));
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    if (!createdUrl) return;
    await navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={className}>
      <button
        onClick={() => { setOpen(!open); setCreatedUrl(null); setError(null); }}
        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
        Partager un lien public
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          {!createdUrl ? (
            <>
              <h3 className="text-sm font-semibold text-navy">Créer un lien de partage</h3>
              <p className="mt-1 text-xs text-muted">Le bénéficiaire verra une vue read-only sans avoir besoin de compte.</p>

              <div className="mt-4 grid gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate mb-1">Titre (optionnel)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex. Bilan résidence Belair — investisseur Z"
                    className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">Validité (jours)</label>
                    <input
                      type="number"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(Math.max(1, Math.min(365, Number(e.target.value) || 30)))}
                      min={1}
                      max={365}
                      className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate mb-1">Limite de vues (optionnel)</label>
                    <input
                      type="number"
                      value={maxViews}
                      onChange={(e) => setMaxViews(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))}
                      placeholder="∞"
                      min={1}
                      className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {error && <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">{error}</div>}

              <button
                onClick={handleCreate}
                disabled={loading}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:bg-muted"
              >
                {loading ? "Création…" : "Générer le lien"}
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-emerald-800">Lien créé</h3>
              <p className="mt-1 text-xs text-muted">Transmettez ce lien à votre interlocuteur. Vous pourrez le révoquer depuis votre profil.</p>
              <div className="mt-3 flex gap-2">
                <code className="flex-1 break-all rounded-lg bg-background border border-card-border p-2 text-xs">{createdUrl}</code>
                <button onClick={copyUrl} className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
                  {copied ? "Copié ✓" : "Copier"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
