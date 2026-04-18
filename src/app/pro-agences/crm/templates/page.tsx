"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EMAIL_TEMPLATES, CATEGORY_LABELS, CATEGORY_COLORS,
  renderTemplate, templatesByCategory,
  type EmailTemplate, type TemplateCategory,
} from "@/lib/crm/email-templates";

export default function EmailTemplatesPage() {
  const [filter, setFilter] = useState<TemplateCategory | "all">("all");
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [vars, setVars] = useState<Record<string, string>>({
    prenom: "Marc", nom: "Dupont",
    agence: "Agence Tevaxia",
    agent_nom: "Jean Martin",
    bien: "Appartement 3 chambres, Limpertsberg",
    commune: "Luxembourg",
    prix: "750 000 EUR",
    date_visite: "jeudi 15 à 14h30",
    date_rdv: "jeudi 15 à 14h30",
    signature: "Jean Martin\nAgent immobilier\nAgence Tevaxia\n+352 XX XX XX",
  });

  const byCat = templatesByCategory();
  const filtered = filter === "all" ? EMAIL_TEMPLATES : byCat[filter];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/pro-agences/crm" className="text-xs text-muted hover:text-navy">← CRM</Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Bibliothèque emails types</h1>
      <p className="mt-1 text-sm text-muted">
        10 modèles d&apos;emails pré-rédigés pour les situations commerciales les plus
        fréquentes en immobilier LU. Variables auto-substituées. Ouvre directement
        votre client mail avec mailto: pré-rempli.
      </p>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            filter === "all" ? "bg-navy text-white" : "bg-card border border-card-border text-slate"
          }`}>
          Toutes ({EMAIL_TEMPLATES.length})
        </button>
        {(Object.entries(CATEGORY_LABELS) as [TemplateCategory, string][]).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === k ? "bg-navy text-white" : `${CATEGORY_COLORS[k]}`
            }`}>
            {l} ({byCat[k].length})
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* Liste templates */}
        <div className="space-y-3">
          {filtered.map((t) => (
            <button key={t.id} onClick={() => setSelected(t)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                selected?.id === t.id
                  ? "border-navy bg-navy/5 ring-1 ring-navy"
                  : "border-card-border bg-card hover:bg-background"
              }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_COLORS[t.category]}`}>
                      {CATEGORY_LABELS[t.category]}
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-navy">{t.title}</h3>
                  <p className="mt-0.5 text-xs text-muted">{t.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.variables.map((v) => (
                      <span key={v} className="rounded bg-background px-1.5 py-0.5 text-[9px] font-mono text-muted">
                        {`{${v}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Panel édition/aperçu */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          {selected ? (
            <TemplatePreview
              template={selected}
              vars={vars}
              onChangeVar={(key, val) => setVars({ ...vars, [key]: val })}
            />
          ) : (
            <div className="rounded-xl border-2 border-dashed border-card-border p-8 text-center text-sm text-muted">
              Sélectionnez un modèle à gauche pour personnaliser et envoyer.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Usage :</strong> adaptez les variables à votre contexte (prénom client,
        adresse bien, prix…) puis cliquez "Ouvrir dans mon client mail". Le mailto
        ouvrira Gmail, Outlook ou Apple Mail selon votre config OS avec sujet + corps
        pré-remplis. Les templates sont versionnés dans le code (pas de base de données)
        — demandez un ajout / modif via vos canaux habituels.
      </div>
    </div>
  );
}

function TemplatePreview({ template, vars, onChangeVar }: {
  template: EmailTemplate;
  vars: Record<string, string>;
  onChangeVar: (key: string, val: string) => void;
}) {
  const rendered = renderTemplate(template, vars);
  const [email, setEmail] = useState("");

  const mailtoUrl = () => {
    const addr = email || "destinataire@example.com";
    return `mailto:${addr}?subject=${encodeURIComponent(rendered.subject)}&body=${encodeURIComponent(rendered.body)}`;
  };

  const copyBody = async () => {
    try {
      await navigator.clipboard.writeText(rendered.body);
      alert("Corps du mail copié ✓");
    } catch {
      // fallback
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 space-y-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Modèle sélectionné</div>
        <h3 className="mt-0.5 text-sm font-bold text-navy">{template.title}</h3>
      </div>

      {/* Variables */}
      <div className="border-t border-card-border pt-3">
        <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
          Variables
        </div>
        <div className="grid grid-cols-2 gap-2">
          {template.variables.map((v) => (
            <label key={v} className="text-[10px]">
              <span className="text-muted font-mono">{`{${v}}`}</span>
              <input type="text" value={vars[v] ?? ""}
                onChange={(e) => onChangeVar(v, e.target.value)}
                className="mt-0.5 w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
            </label>
          ))}
        </div>
      </div>

      {/* Email destinataire */}
      <div className="border-t border-card-border pt-3">
        <label className="text-[10px]">
          <span className="text-muted font-semibold uppercase tracking-wider">Email destinataire</span>
          <input type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="destinataire@example.com"
            className="mt-0.5 w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-xs" />
        </label>
      </div>

      {/* Preview */}
      <div className="border-t border-card-border pt-3">
        <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">Aperçu</div>
        <div className="rounded border border-card-border/50 bg-background p-3 text-xs">
          <div className="font-semibold text-navy mb-1">{rendered.subject}</div>
          <pre className="whitespace-pre-wrap font-sans text-slate text-[11px] leading-relaxed max-h-64 overflow-y-auto">
            {rendered.body}
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-card-border pt-3 flex gap-2">
        <a href={mailtoUrl()}
          className="flex-1 rounded-lg bg-navy px-3 py-2 text-center text-xs font-semibold text-white hover:bg-navy-light">
          📧 Ouvrir dans mon mail
        </a>
        <button onClick={copyBody}
          className="rounded-lg border border-navy bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-navy/5">
          📋 Copier
        </button>
      </div>
    </div>
  );
}
