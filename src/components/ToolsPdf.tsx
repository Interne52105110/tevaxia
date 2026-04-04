"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export { PdfButton } from "@/components/energy/EnergyPdf";

/* ---------- Helpers ---------- */
const fmtEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number, d = 0) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d }).format(n);
const fmtPct = (n: number, d = 1) => `${n.toFixed(d)} %`;
const today = () => new Date().toLocaleDateString("fr-LU");

/* ---------- Styles (mirrors EnergyPdf) ---------- */
const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a2e" },
  header: { borderBottom: "2pt solid #1B2A4A", paddingBottom: 12, marginBottom: 20 },
  logoRow: { flexDirection: "row" as const, alignItems: "center", gap: 8, marginBottom: 8 },
  logoBox: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#C8A951", display: "flex" as const, alignItems: "center" as const, justifyContent: "center" as const },
  logoText: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#0F1B33" },
  logoName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1B2A4A" },
  logoGold: { color: "#C8A951" },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#1B2A4A" },
  subtitle: { fontSize: 9, color: "#6B7280", marginTop: 2 },
  section: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1B2A4A", marginTop: 16, marginBottom: 8, paddingBottom: 4, borderBottom: "1pt solid #e5e2db" },
  row: { flexDirection: "row" as const, justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5pt solid #f0f0f0" },
  rowHL: { flexDirection: "row" as const, justifyContent: "space-between", paddingVertical: 5, borderTop: "1.5pt solid #C8A951", marginTop: 4, backgroundColor: "#FAFAF8" },
  label: { color: "#334155", flex: 1 },
  value: { fontFamily: "Helvetica-Bold", textAlign: "right" as const },
  valueLg: { fontFamily: "Helvetica-Bold", fontSize: 12, textAlign: "right" as const, color: "#1B2A4A" },
  note: { fontSize: 8, color: "#6B7280", marginTop: 4, lineHeight: 1.4 },
  disclaimer: { fontSize: 7, color: "#9CA3AF", marginTop: 20, paddingTop: 8, borderTop: "0.5pt solid #e5e2db", lineHeight: 1.4 },
  footer: { position: "absolute" as const, bottom: 25, left: 40, right: 40, fontSize: 7, color: "#9CA3AF", textAlign: "center" as const },
  grid: { flexDirection: "row" as const, gap: 8, marginTop: 4 },
  cell: { flex: 1, padding: 6, backgroundColor: "#F8F7F4", borderRadius: 4 },
  cellLabel: { fontSize: 7, color: "#6B7280" },
  cellValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1B2A4A", marginTop: 2 },
});

/* ---------- Shared components ---------- */
function Header({ title }: { title: string }) {
  return (
    <View style={s.header}>
      <View style={s.logoRow}>
        <View style={s.logoBox}><Text style={s.logoText}>T</Text></View>
        <Text style={s.logoName}>tevaxia<Text style={s.logoGold}>.lu</Text></Text>
      </View>
      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{today()} — Simulation indicative</Text>
    </View>
  );
}
function Disclaimer() {
  return (
    <Text style={s.disclaimer}>
      Ce document est produit automatiquement par tevaxia.lu a titre informatif. Les resultats dependent
      des parametres saisis et des hypotheses de calcul. Ils ne constituent ni une expertise certifiee ni
      un conseil financier, fiscal ou juridique. Pour toute decision engageante, consultez un professionnel agree.
    </Text>
  );
}
function Footer() {
  return <Text style={s.footer}>tevaxia.lu — Outils immobiliers Luxembourg — {today()}</Text>;
}
function Row({ label, value: v }: { label: string; value: string }) {
  return <View style={s.row}><Text style={s.label}>{label}</Text><Text style={s.value}>{v}</Text></View>;
}
function RowHL({ label, value: v }: { label: string; value: string }) {
  return (
    <View style={s.rowHL}>
      <Text style={{ ...s.label, fontFamily: "Helvetica-Bold" }}>{label}</Text>
      <Text style={s.valueLg}>{v}</Text>
    </View>
  );
}
async function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 1. ESTIMATION ==================== */

export interface EstimationPdfParams {
  commune: string; typeBien: string; surface: number; chambres?: number;
  prixBas: number; prixMoyen: number; prixHaut: number; prixM2: number;
  adjustments?: { label: string; impact: string }[];
}

