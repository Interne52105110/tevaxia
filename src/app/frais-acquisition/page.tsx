"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import ResultPanel from "@/components/ResultPanel";
import { calculerFraisAcquisition, formatEUR2 as formatEUR, formatPct } from "@/lib/calculations";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import RelatedTools from "@/components/RelatedTools";
import Breadcrumbs from "@/components/Breadcrumbs";

import { PdfButton } from "@/components/PdfButton";
const _lazy_generateFraisPdfBlob = async (...args: Parameters<typeof import("@/components/ToolsPdf")["generateFraisPdfBlob"]>): Promise<Blob> => (await import("@/components/ToolsPdf")).generateFraisPdfBlob(...args);

export default function FraisAcquisition() {
  const t = useTranslations("fraisAcquisition");
  const a = useTranslations("acquisitionAudit");
  const [prixBien, setPrixBien] = useState(750000);
  const [estNeuf, setEstNeuf] = useState(false);
  const [partTerrain, setPartTerrain] = useState(250000);
  const [residencePrincipale, setResidencePrincipale] = useState(true);
  const [nonResident, setNonResident] = useState(false);
  const [achatSociete, setAchatSociete] = useState(false);
  const [nbAcquereurs, setNbAcquereurs] = useState<1 | 2>(2);
  const [montantHypotheque, setMontantHypotheque] = useState(600000);

  const [quotePartPremier, setQuotePartPremier] = useState(50);
  const [credit1, setCredit1] = useState(40000);
  const [credit2, setCredit2] = useState(40000);
  const [accessoiresHypotheque, setAccessoiresHypotheque] = useState(0);

  // Frais annexes optionnels (architecte, géomètre, diagnostic, déménagement)
  const [inclureFraisAnnexes, setInclureFraisAnnexes] = useState(false);
  const [fraisArchitecte, setFraisArchitecte] = useState(0);
  const [fraisGeometre, setFraisGeometre] = useState(0);
  const [fraisDiagnostic, setFraisDiagnostic] = useState(500);
  const [fraisDemenagement, setFraisDemenagement] = useState(1500);
  const [fraisCourtage, setFraisCourtage] = useState(0);
  const totalFraisAnnexes = inclureFraisAnnexes
    ? fraisArchitecte + fraisGeometre + fraisDiagnostic + fraisDemenagement + fraisCourtage
    : 0;

  // L'installation future peut ouvrir le droit ; une société n'est pas éligible.
  const effRP = residencePrincipale && !achatSociete;

  const partConstruction = prixBien - partTerrain;

  const result = useMemo(() => {
    try { return calculerFraisAcquisition({
        prixBien,
        estNeuf,
        partTerrain: estNeuf ? partTerrain : undefined,
        partConstruction: estNeuf ? partConstruction : undefined,
        residencePrincipale: effRP,
        nbAcquereurs,
        montantHypotheque,
        baseInscriptionHypotheque: montantHypotheque + accessoiresHypotheque,
        achatSociete,
        quotePartPremier: quotePartPremier / 100,
        creditsRestants: nbAcquereurs === 1 ? [credit1] : [credit1, credit2],
      }); } catch { return null; }
    }, [prixBien, estNeuf, partTerrain, partConstruction, effRP, nbAcquereurs, montantHypotheque, accessoiresHypotheque, achatSociete, quotePartPremier, credit1, credit2]);

  return (
    <>
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionBien")}</h2>
              <div className="space-y-4">
                <InputField
                  label={estNeuf ? a("prixHT") : t("prixBien")}
                  value={prixBien}
                  onChange={(v) => setPrixBien(Number(v))}
                  suffix="€"
                  min={0}
                />
                <ToggleField
                  label={t("neufLabel")}
                  checked={estNeuf}
                  onChange={setEstNeuf}
                  hint={t("neufHint")}
                />
                {estNeuf && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      label={t("partTerrain")}
                      value={partTerrain}
                      onChange={(v) => setPartTerrain(Number(v))}
                      suffix="€"
                      min={0}
                      hint={t("partTerrainHint")}
                    />
                    <InputField
                      label={t("partConstruction")}
                      value={partConstruction}
                      onChange={() => {}}
                      suffix="€"
                      hint={t("partConstructionHint")}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionAcquereur")}</h2>
              <div className="space-y-4">
                <ToggleField
                  label={t("nonResident")}
                  checked={nonResident}
                  onChange={setNonResident}
                  hint={t("nonResidentHint")}
                />
                {!achatSociete && (
                  <ToggleField
                    label={t("residencePrincipale")}
                    checked={residencePrincipale}
                    onChange={setResidencePrincipale}
                    hint={t("residencePrincipaleHint")}
                  />
                )}
                {nonResident && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <strong className="block mb-1">{t("nonResidentDisclaimerTitle")}</strong>
                    {a("nonResident")}
                  </div>
                )}
                <ToggleField
                  label={t("achatSociete")}
                  checked={achatSociete}
                  onChange={setAchatSociete}
                  hint={t("achatSocieteHint")}
                />
                {achatSociete && (
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900 space-y-2">
                    <strong className="block">{t("achatSocieteInfoTitle")}</strong>
                    <ul className="ml-4 list-disc space-y-1">
                      <li>{t("achatSocieteItem1")}</li>
                      <li>{t("achatSocieteItem2")}</li>
                      <li>{t("achatSocieteItem3")}</li>
                      <li>{t("achatSocieteItem4")}</li>
                      <li>{t("achatSocieteItem5")}</li>
                    </ul>
                    <p className="mt-2 italic text-[11px]">{t("achatSocieteExpert")}</p>
                  </div>
                )}
                <InputField
                  label={t("nbAcquereurs")}
                  type="select"
                  value={String(nbAcquereurs)}
                  onChange={(v) => setNbAcquereurs(Number(v) as 1 | 2)}
                  options={[
                    { value: "1", label: t("acquereur1") },
                    { value: "2", label: t("acquereur2") },
                  ]}
                />
                {effRP && <>
                  <p className="text-sm text-muted">{a("creditHint")}</p>
                  {nbAcquereurs === 2 && <InputField label={a("quote")} value={quotePartPremier} onChange={v => setQuotePartPremier(Number(v))} suffix="%" min={1} max={99} />}
                  <InputField label={a("credit1")} value={credit1} onChange={v => setCredit1(Number(v))} suffix="€" min={0} max={40000} />
                  {nbAcquereurs === 2 && <InputField label={a("credit2")} value={credit2} onChange={v => setCredit2(Number(v))} suffix="€" min={0} max={40000} />}
                </>}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionFinancement")}</h2>
              <InputField
                label={t("montantHypotheque")}
                value={montantHypotheque}
                onChange={(v) => { setMontantHypotheque(Number(v)); if (Number(v) === 0) setAccessoiresHypotheque(0); }}
                suffix="€"
                min={0}
                hint={a("mortgageHint")}
              />
              {montantHypotheque > 0 && <InputField label={a("accessoires")} value={accessoiresHypotheque} onChange={v => setAccessoiresHypotheque(Number(v))} suffix="€" min={0} />}
              <p className="mt-3 text-xs text-muted">{a("mortgageScope")}</p>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionAnnexes")}</h2>
              <ToggleField
                label={t("inclureAnnexes")}
                checked={inclureFraisAnnexes}
                onChange={setInclureFraisAnnexes}
                hint={t("inclureAnnexesHint")}
              />
              {inclureFraisAnnexes && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InputField
                    label={t("fraisArchitecte")}
                    value={fraisArchitecte}
                    onChange={(v) => setFraisArchitecte(Number(v))}
                    suffix="€"
                    min={0}
                    hint={t("fraisArchitecteHint")}
                  />
                  <InputField
                    label={t("fraisGeometre")}
                    value={fraisGeometre}
                    onChange={(v) => setFraisGeometre(Number(v))}
                    suffix="€"
                    min={0}
                    hint={t("fraisGeometreHint")}
                  />
                  <InputField
                    label={t("fraisDiagnostic")}
                    value={fraisDiagnostic}
                    onChange={(v) => setFraisDiagnostic(Number(v))}
                    suffix="€"
                    min={0}
                    hint={t("fraisDiagnosticHint")}
                  />
                  <InputField
                    label={t("fraisDemenagement")}
                    value={fraisDemenagement}
                    onChange={(v) => setFraisDemenagement(Number(v))}
                    suffix="€"
                    min={0}
                    hint={t("fraisDemenagementHint")}
                  />
                  <InputField
                    label={t("fraisCourtage")}
                    value={fraisCourtage}
                    onChange={(v) => setFraisCourtage(Number(v))}
                    suffix="€"
                    min={0}
                    hint={t("fraisCourtageHint")}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {!result ? <p role="alert" className="rounded-xl border border-red-300 p-4">{a("invalid")}</p> : <>
            <ResultPanel
              title={t("resultDroitsTitle")}
              lines={[
                { label: t("baseTaxable"), value: formatEUR(result.baseDroits), sub: true },
                { label: t("droitsEnregistrement"), value: formatEUR(result.droitsEnregistrement) },
                { label: t("droitsTranscription"), value: formatEUR(result.droitsTranscription) },
                { label: t("totalDroitsBruts"), value: formatEUR(result.droitsTotal) },
                ...(result.creditBellegenAkt > 0
                  ? [
                      {
                        label: t("bellegenAkt", { nb: nbAcquereurs }),
                        value: `- ${formatEUR(result.creditBellegenAkt)}`,
                      },
                    ]
                  : []),
                { label: t("droitsNets"), value: formatEUR(result.droitsApresCredit), highlight: true },
              ]}
            />

            {estNeuf && (
              <ResultPanel
                title={t("resultTvaTitle")}
                lines={[
                  { label: t("baseTva"), value: formatEUR(result.tvaApplicable), sub: true },
                  {
                    label: t("tauxApplique"),
                    value: formatPct(result.tvaApplicable > 0 ? result.montantTva / result.tvaApplicable : 0),
                  },
                  { label: t("montantTva"), value: formatEUR(result.montantTva) },
                  ...(result.faveurFiscaleTva > 0
                    ? [{ label: t("faveurFiscaleTva"), value: formatEUR(result.faveurFiscaleTva), sub: true }]
                    : []),
                ]}
              />
            )}

            <ResultPanel
              title={t("resultAutresFrais")}
              lines={[
                { label: a("notaryHT"), value: formatEUR(result.emolumentsNotaireHT) },
                { label: a("notaryVAT"), value: formatEUR(result.tvaEmolumentsNotaire) },
                ...(montantHypotheque > 0
                  ? [
                      { label: a("obligation"), value: formatEUR(result.droitsObligation) },
                      { label: a("inscription"), value: formatEUR(result.droitsHypotheque) },
                      { label: a("mortgageHT"), value: formatEUR(result.emolumentsHypothequeHT) },
                      { label: a("mortgageVAT"), value: formatEUR(result.tvaEmolumentsHypotheque) },
                    ]
                  : []),
              ]}
            />

            {inclureFraisAnnexes && totalFraisAnnexes > 0 && (
              <ResultPanel
                title={t("resultAnnexes")}
                lines={[
                  ...(fraisArchitecte > 0 ? [{ label: t("fraisArchitecte"), value: formatEUR(fraisArchitecte), sub: true }] : []),
                  ...(fraisGeometre > 0 ? [{ label: t("fraisGeometre"), value: formatEUR(fraisGeometre), sub: true }] : []),
                  ...(fraisDiagnostic > 0 ? [{ label: t("fraisDiagnostic"), value: formatEUR(fraisDiagnostic), sub: true }] : []),
                  ...(fraisDemenagement > 0 ? [{ label: t("fraisDemenagement"), value: formatEUR(fraisDemenagement), sub: true }] : []),
                  ...(fraisCourtage > 0 ? [{ label: t("fraisCourtage"), value: formatEUR(fraisCourtage), sub: true }] : []),
                  { label: t("totalAnnexes"), value: formatEUR(totalFraisAnnexes), highlight: true },
                ]}
              />
            )}

            <ResultPanel
              title={t("resultTotal")}
              className="border-gold/30"
              lines={[
                { label: t("prixDuBien"), value: formatEUR(prixBien) },
                { label: t("totalFrais", { pct: formatPct(result.totalPourcentage) }), value: formatEUR(result.totalFrais) },
                ...(totalFraisAnnexes > 0
                  ? [{ label: t("fraisAnnexesLabel"), value: formatEUR(totalFraisAnnexes), sub: true }]
                  : []),
                {
                  label: t("coutTotalAcquisition"),
                  value: formatEUR(result.coutTotalAcquisition + totalFraisAnnexes),
                  highlight: true,
                  large: true,
                },
              ]}
            />

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            {/* Camembert décomposition */}
            {result.totalFrais > 0 && (() => {
              const data = [
                { name: t("chartDroitsNets"), value: result.droitsApresCredit, color: "#1B2A4A" },
                ...(result.montantTva > 0 ? [{ name: t("chartTva"), value: result.montantTva, color: "#C8A951" }] : []),
                { name: t("chartNotaire"), value: result.emolumentsNotaire, color: "#2A9D8F" },
                ...(result.fraisHypotheque > 0 ? [{ name: t("chartHypotheque"), value: result.fraisHypotheque, color: "#6B7280" }] : []),
              ].filter((d) => d.value > 0);
              return (
                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-navy">{t("decompositionTitle")}</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatEUR(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {data.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-muted">{d.name}</span>
                        <span className="font-mono font-semibold">{formatEUR(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

              <h3 className="mb-3 text-base font-semibold text-navy">{t("bonASavoir")}</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">{t("infobellegenTitle")}</strong> — {a("creditHint")}
                </p>
                <p>
                  <strong className="text-slate">{t("infoVefaTitle")}</strong> — {a("vefaScope")}
                </p>
                <p>
                  <strong className="text-slate">{t("infoNotaireTitle")}</strong> — {a("notaryScope")}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-2">
              <SaveButton
                onClick={() => {
                  sauvegarderEvaluation({
                    nom: `${t("savePrefix")} — ${formatEUR(prixBien)}`,
                    type: "frais",
                    valeurPrincipale: result.totalFrais,
                    data: { prixBien, estNeuf, partTerrain, residencePrincipale: effRP, nbAcquereurs, montantHypotheque, quotePartPremier, credit1, credit2, accessoiresHypotheque, achatSociete },
                  });
                }}
                label={t("sauvegarder")}
                successLabel={t("evaluationSauvegardee")}
              />
              <PdfButton
                label="PDF"
                filename={`frais-acquisition-${new Date().toLocaleDateString("fr-FR")}.pdf`}
                generateBlob={() =>
                  _lazy_generateFraisPdfBlob({
                    prixAchat: prixBien,
                    creditBellegenAkt: result.creditBellegenAkt,
                    limites: a("notaryScope") + " " + a("mortgageScope") + " " + (estNeuf ? a("vefaScope") : ""),
                    droitsEnregistrement: result.droitsEnregistrement,
                    droitTranscription: result.droitsTranscription,
                    tva: estNeuf ? result.montantTva : undefined,
                    fraisNotaire: result.emolumentsNotaire,
                    fraisHypotheque: montantHypotheque > 0 ? result.fraisHypotheque : undefined,
                    totalFrais: result.totalFrais,
                    totalAcquisition: result.coutTotalAcquisition,
                    isVEFA: estNeuf,
                  })
                }
              />
            </div>

            <RelatedTools keys={["aides", "estimation", "vefa"]} />
            </>}
            <p className="text-sm text-muted">{a("scope")}</p>
            <div className="flex flex-wrap gap-4 text-sm underline">
              <a href="https://www.notariat.lu/notaire/reglement-revision-tarifs">{a("tariffSource")}</a>
              <a href="https://pfi.public.lu/fr/citoyen/enregistrement/credit-impot.html">Bëllegen Akt</a>
              <a href="https://pfi.public.lu/fr/citoyen/hypotheques.html">{a("mortgageSource")}</a>
            </div>
          </div>
        </div>
      </div>

    </div>

    </>
  );
}
