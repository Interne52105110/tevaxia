"use client";
import { useTranslations } from "next-intl";
import EstimationMethod from "@/components/EstimationMethod";
import { MODEL_COEFFICIENTS } from "@/lib/estimation";
export function TransparenceClient() {
  const t = useTranslations("estimationAudit");
  return <main className="py-8">
    <div className="mx-auto max-w-5xl px-4">
      <h1 className="text-2xl font-bold text-navy">{t("title")}</h1>
      <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm">{t("assumptions")}</p>
    </div>
    <EstimationMethod />
    <section className="mx-auto max-w-5xl px-4">
      <h2 className="text-lg font-semibold">{t("adjustments")}</h2>
      <table className="mt-4 w-full text-sm">
        <thead><tr className="border-b"><th className="p-2 text-left">{t("parameter")}</th><th className="p-2 text-right">{t("adjustment")}</th></tr></thead>
        <tbody>{MODEL_COEFFICIENTS.map(c => <tr className="border-b" key={c.feature}><td className="p-2">{c.feature}</td><td className="p-2 text-right">{c.coefficient}</td></tr>)}</tbody>
      </table>
    </section>
  </main>;
}