function EstimationDoc({ p }: { p: EstimationPdfParams }) {
  return (
    <Document><Page size="A4" style={s.page}>
      <Header title="Estimation immobiliere" />
      <Text style={s.section}>Bien evalue</Text>
      <Row label="Commune" value={p.commune} />
      <Row label="Type de bien" value={p.typeBien} />
      <Row label="Surface" value={`${fmtNum(p.surface)} m2`} />
      {p.chambres != null && <Row label="Chambres" value={String(p.chambres)} />}
      <Text style={s.section}>Fourchette de prix</Text>
      <Row label="Estimation basse" value={fmtEur(p.prixBas)} />
      <RowHL label="Estimation moyenne" value={fmtEur(p.prixMoyen)} />
      <Row label="Estimation haute" value={fmtEur(p.prixHaut)} />
      <Row label="Prix au m2" value={`${fmtEur(p.prixM2)}/m2`} />
      {p.adjustments && p.adjustments.length > 0 && <>
        <Text style={s.section}>Ajustements appliques</Text>
        {p.adjustments.map((a, i) => <Row key={i} label={a.label} value={a.impact} />)}
      </>}
      <Disclaimer /><Footer />
    </Page></Document>
  );
}

export async function downloadEstimationPdf(params: EstimationPdfParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<EstimationDoc p={params} />).toBlob();
  triggerDownload(blob, `estimation-${params.commune.toLowerCase()}-${today()}.pdf`);
}

/* ==================== 2. FRAIS D'ACQUISITION ==================== */

export interface FraisPdfParams {
  prixAchat: number; droitsEnregistrement: number; droitTranscription: number;
  tva?: number; fraisNotaire: number; fraisHypotheque?: number;
  totalFrais: number; totalAcquisition: number; isVEFA?: boolean;
}

function FraisDoc({ p }: { p: FraisPdfParams }) {
  return (
    <Document><Page size="A4" style={s.page}>
      <Header title="Frais d'acquisition" />
      <Text style={s.section}>Prix et regime</Text>
      <Row label="Prix d'achat" value={fmtEur(p.prixAchat)} />
      {p.isVEFA && <Row label="Regime" value="VEFA (TVA 3 %)" />}
      <Text style={s.section}>Detail des frais</Text>
      <Row label="Droits d'enregistrement" value={fmtEur(p.droitsEnregistrement)} />
      <Row label="Droit de transcription" value={fmtEur(p.droitTranscription)} />
      {p.tva != null && <Row label="TVA" value={fmtEur(p.tva)} />}
      <Row label="Frais de notaire" value={fmtEur(p.fraisNotaire)} />
      {p.fraisHypotheque != null && <Row label="Frais d'hypotheque" value={fmtEur(p.fraisHypotheque)} />}
      <RowHL label="Total des frais" value={fmtEur(p.totalFrais)} />
      <RowHL label="Cout total d'acquisition" value={fmtEur(p.totalAcquisition)} />
      <Row label="Part des frais" value={fmtPct((p.totalFrais / p.prixAchat) * 100)} />
      <Disclaimer /><Footer />
    </Page></Document>
  );
}

export async function downloadFraisPdf(params: FraisPdfParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<FraisDoc p={params} />).toBlob();
  triggerDownload(blob, `frais-acquisition-${today()}.pdf`);
}

/* ==================== 3. PLUS-VALUES ==================== */

export interface PlusValuesPdfParams {
  prixAcquisition: number; prixCession: number;
  anneeAcquisition: number; anneeCession: number; dureeDetention: number;
  coefficientReeval?: number; prixAcquisitionReevalue?: number;
  plusValueBrute: number; abattement?: number; plusValueImposable: number;
  tauxImposition: number; impot: number; isSpeculative: boolean;
}

