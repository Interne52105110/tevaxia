"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useLocale, useTranslations } from "next-intl";
import { validateInvoiceForExport } from "@/lib/facturation/export-validation";
import { SUPPORTED_INVOICE_PROFILES } from "@/lib/facturation/invoice-validation";
import { computeTotals, type FacturXInvoice, type FacturXLine, type VatCategoryCode } from "@/lib/facturation/factur-x";
import { assertHistoryOwner, saveToHistory } from "@/lib/facturation/history";
import { track, captureError } from "@/lib/analytics";

import { invoiceDraftKey, LEGACY_INVOICE_DRAFT_KEY, parseInvoiceDraft, storeInvoiceDraft } from "@/lib/facturation/draft";
import { invoiceDate, addInvoiceDays, blankInvoiceLine as blankLine, applyInvoiceTemplate, type TemplateId } from "@/lib/facturation/templates";

function formatEUR(n: number, currency = "EUR", locale = "fr"): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

function defaultInvoice(): FacturXInvoice {
  const today = invoiceDate();
  return {
    profile: "BASIC",
    document_type: "380",
    invoice_number: "",
    issue_date: today,
    due_date: addInvoiceDays(today, 30),
    currency: "EUR",
    seller: { name: "", country_code: "LU" },
    buyer: { name: "", country_code: "LU" },
    lines: [blankLine()],
    notes: [],
  };
}

export default function EmissionPage() {
  const { user, loading } = useAuth();
  const t = useTranslations("facturation.historique");
  if (loading) return <div className="p-12 text-center">{t("loading")}</div>;
  return <InvoiceEditor key={user?.id ?? "guest"} userId={user?.id ?? null} />;
}

