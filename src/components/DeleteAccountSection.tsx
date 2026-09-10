"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { deleteOwnAccount } from "@/lib/delete-own-account";
import { markDeletedAuthOwner } from "@/lib/deleted-auth-owner";

export default function DeleteAccountSection() {
  const { user } = useAuth();
  return user && supabase ? <DeleteAccountForm key={user.id} owner={user.id} email={user.email ?? user.id} /> : null;
}

function DeleteAccountForm({ owner, email }: { owner: string; email: string }) {
  const t = useTranslations("profil.deleteAccount");
  const running = useRef(false);
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expected = t("confirmToken");

  const handleDelete = async () => {
    if (running.current || !live.current) return;
    if (typed !== expected) {
      setError(t("typeWrong"));
      return;
    }
    running.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await deleteOwnAccount(owner, () => live.current);
      markDeletedAuthOwner(owner, { complete: t("deletedNotice"), partial: t("deletedPartialNotice") }, result.localCleanupComplete);
    } catch {
      if (live.current) { setError(t("notConfirmed")); setTyped(""); }
    } finally {
      running.current = false;
      if (live.current) setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-6">
      <h2 className="text-base font-semibold text-rose-900">{t("title")}</h2>
      <p className="mt-1 text-xs text-rose-800 leading-relaxed">{t("desc")}</p>

      <p className="mt-2 break-all text-sm font-semibold text-rose-900">{t("targetAccount", { email })}</p>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
        >
          {t("ctaOpen")}
        </button>
      ) : (
        <fieldset disabled={loading} className="mt-4 min-w-0 rounded-lg border border-rose-200 bg-white p-4">
          <p className="text-sm font-semibold text-rose-900">{t("confirmTitle")}</p>
          <p className="mt-1 text-xs text-rose-800">{t("confirmDesc", { token: expected })}</p>
          <input
            type="text"
            aria-label={t("confirmTitle")}
            autoComplete="off"
            value={typed}
            onChange={(e) => { setTyped(e.target.value); setError(null); }}
            placeholder={expected}
            className="mt-3 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-mono"
          />
          {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => { setOpen(false); setTyped(""); setError(null); }}
              className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || typed !== expected}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? t("deleting") : t("confirmCta")}
            </button>
          </div>
        </fieldset>
      )}
    </div>
  );
}