function PlusValuesDoc({ p }: { p: PlusValuesPdfParams }) {
  return (
    <Document><Page size="A4" style={s.page}>
      <Header title="Plus-value immobiliere" />
      <Text style={s.section}>Transaction</Text>
      <Row label="Prix d'acquisition" value={fmtEur(p.prixAcquisition)} />
      <Row label="Prix de cession" value={fmtEur(p.prixCession)} />
      <Row label="Duree de detention" value={`${p.dureeDetention} ans (${p.anneeAcquisition} - ${p.anneeCession})`} />
      <Row label="Type" value={p.isSpeculative ? "Speculation (< 2 ans)" : "Plus-value long terme"} />
      <Text style={s.section}>Calcul</Text>
      {p.coefficientReeval != null && <Row label="Coefficient de reevaluation" value={fmtNum(p.coefficientReeval, 4)} />}
      {p.prixAcquisitionReevalue != null && <Row label="Prix reevalue" value={fmtEur(p.prixAcquisitionReevalue)} />}
      <Row label="Plus-value brute" value={fmtEur(p.plusValueBrute)} />
      {p.abattement != null && <Row label="Abattement" value={fmtEur(p.abattement)} />}
      <RowHL label="Plus-value imposable" value={fmtEur(p.plusValueImposable)} />
      <Text style={s.section}>Imposition</Text>
      <Row label="Taux d'imposition" value={fmtPct(p.tauxImposition)} />
      <RowHL label="Impot estime" value={fmtEur(p.impot)} />
      <Row label="Net de cession" value={fmtEur(p.prixCession - p.impot)} />
      <Disclaimer /><Footer />
    </Page></Document>
  );
}

export async function downloadPlusValuesPdf(params: PlusValuesPdfParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<PlusValuesDoc p={params} />).toBlob();
  triggerDownload(blob, `plus-values-${today()}.pdf`);
}

/* ==================== 4. CALCULATEUR DE LOYER ==================== */

export interface LoyerPdfParams {
  capitalInvesti: number; surface: number; plafondLoyer: number;
  loyerMensuel: number; loyerM2: number; rendementBrut: number; commune?: string;
}

function LoyerDoc({ p }: { p: LoyerPdfParams }) {
  return (
    <Document><Page size="A4" style={s.page}>
      <Header title="Plafonnement du loyer" />
      <Text style={s.section}>Parametres</Text>
      {p.commune && <Row label="Commune" value={p.commune} />}
      <Row label="Capital investi" value={fmtEur(p.capitalInvesti)} />
      <Row label="Surface habitable" value={`${fmtNum(p.surface)} m2`} />
      <Text style={s.section}>Resultats</Text>
      <Row label="Plafond annuel (5 % capital)" value={fmtEur(p.plafondLoyer)} />
      <RowHL label="Loyer mensuel max" value={fmtEur(p.loyerMensuel)} />
      <Row label="Loyer au m2" value={`${fmtNum(p.loyerM2, 2)} EUR/m2`} />
      <Row label="Rendement brut" value={fmtPct(p.rendementBrut)} />
      <Text style={s.note}>
        Base legale : loi modifiee du 21 septembre 2006 sur le bail a usage d'habitation (art. 3 — plafond 5 % du capital investi).
      </Text>
      <Disclaimer /><Footer />
    </Page></Document>
  );
}

export async function downloadLoyerPdf(params: LoyerPdfParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<LoyerDoc p={params} />).toBlob();
  triggerDownload(blob, `loyer-plafond-${today()}.pdf`);
}

/* ==================== 5. ACHAT VS LOCATION ==================== */

export interface AchatLocationPdfParams {
  verdict: string; prixAchat: number; loyerMensuel: number;
  dureeAns: number; tauxCredit: number;
  patrimoineAchat: number; patrimoineLocation: number;
  crossoverYear?: number; economieAchat?: number;
}

function AchatLocationDoc({ p }: { p: AchatLocationPdfParams }) {
  return (
    <Document><Page size="A4" style={s.page}>
      <Header title="Achat vs Location" />
      <Text style={s.section}>Hypotheses</Text>
      <Row label="Prix d'achat" value={fmtEur(p.prixAchat)} />
      <Row label="Loyer mensuel" value={fmtEur(p.loyerMensuel)} />
      <Row label="Duree de projection" value={`${p.dureeAns} ans`} />
      <Row label="Taux de credit" value={fmtPct(p.tauxCredit)} />
      <Text style={s.section}>Resultats</Text>
      <RowHL label="Verdict" value={p.verdict} />
      <View style={s.grid}>
        <View style={s.cell}><Text style={s.cellLabel}>Patrimoine achat</Text><Text style={s.cellValue}>{fmtEur(p.patrimoineAchat)}</Text></View>
        <View style={s.cell}><Text style={s.cellLabel}>Patrimoine location</Text><Text style={s.cellValue}>{fmtEur(p.patrimoineLocation)}</Text></View>
      </View>
      {p.crossoverYear != null && <Row label="Annee de basculement" value={`Annee ${p.crossoverYear}`} />}
      {p.economieAchat != null && <Row label="Avantage achat sur la duree" value={fmtEur(p.economieAchat)} />}
      <Disclaimer /><Footer />
    </Page></Document>
  );
}