function InvoiceEditor({ userId }: { userId: string | null }) {
  const t = useTranslations("facturation.emission");
  const tHist = useTranslations("facturation.historique");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [inv, setInv] = useState<FacturXInvoice>(defaultInvoice());
  const [hydrated, setHydrated] = useState(false);
  const [template, setTemplate] = useState<TemplateId>("generic");
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const td = useTranslations("invoiceDraft");
  const tt = useTranslations("invoiceTemplate");
  const [storageError, setStorageError] = useState<string | null>(null);
  const [legacy, setLegacy] = useState(false);
  const [backupKey, setBackupKey] = useState(invoiceDraftKey(userId));
  const [allowSave, setAllowSave] = useState(true);
  const active = useRef(false), operation = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    try {
      setLegacy(localStorage.getItem(LEGACY_INVOICE_DRAFT_KEY) !== null);
      const raw = localStorage.getItem(invoiceDraftKey(userId));
      if (raw !== null) setInv(parseInvoiceDraft(raw));
    } catch { setStorageError(td("readError")); setAllowSave(false); }
    setHydrated(true);
  }, [userId, td]);
  useEffect(() => {
    if (!hydrated || !allowSave) return;
    try { storeInvoiceDraft(inv, userId); setStorageError(null); }
    catch { setStorageError(td("saveError")); }
  }, [inv, hydrated, allowSave, userId, td]);
  const restoreLegacy = () => {
    if (!confirm(td("legacyConfirm"))) return;
    try {
      const raw = localStorage.getItem(LEGACY_INVOICE_DRAFT_KEY);
      if (raw === null) throw new Error("Missing legacy draft");
      setInv(parseInvoiceDraft(raw)); setAllowSave(true); setLegacy(false);
    } catch { setBackupKey(LEGACY_INVOICE_DRAFT_KEY); setStorageError(td("readError")); }
  };
  const backupDraft = () => {
    try {
      const raw = localStorage.getItem(backupKey);
      if (raw === null) return;
      const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = "tevaxia-brouillon-original.json"; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setStorageError(td("readError")); }
  };

  const totals = useMemo(() => { try { return computeTotals(inv); } catch { return null; } }, [inv]);
  const validation = useMemo(() => validateInvoiceForExport(inv), [inv]);

  const setSeller = <K extends keyof FacturXInvoice["seller"]>(k: K, v: FacturXInvoice["seller"][K]) => {
    setInv({ ...inv, seller: { ...inv.seller, [k]: v } });
  };
  const setBuyer = <K extends keyof FacturXInvoice["buyer"]>(k: K, v: FacturXInvoice["buyer"][K]) => {
    setInv({ ...inv, buyer: { ...inv.buyer, [k]: v } });
  };
  const setField = <K extends keyof FacturXInvoice>(k: K, v: FacturXInvoice[K]) => {
    setInv({ ...inv, [k]: v });
  };
  const updateLine = (idx: number, patch: Partial<FacturXLine>) => {
    setInv({ ...inv, lines: inv.lines.map((l, i) => i === idx ? { ...l, ...patch } : l) });
  };
  const addLine = () => setInv({ ...inv, lines: [...inv.lines, { ...blankLine(), id: String(inv.lines.length + 1) }] });
  const removeLine = (idx: number) => setInv({ ...inv, lines: inv.lines.filter((_, i) => i !== idx) });

  const applyTpl = (tpl: TemplateId) => {
    setTemplate(tpl);
    setInv(applyInvoiceTemplate(tpl, inv, key => tt(key)));
  };

  const resetAll = () => {
    if (!confirm(t("resetConfirm"))) return;
    setAllowSave(true); setStorageError(null);
    setInv(defaultInvoice());
    setTemplate("generic");
  };

  const generate = async () => {
    if (operation.current || !active.current) return;
    const historyOwner = userId;
    if (!totals) { setErrors([t("calculationError")]); return; }
    const errs = validateInvoiceForExport(inv);
    if (errs.length) {
      setErrors(errs.map((e) => `${e.rule}: ${e.message}`));
      setSuccess(null);
      return;
    }
    setErrors([]);
    operation.current = true;
    setGenerating(true);
    try {
      const { generateFacturXPdf } = await import("@/lib/facturation/factur-x-pdf");
      const artifacts = await generateFacturXPdf(inv, { locale });
      if (historyOwner) await assertHistoryOwner(historyOwner);
      if (!active.current) return;
      // Download PDF
      const pdfBlob = new Blob([artifacts.pdfBytes as BlobPart], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const a1 = document.createElement("a");
      a1.href = pdfUrl; a1.download = artifacts.pdfFilename;
      document.body.appendChild(a1); a1.click(); document.body.removeChild(a1);
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      // Download XML
      const xmlBlob = new Blob([artifacts.xml], { type: "application/xml" });
      const xmlUrl = URL.createObjectURL(xmlBlob);
      const a2 = document.createElement("a");
      a2.href = xmlUrl; a2.download = artifacts.xmlFilename;
      document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
      setTimeout(() => URL.revokeObjectURL(xmlUrl), 1000);
      // Sauvegarde historique (silencieux si non-auth)
      void saveToHistory(inv, template, historyOwner).catch(() => { if (active.current) setErrors([tHist("saveError")]); });
      track("facturation_generated", {
        template,
        currency: inv.currency,
        nb_lines: inv.lines.length,
        seller_country: inv.seller.country_code,
        buyer_country: inv.buyer.country_code,
        total_ttc: totals.grand_total,
      });
      setSuccess(t("successMsg"));
    } catch (e) {
      captureError(e, { module: "facturation", action: "generate", template, profile: inv.profile });
      if (active.current) setErrors([(e as Error).message]);
    } finally {
      operation.current = false;
      if (active.current) setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <fieldset disabled={generating} className="min-w-0">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`${lp}/facturation`} className="text-xs text-muted hover:text-navy">← {t("backLanding")}</Link>
          <h1 className="text-2xl font-bold text-navy mt-1">{t("title")}</h1>
          <p className="text-sm text-muted mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`${lp}/facturation/historique`}
            className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate hover:bg-background">
            📋 {tHist("title")}
          </Link>
          <button onClick={resetAll}
            className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate hover:bg-background">
            {t("reset")}
          </button>
        </div>
      </div>

      {storageError && <div role="alert" className="mb-4 rounded border border-rose-300 bg-rose-50 p-4 text-rose-900">{storageError} <button type="button" onClick={backupDraft} className="underline">{td("backup")}</button></div>}
      {legacy && <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-4 text-amber-950">{td("legacy")} <button type="button" onClick={restoreLegacy} className="underline">{td("restore")}</button></div>}
      {!totals && <p role="alert" className="mb-4 text-sm text-red-700">{t("calculationError")}</p>}
      {/* Template selector */}
      <div className="mb-5 rounded-xl border border-card-border bg-card p-4">
        <div className="text-xs uppercase tracking-wider font-bold text-navy mb-3">{t("template.label")}</div>
        <p className="mb-3 text-sm text-slate">{tt("scope")}</p>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {(["generic", "landlord", "syndic", "hotel", "lease", "valuer"] as TemplateId[]).map((tpl) => (
            <button key={tpl} onClick={() => applyTpl(tpl)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                template === tpl ? "border-navy bg-navy text-white" : "border-card-border bg-background hover:border-navy/50 text-slate"
              }`}>
              {t(`template.${tpl}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Invoice header */}
          <Section title={t("sections.invoice")}>
            <div className="grid gap-3 sm:grid-cols-3">
              <SelectField label={t("fields.profile")} value={inv.profile}
                options={SUPPORTED_INVOICE_PROFILES.map(profile => ({ v: profile, l: profile.replaceAll("_", " ") }))}
                onChange={(v) => setField("profile", v as FacturXInvoice["profile"])} />
              <Field label={t("fields.invoiceNumber")} value={inv.invoice_number}
                onChange={(v) => setField("invoice_number", v)} />
              <Field label={t("fields.issueDate")} type="date" value={inv.issue_date}
                onChange={(v) => setField("issue_date", v)} />
              <Field label={t("fields.dueDate")} type="date" value={inv.due_date ?? ""}
                onChange={(v) => setField("due_date", v)} />
              <Field label={t("fields.buyerReference")} value={inv.buyer_reference ?? ""}
                onChange={(v) => setField("buyer_reference", v)} />
              <Field label={t("fields.contractReference")} value={inv.contract_reference ?? ""}
                onChange={(v) => setField("contract_reference", v)} />
              <SelectField label={t("fields.currency")} value={inv.currency}
                options={[{ v: "EUR", l: "EUR (€)" }, { v: "CHF", l: "CHF" }]}
                onChange={(v) => setField("currency", v)} />
            </div>
          </Section>

          {/* Seller */}
          <Section title={t("sections.seller")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("fields.name")} value={inv.seller.name}
                onChange={(v) => setSeller("name", v)} required />
              <Field label={t("fields.legalId")} value={inv.seller.legal_id ?? ""}
                onChange={(v) => setSeller("legal_id", v)} placeholder="SIREN / RCS" />
              <Field label={t("fields.taxId")} value={inv.seller.tax_id ?? ""}
                onChange={(v) => setSeller("tax_id", v)} />
              <Field label={t("fields.vatId")} value={inv.seller.vat_id ?? ""}
                onChange={(v) => setSeller("vat_id", v)} placeholder="FR12345678901" />
              <SelectField label={t("fields.country")} value={inv.seller.country_code}
                options={[
                  { v: "FR", l: "France" }, { v: "LU", l: "Luxembourg" },
                  { v: "BE", l: "Belgique" }, { v: "DE", l: "Deutschland" },
                  { v: "NL", l: "Nederland" }, { v: "IT", l: "Italia" }, { v: "ES", l: "España" },
                ]}
                onChange={(v) => setSeller("country_code", v)} />
              <Field label={t("fields.address")} value={inv.seller.address_line1 ?? ""}
                onChange={(v) => setSeller("address_line1", v)} />
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <Field label={t("fields.postcode")} value={inv.seller.postcode ?? ""}
                  onChange={(v) => setSeller("postcode", v)} />
                <Field label={t("fields.city")} value={inv.seller.city ?? ""}
                  onChange={(v) => setSeller("city", v)} />
              </div>
            </div>
          </Section>

          {/* Buyer */}
          <Section title={t("sections.buyer")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("fields.name")} value={inv.buyer.name}
                onChange={(v) => setBuyer("name", v)} required />
              <Field label={t("fields.vatId")} value={inv.buyer.vat_id ?? ""}
                onChange={(v) => setBuyer("vat_id", v)} />
              <Field label={t("fields.address")} value={inv.buyer.address_line1 ?? ""}
                onChange={(v) => setBuyer("address_line1", v)} />
              <div className="grid grid-cols-[100px_1fr_80px] gap-2">
                <Field label={t("fields.postcode")} value={inv.buyer.postcode ?? ""}
                  onChange={(v) => setBuyer("postcode", v)} />
                <Field label={t("fields.city")} value={inv.buyer.city ?? ""}
                  onChange={(v) => setBuyer("city", v)} />
                <SelectField label={t("fields.country")} value={inv.buyer.country_code}
                  options={[
                    { v: "FR", l: "FR" }, { v: "LU", l: "LU" },
                    { v: "BE", l: "BE" }, { v: "DE", l: "DE" },
                    { v: "NL", l: "NL" }, { v: "IT", l: "IT" }, { v: "ES", l: "ES" },
                  ]}
                  onChange={(v) => setBuyer("country_code", v)} />
              </div>
            </div>
          </Section>

          {/* Lines */}
          <Section title={t("sections.lines")}>
            <div className="space-y-3">
              {inv.lines.map((l, idx) => (
                <div key={idx} className="rounded-lg border border-card-border/50 bg-background/40 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("fields.line")} {idx + 1}</div>
                    {inv.lines.length > 1 && (
                      <button onClick={() => removeLine(idx)} className="text-xs text-rose-700 hover:underline">{t("removeLine")}</button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <Field label={t("fields.lineName")} value={l.name} onChange={(v) => updateLine(idx, { name: v })} />
                    <NumField label={t("fields.quantity")} value={l.quantity} step={0.01}
                      onChange={(v) => updateLine(idx, { quantity: v })} />
                    <NumField label={t("fields.unitPrice")} value={l.unit_price_net} step={0.01}
                      onChange={(v) => updateLine(idx, { unit_price_net: v })} />
                    <NumField label={t("fields.discount")} value={l.discount_percent ?? 0} step={0.01}
                      onChange={(v) => updateLine(idx, { discount_percent: v })} />
                    <NumField label={t("fields.vatRate")} value={l.vat_rate_percent} step={0.01}
                      onChange={(v) => updateLine(idx, { vat_rate_percent: v })} />
                    <SelectField label={t("fields.vatCategory")} value={l.vat_category}
                      options={[
                        { v: "S", l: "S — " + t("vat.S") },
                        { v: "E", l: "E — " + t("vat.E") },
                        { v: "Z", l: "Z — " + t("vat.Z") },
                        { v: "AE", l: "AE — " + t("vat.AE") },
                        { v: "G", l: "G — " + t("vat.G") },
                        { v: "O", l: "O — " + t("vat.O") },
                      ]}
                      onChange={(v) => updateLine(idx, { vat_category: v as VatCategoryCode })} />
                  </div>
                  <div className="mt-2">
                    <Field label={t("fields.lineDescription")} value={l.description ?? ""}
                      onChange={(v) => updateLine(idx, { description: v })} placeholder={t("fields.descriptionOpt")} />
                  </div>
                </div>
              ))}
              <button onClick={addLine}
                className="w-full rounded-lg border-2 border-dashed border-card-border py-2 text-xs font-semibold text-slate hover:border-navy hover:text-navy transition-colors">
                + {t("addLine")}
              </button>
            </div>
          </Section>

          {[...new Set(inv.lines.map(line => line.vat_category))].filter(category => ["E","AE","G","O"].includes(category)).map(category => (
            <Section key={category} title={`${t("fields.vatReason")} — ${category}`}>
              <Field label={`${t("fields.vatReason")} ${category}`} value={inv.vat_exemption_reasons?.[category] ?? ""}
                onChange={value => setField("vat_exemption_reasons", { ...inv.vat_exemption_reasons, [category]: value })} required />
            </Section>
          ))}
          {/* Payment */}
          <Section title={t("sections.payment")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="IBAN" value={inv.payment_iban ?? ""}
                onChange={(v) => setField("payment_iban", v)} placeholder="FR76..." />
              <Field label="BIC" value={inv.payment_bic ?? ""}
                onChange={(v) => setField("payment_bic", v)} />
              <Field label={t("fields.paymentReference")} value={inv.payment_reference ?? ""}
                onChange={(v) => setField("payment_reference", v)} />
              <Field label={t("fields.paymentTerms")} value={inv.payment_terms ?? ""}
                onChange={(v) => setField("payment_terms", v)} />
            </div>
          </Section>

          {/* Notes */}
          <Section title={t("sections.notes")}>
            <textarea value={(inv.notes ?? []).join("\n")}
              onChange={(e) => setField("notes", e.target.value.split("\n").filter(Boolean))}
              placeholder={t("fields.notesPlaceholder")}
              className="w-full rounded border border-input-border bg-input-bg px-2 py-2 text-sm min-h-[80px]" />
          </Section>
        </div>

        {/* Totals + actions */}
        <aside className="lg:sticky lg:top-4 lg:self-start space-y-4">
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider font-bold text-navy mb-3">{t("totals.title")}</div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{t("totals.ht")}</span>
                <span className="font-mono">{formatEUR(totals?.line_total ?? NaN, inv.currency, locale)}</span>
              </div>
              {(totals?.vat_breakdown ?? []).map((v, i) => (
                <div key={i} className="flex justify-between text-xs text-muted">
                  <span>{t("totals.vat")} {v.rate_percent}%</span>
                  <span className="font-mono">{formatEUR(v.tax_amount, inv.currency, locale)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-card-border">
                <span className="font-bold text-navy">{t("totals.ttc")}</span>
                <span className="font-mono font-bold text-navy">{formatEUR(totals?.grand_total ?? NaN, inv.currency, locale)}</span>
              </div>
            </div>
          </div>

          {validation.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <div className="font-bold mb-1">{t("validation.title")}</div>
              <ul className="list-disc pl-4 space-y-0.5">
                {validation.slice(0, 5).map((e, i) => <li key={i}>{e.message}</li>)}
                {validation.length > 5 && <li>… +{validation.length - 5}</li>}
              </ul>
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
              <ul className="list-disc pl-4 space-y-0.5">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              ✓ {success}
            </div>
          )}

          <button onClick={generate}
            disabled={generating || validation.length > 0 || !totals}
            className="w-full rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white hover:bg-navy-light disabled:opacity-50 transition-colors">
            {generating ? t("generating") : t("generate")} →
          </button>

          <div className="text-[11px] text-muted px-1 leading-relaxed">
            {t("hint")}
          </div>
        </aside>
      </div>
      </fieldset>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-card-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider font-bold text-navy mb-3">{title}</div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">
        {label}{required && <span className="text-rose-600 ml-0.5">*</span>}
      </div>
      <input aria-label={label} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm" />
    </label>
  );
}

function NumField({ label, value, onChange, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; step?: number;
}) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">{label}</div>
      <input aria-label={label} type="number" value={Number.isFinite(value) ? value : ""} step={step} onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm text-right font-mono" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: Array<{ v: string; l: string }>; onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">{label}</div>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm">
        {!options.some(option => option.v === value) && <option value={value}>{value}</option>}
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
