"use client";
import { useTranslations } from "next-intl";
import { MARKET_SOURCES } from "@/lib/market-data";
export default function EstimationMethod() {
  const t = useTranslations("estimationAudit");
  return <section className="mx-auto max-w-5xl px-4 py-8 text-sm space-y-4">
    <h2 className="text-xl font-semibold text-navy">{t("method")}</h2>
    <p>{t("limits")}</p><p>{t("formula")}</p><p>{t("vefa")}</p>
    <h3 className="font-semibold">{t("sources")}</h3><p>{t("period")}</p>
    <ul className="list-disc pl-5 space-y-2">{Object.entries(MARKET_SOURCES).map(([key, url]) =>
      <li key={key}><a className="underline break-words" href={url} target="_blank" rel="noopener noreferrer">{t(key)}</a></li>
    )}</ul><p>{t("suppression")}</p>
  </section>;
}