export async function downloadAchatLocationPdf(params: AchatLocationPdfParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<AchatLocationDoc p={params} />).toBlob();
  triggerDownload(blob, `achat-vs-location-${today()}.pdf`);
}

/* ==================== 6. SIMULATEUR D'AIDES ==================== */

export interface AidesPdfParams {
  profil: string; revenus?: string;
  aides: { label: string; montant: number; description?: string }[];
  totalAides: number; economiesFiscales?: number; totalAvantage?: number;
}

function AidesDoc({ p }: { p: AidesPdfParams }) {
  return (
    <Document><Page size="A4" style={s.page}>
      <Header title="Simulateur d'aides au logement" />
      <Text style={s.section}>Profil</Text>
      <Row label="Profil" value={p.profil} />
      {p.revenus && <Row label="Revenus du menage" value={p.revenus} />}
      <Text style={s.section}>Aides identifiees</Text>
      {p.aides.map((a, i) => (
        <View key={i}>
          <Row label={a.label} value={fmtEur(a.montant)} />
          {a.description && <Text style={s.note}>{a.description}</Text>}
        </View>
      ))}
      <RowHL label="Total aides directes" value={fmtEur(p.totalAides)} />
      {p.economiesFiscales != null && <Row label="Economies fiscales estimees" value={fmtEur(p.economiesFiscales)} />}
      {p.totalAvantage != null && <RowHL label="Avantage total" value={fmtEur(p.totalAvantage)} />}
      <Disclaimer /><Footer />
    </Page></Document>
  );
}

export async function downloadAidesPdf(params: AidesPdfParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<AidesDoc p={params} />).toBlob();
  triggerDownload(blob, `aides-logement-${today()}.pdf`);
}

/* ==================== 7. BILAN PROMOTEUR ==================== */

export interface BilanPromoteurPdfParams {
  nomProjet?: string; surfaceTerrain: number; surfacePlancher: number; prixVenteM2: number;
  recettesTotales: number; coutConstruction: number; coutHonoraires: number;
  coutFinancement: number; coutCommercialisation: number; totalCouts: number;
  margeBrute: number; margePct: number; chargeFonciere: number; chargeFonciereM2: number;
}

function BilanPromoteurDoc({ p }: { p: BilanPromoteurPdfParams }) {
  return (
    <Document><Page size="A4" style={s.page}>
      <Header title="Bilan promoteur" />
      <Text style={s.section}>Projet{p.nomProjet ? ` — ${p.nomProjet}` : ""}</Text>
      <Row label="Surface terrain" value={`${fmtNum(p.surfaceTerrain)} m2`} />
      <Row label="Surface plancher" value={`${fmtNum(p.surfacePlancher)} m2`} />
      <Row label="Prix de vente moyen" value={`${fmtEur(p.prixVenteM2)}/m2`} />
      <Text style={s.section}>Recettes</Text>
      <RowHL label="Recettes totales" value={fmtEur(p.recettesTotales)} />
      <Text style={s.section}>Couts</Text>
      <Row label="Construction" value={fmtEur(p.coutConstruction)} />
      <Row label="Honoraires et etudes" value={fmtEur(p.coutHonoraires)} />
      <Row label="Financement" value={fmtEur(p.coutFinancement)} />
      <Row label="Commercialisation" value={fmtEur(p.coutCommercialisation)} />
      <RowHL label="Total couts (hors foncier)" value={fmtEur(p.totalCouts)} />
      <Text style={s.section}>Resultat</Text>
      <View style={s.grid}>
        <View style={s.cell}><Text style={s.cellLabel}>Marge brute</Text><Text style={s.cellValue}>{fmtEur(p.margeBrute)}</Text></View>
        <View style={s.cell}><Text style={s.cellLabel}>Marge %</Text><Text style={s.cellValue}>{fmtPct(p.margePct)}</Text></View>
      </View>
      <RowHL label="Charge fonciere residuelle" value={fmtEur(p.chargeFonciere)} />
      <Row label="Charge fonciere au m2 terrain" value={`${fmtEur(p.chargeFonciereM2)}/m2`} />
      <Disclaimer /><Footer />
    </Page></Document>
  );
}

