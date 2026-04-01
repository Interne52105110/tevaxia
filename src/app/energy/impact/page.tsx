"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { calculerImpact, type ImpactResponse, type ClasseImpact } from "@/lib/energy-api";

const CLASSES = ["A", "B", "C", "D", "E", "F", "G"] as const;

const IMPACT_ENERGIE: Record<string, number> = {
  A: 5, B: 3, C: 1, D: 0, E: -3, F: -6, G: -10,
};

const CLASS_COLORS: Record<string, string> = {
  A: "bg-green-600 text-white",
  B: "bg-green-500 text-white",
  C: "bg-lime-500 text-white",
  D: "bg-yellow-400 text-gray-900",
  E: "bg-orange-400 text-white",
  F: "bg-orange-600 text-white",
  G: "bg-red-600 text-white",
};

function fmt(n: number): string {
  return n.toLocaleString("fr-LU", { maximumFractionDigits: 0 });
}

function fallbackLocal(valeur: number, classeActuelle: string): ImpactResponse {
  const pctActuelle = IMPACT_ENERGIE[classeActuelle] || 0;
  const valeurBase = valeur / (1 + pctActuelle / 100);
  const classes: ClasseImpact[] = CLASSES.map((c) => {
    const pct = IMPACT_ENERGIE[c];
    const valeurAjustee = Math.round(valeurBase * (1 + pct / 100));
    return { classe: c, ajustementPct: pct, valeurAjustee, delta: valeurAjustee - valeur };
  });
  return { valeurBase: Math.round(valeurBase), classeActuelle, classes };
}

export default function ImpactPage() {
  const t = useTranslations("energy.impact");
  const [valeur, setValeur] = useState(750000);
  const [classeActuelle, setClasseActuelle] = useState("D");
  const [result, setResult] = useState<ImpactResponse>(fallbackLocal(750000, "D"));
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  const compute = useCallback(async (v: number, c: string) => {
    try {
      const data = await calculerImpact({ valeurBien: v, classeActuelle: c });
      setResult(data);
      setApiOk(true);
    } catch {
      setResult(fallbackLocal(v, c));
      setApiOk(false);
    }
  }, []);

  useEffect(() => { compute(valeur, classeActuelle); }, [valeur, classeActuelle, compute]);

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("description")}</p>
          {apiOk === false && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
              {t("localFallback")}
            </div>
          )}
          {apiOk === true && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-energy bg-energy/5 border border-energy/20 rounded-lg px-3 py-1">
              {t("apiConnected")}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm mb-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("valeurBien")}</label>
              <div className="relative">
                <input type="number" value={valeur} onChange={(e) => setValeur(Number(e.target.value))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 pr-10 text-foreground" min={50000} step={10000} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("classeActuelle")}</label>
              <div className="flex gap-1.5">
                {CLASSES.map((c) => (
                  <button key={c} onClick={() => setClasseActuelle(c)}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                      classeActuelle === c ? `${CLASS_COLORS[c]} ring-2 ring-offset-2 ring-energy` : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
            <h2 className="font-semibold text-foreground">{t("resultTitle")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left">
                  <th className="px-6 py-3 font-medium text-muted">{t("classe")}</th>
                  <th className="px-6 py-3 font-medium text-muted text-right">{t("ajustement")}</th>
                  <th className="px-6 py-3 font-medium text-muted text-right">{t("valeurAjustee")}</th>
                  <th className="px-6 py-3 font-medium text-muted text-right">{t("delta")}</th>
                </tr>
              </thead>
              <tbody>
                {result.classes.map((c) => {
                  const isActive = c.classe === classeActuelle;
                  return (
                    <tr key={c.classe} className={`border-b border-card-border last:border-0 transition-colors ${isActive ? "bg-energy/10" : "hover:bg-gray-50"}`}>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${CLASS_COLORS[c.classe]}`}>{c.classe}</span>
                        {isActive && <span className="ml-2 text-xs text-energy font-medium">{t("actuelle")}</span>}
                      </td>
                      <td className="px-6 py-3 text-right font-mono">
                        <span className={c.ajustementPct > 0 ? "text-green-600" : c.ajustementPct < 0 ? "text-red-600" : "text-muted"}>
                          {c.ajustementPct > 0 ? "+" : ""}{c.ajustementPct}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-semibold">{fmt(c.valeurAjustee)} €</td>
                      <td className="px-6 py-3 text-right font-mono">
                        {c.delta === 0 ? <span className="text-muted">—</span> : (
                          <span className={c.delta > 0 ? "text-green-600" : "text-red-600"}>
                            {c.delta > 0 ? "+" : ""}{fmt(c.delta)} €
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 text-xs text-muted">{t("classeRef")} · {t("source")}</div>
        </div>
      </div>
    </div>
  );
}
