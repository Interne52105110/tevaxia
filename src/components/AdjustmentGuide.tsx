"use client";

import { ALL_GUIDES, calculerAjustDate, type AdjustmentSuggestion } from "@/lib/adjustments";

interface AdjustmentGuideProps {
  critere: string;
  currentValue: number;
  onApply: (value: number) => void;
  dateVente?: string; // Pour le critère date uniquement
}

function SuggestionRow({ s, isActive, onApply }: { s: AdjustmentSuggestion; isActive: boolean; onApply: (v: number) => void }) {
  return (
    <button
      onClick={() => onApply(s.value)}
      className={`flex items-center justify-between w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
        isActive ? "bg-navy/10 font-semibold text-navy" : "hover:bg-background text-slate"
      }`}
    >
      <span className="flex-1">{s.label}</span>
      <span className="flex items-center gap-2">
        <span className="text-[10px] text-muted">[{s.range[0]} ; {s.range[1]}]</span>
        <span className={`font-mono font-semibold ${s.value > 0 ? "text-success" : s.value < 0 ? "text-error" : "text-muted"}`}>
          {s.value > 0 ? "+" : ""}{s.value}%
        </span>
      </span>
    </button>
  );
}

export default function AdjustmentGuidePanel({ critere, currentValue, onApply, dateVente }: AdjustmentGuideProps) {
  // Cas spécial : indexation date
  if (critere === "date" && dateVente) {
    const { ajustement, detail } = calculerAjustDate(dateVente);
    return (
      <div className="rounded-lg border border-card-border bg-card p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-navy">Indexation temporelle</div>
          <button
            onClick={() => onApply(ajustement)}
            className="rounded bg-navy/10 px-2 py-0.5 text-[10px] font-medium text-navy hover:bg-navy/20 transition-colors"
          >
            Appliquer {ajustement > 0 ? "+" : ""}{ajustement}%
          </button>
        </div>
        <div className="text-[10px] text-muted leading-relaxed">
          <div>Indices STATEC : {detail}</div>
          <div className="mt-1">Variation cumulée depuis la vente du comparable. Positif = le marché a monté depuis la vente → le comparable sous-estime la valeur actuelle.</div>
        </div>
        <div className="mt-2 text-[10px] text-muted italic">Source : STATEC — Indices des prix résidentiels</div>
      </div>
    );
  }

  const guide = ALL_GUIDES.find((g) => g.critere === critere);
  if (!guide) return null;

  return (
    <div className="rounded-lg border border-card-border bg-card p-3 shadow-sm">
      <div className="text-xs font-semibold text-navy mb-1">{guide.description}</div>
      <div className="text-[10px] text-muted mb-2">Réf. : {guide.reference}</div>
      <div className="space-y-0.5">
        {guide.suggestions.map((s) => (
          <SuggestionRow
            key={s.label}
            s={s}
            isActive={currentValue === s.value}
            onApply={onApply}
          />
        ))}
      </div>
      <div className="mt-2 text-[10px] text-muted italic">Source : {guide.source}</div>
    </div>
  );
}