export async function downloadBilanPromoteurPdf(params: BilanPromoteurPdfParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<BilanPromoteurDoc p={params} />).toBlob();
  triggerDownload(blob, `bilan-promoteur-${today()}.pdf`);
}

/* ==================== 8. OUTILS BANCAIRES ==================== */

export interface BancairePdfParams {
  prixBien: number; apport: number; montantCredit: number;
  dureeAns: number; tauxNominal: number; mensualite: number;
  coutTotal: number; coutInterets: number;
  ltv: number; tauxEndettement: number; capaciteMax?: number;
}

function BancaireDoc({ p }: { p: BancairePdfParams }) {
  return (
    <Document><Page size="A4" style={s.page}>
      <Header title="Simulation bancaire" />
      <Text style={s.section}>Parametres du pret</Text>
      <Row label="Prix du bien" value={fmtEur(p.prixBien)} />
      <Row label="Apport personnel" value={fmtEur(p.apport)} />
      <Row label="Montant emprunte" value={fmtEur(p.montantCredit)} />
      <Row label="Duree" value={`${p.dureeAns} ans`} />
      <Row label="Taux nominal" value={fmtPct(p.tauxNominal, 2)} />
      <Text style={s.section}>Resultats</Text>
      <RowHL label="Mensualite" value={fmtEur(p.mensualite)} />
      <Row label="Cout total du credit" value={fmtEur(p.coutTotal)} />
      <Row label="Total interets payes" value={fmtEur(p.coutInterets)} />
      <Text style={s.section}>Ratios</Text>
      <View style={s.grid}>
        <View style={s.cell}><Text style={s.cellLabel}>LTV</Text><Text style={s.cellValue}>{fmtPct(p.ltv)}</Text></View>
        <View style={s.cell}><Text style={s.cellLabel}>Taux endettement</Text><Text style={s.cellValue}>{fmtPct(p.tauxEndettement)}</Text></View>
      </View>
      {p.capaciteMax != null && <RowHL label="Capacite d'emprunt max" value={fmtEur(p.capaciteMax)} />}
      <Disclaimer /><Footer />
    </Page></Document>
  );
}

export async function downloadBancairePdf(params: BancairePdfParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<BancaireDoc p={params} />).toBlob();
  triggerDownload(blob, `simulation-bancaire-${today()}.pdf`);
}

/* ==================== 9. DCF MULTI-TENANT ==================== */

export interface DcfMultiPdfParams {
  nomBien?: string;
  baux: { locataire: string; loyer: number; echeance: string }[];
  loyerTotal: number; tauxActualisation: number;
  valeurDCF: number; valeurTerminale: number; valeurTotale: number;
  tri?: number; rendement?: number;
}

function DcfMultiDoc({ p }: { p: DcfMultiPdfParams }) {
  return (
    <Document><Page size="A4" style={s.page}>
      <Header title="DCF Multi-locataires" />
      {p.nomBien && <Row label="Bien" value={p.nomBien} />}
      <Text style={s.section}>Baux en cours</Text>
      {p.baux.map((b, i) => <Row key={i} label={`${b.locataire} (ech. ${b.echeance})`} value={`${fmtEur(b.loyer)}/an`} />)}
      <RowHL label="Loyer total annuel" value={fmtEur(p.loyerTotal)} />
      <Text style={s.section}>Valorisation DCF</Text>
      <Row label="Taux d'actualisation" value={fmtPct(p.tauxActualisation, 2)} />
      <Row label="Valeur flux actualises" value={fmtEur(p.valeurDCF)} />
      <Row label="Valeur terminale" value={fmtEur(p.valeurTerminale)} />
      <RowHL label="Valeur totale" value={fmtEur(p.valeurTotale)} />
      {p.tri != null && <Row label="TRI" value={fmtPct(p.tri, 2)} />}
      {p.rendement != null && <Row label="Rendement initial" value={fmtPct(p.rendement, 2)} />}
      <Disclaimer /><Footer />
    </Page></Document>
  );
}

