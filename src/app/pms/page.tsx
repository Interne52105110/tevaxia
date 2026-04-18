"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listMyProperties } from "@/lib/pms/properties";
import type { PmsProperty, PmsPropertyType } from "@/lib/pms/types";

export default function PmsHomePage() {
  const tc = useTranslations("pms.common");
  const tt = useTranslations("pms.types");
  const t = useTranslations("pms.home");
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<PmsProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    void listMyProperties().then((list) => {
      setProperties(list);
      setLoading(false);
    });
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{tc("loading")}</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")} — {t("subtitle")}</h1>
        <p className="mt-4 text-sm text-muted">{t("intro")}</p>
        <div className="mt-6">
          <Link
            href="/connexion"
            className="inline-flex items-center rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-light"
          >
            {t("loginCta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <Link
          href="/pms/proprietes/nouveau"
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-light"
        >
          {t("newProperty")}
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-card-border bg-card/50 p-10 text-center">
          <h2 className="text-lg font-semibold text-navy">{t("emptyTitle")}</h2>
          <p className="mt-2 text-sm text-muted max-w-xl mx-auto">{t("emptyDesc")}</p>
          <Link
            href="/pms/proprietes/nouveau"
            className="mt-4 inline-flex items-center rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-light"
          >
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/pms/${p.id}`}
              className="rounded-xl border border-card-border bg-card p-5 hover:border-navy transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-navy">{p.name}</h3>
                <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-medium text-navy whitespace-nowrap">
                  {tt(p.property_type as PmsPropertyType)}
                </span>
              </div>
              {p.commune && <div className="mt-1 text-xs text-muted">{p.commune}</div>}
              <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
                <span>{t("vatLabel")} {p.tva_rate}%</span>
                {p.taxe_sejour_eur && p.taxe_sejour_eur > 0 ? (
                  <span>{t("taxeSejourLabel")} {p.taxe_sejour_eur} €</span>
                ) : null}
                <span className="ml-auto font-mono">{p.currency}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Informations LU */}
      <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <h3 className="font-semibold">{t("compliance")}</h3>
        <ul className="mt-2 space-y-1 text-xs list-disc list-inside">
          <li>{t("complianceTva")}</li>
          <li>{t("complianceFb")}</li>
          <li>{t("complianceTaxe")}</li>
          <li>{t("complianceInvoice")}</li>
          <li>{t("complianceRgpd")}</li>
          <li>{t("complianceIcal")}</li>
        </ul>
      </section>
    </div>
  );
}