export async function downloadDcfMultiPdf(params: DcfMultiPdfParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<DcfMultiDoc p={params} />).toBlob();
  triggerDownload(blob, `dcf-multi-${today()}.pdf`);
}

/* ==================== 10. DONNEES MARCHE ==================== */

export interface MarchePdfParams {
  commune: string; trimestre?: string;
  prixMedianAppart?: number; prixMedianMaison?: number;
  volumeTransactions?: number; evolutionPct?: number;
  prixM2Appart?: number; prixM2Maison?: number;
  indicateurs?: { label: string; value: string }[];
}

function MarcheDoc({ p }: { p: MarchePdfParams }) {
  return (
    <Document><Page size="A4" style={s.page}>
      <Header title="Donnees de marche" />
      <Text style={s.section}>{p.commune}{p.trimestre ? ` — ${p.trimestre}` : ""}</Text>
      {p.prixMedianAppart != null && <Row label="Prix median appartement" value={fmtEur(p.prixMedianAppart)} />}
      {p.prixMedianMaison != null && <Row label="Prix median maison" value={fmtEur(p.prixMedianMaison)} />}
      {p.prixM2Appart != null && <Row label="Prix m2 appartement" value={`${fmtEur(p.prixM2Appart)}/m2`} />}
      {p.prixM2Maison != null && <Row label="Prix m2 maison" value={`${fmtEur(p.prixM2Maison)}/m2`} />}
      {p.volumeTransactions != null && <Row label="Volume de transactions" value={fmtNum(p.volumeTransactions)} />}
      {p.evolutionPct != null && <Row label="Evolution annuelle" value={`${p.evolutionPct > 0 ? "+" : ""}${fmtPct(p.evolutionPct)}`} />}
      {p.indicateurs && p.indicateurs.length > 0 && <>
        <Text style={s.section}>Indicateurs cles</Text>
        {p.indicateurs.map((ind, i) => <Row key={i} label={ind.label} value={ind.value} />)}
      </>}
      <Disclaimer /><Footer />
    </Page></Document>
  );
}

export async function downloadMarchePdf(params: MarchePdfParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<MarcheDoc p={params} />).toBlob();
  triggerDownload(blob, `marche-${params.commune.toLowerCase()}-${today()}.pdf`);
}

/* ==================== 11. CARTE DES PRIX ==================== */

export interface CartePdfParams {
  commune: string; prixMoyenM2: number; prixMedianM2?: number;
  nbTransactions?: number; fourchetteBasse?: number; fourchetteHaute?: number;
  classement?: string; details?: { label: string; value: string }[];
}

function CarteDoc({ p }: { p: CartePdfParams }) {
  return (
    <Document><Page size="A4" style={s.page}>
      <Header title="Carte des prix — Fiche commune" />
      <Text style={s.section}>{p.commune}</Text>
      <RowHL label="Prix moyen au m2" value={`${fmtEur(p.prixMoyenM2)}/m2`} />
      {p.prixMedianM2 != null && <Row label="Prix median au m2" value={`${fmtEur(p.prixMedianM2)}/m2`} />}
      {p.fourchetteBasse != null && p.fourchetteHaute != null && (
        <Row label="Fourchette" value={`${fmtEur(p.fourchetteBasse)} - ${fmtEur(p.fourchetteHaute)}/m2`} />
      )}
      {p.nbTransactions != null && <Row label="Nombre de transactions" value={fmtNum(p.nbTransactions)} />}
      {p.classement && <Row label="Classement national" value={p.classement} />}
      {p.details && p.details.length > 0 && <>
        <Text style={s.section}>Details</Text>
        {p.details.map((d, i) => <Row key={i} label={d.label} value={d.value} />)}
      </>}
      <Disclaimer /><Footer />
    </Page></Document>
  );
}

export async function downloadCartePdf(params: CartePdfParams) {
  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(<CarteDoc p={params} />).toBlob();
  triggerDownload(blob, `carte-prix-${params.commune.toLowerCase()}-${today()}.pdf`);
}
