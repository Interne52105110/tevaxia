"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import AiAnalysisCard from "@/components/AiAnalysisCard";

interface DDItem {
  id: string;
  label: string;
  category: "technique" | "commercial" | "juridique" | "fiscal" | "esg" | "rh";
  critical: boolean;
  status: "ok" | "nc" | "na" | "todo";
  notes: string;
}

const DD_ITEMS: Omit<DDItem, "status" | "notes">[] = [
  // TECHNIQUE (10)
  { id: "t1", label: "État général bâti (toiture, façade, structure) — rapport inspection récent < 5 ans", category: "technique", critical: true },
  { id: "t2", label: "Conformité incendie (détection, extinction, évacuation, formation staff)", category: "technique", critical: true },
  { id: "t3", label: "Installations électriques aux normes (contrôle SNCH récent)", category: "technique", critical: true },
  { id: "t4", label: "Chauffage / ECS / climatisation — âge équipements et coûts entretien", category: "technique", critical: false },
  { id: "t5", label: "Ascenseurs — dernière expertise ITM et contrat entretien", category: "technique", critical: true },
  { id: "t6", label: "Isolation thermique / CPE classe actuelle et CO2", category: "technique", critical: false },
  { id: "t7", label: "Plomberie / distribution eau chaude — état réseau", category: "technique", critical: false },
  { id: "t8", label: "Ventilation / qualité air intérieur (norme CE)", category: "technique", critical: false },
  { id: "t9", label: "Accessibilité PMR (rampe, ascenseur, chambre adaptée) — obligation LU", category: "technique", critical: true },
  { id: "t10", label: "IT / PMS / WiFi / systèmes — inventaire et contrats de licence", category: "technique", critical: false },
  // COMMERCIAL (8)
  { id: "c1", label: "Historique ADR / occupation / RevPAR 3 dernières années", category: "commercial", critical: true },
  { id: "c2", label: "Mix clientèle (corporate/leisure/groupe/OTA/direct) et top 10 clients", category: "commercial", critical: true },
  { id: "c3", label: "Contrats corporate en cours (renouvellement ? exclusivités ?)", category: "commercial", critical: true },
  { id: "c4", label: "Distribution OTA (Booking, Expedia, direct) — % et commissions moyennes", category: "commercial", critical: false },
  { id: "c5", label: "Réputation online (score Booking, Tripadvisor, Google — derniers 12 mois)", category: "commercial", critical: false },
  { id: "c6", label: "Système de fidélité / abonnement / programme corporate", category: "commercial", critical: false },
  { id: "c7", label: "Concurrence directe (compset MPI/ARI/RGI)", category: "commercial", critical: false },
  { id: "c8", label: "Saisonnalité et pickup curve — pics/creux identifiés", category: "commercial", critical: false },
  // JURIDIQUE (8)
  { id: "j1", label: "Titre de propriété — servitudes, hypothèques, droits tiers", category: "juridique", critical: true },
  { id: "j2", label: "Licence d'hébergement valide + conformité règlement communal", category: "juridique", critical: true },
  { id: "j3", label: "Contrats fournisseurs (linge, F&B, maintenance) — résiliables ?", category: "juridique", critical: false },
  { id: "j4", label: "Baux commerciaux (F&B restaurant, boutique) — échéances et clauses", category: "juridique", critical: true },
  { id: "j5", label: "Contrats de travail staff — transférabilité (art. L.127-1 CT LU)", category: "juridique", critical: true },
  { id: "j6", label: "Assurances RC + PNO + perte d'exploitation — montants couverts", category: "juridique", critical: true },
  { id: "j7", label: "Contentieux en cours ou récents (prud'homaux, commerciaux, fiscaux)", category: "juridique", critical: true },
  { id: "j8", label: "Contrats franchise / management / marque — durée, royalties, exclusivité", category: "juridique", critical: false },
  // FISCAL (6)
  { id: "f1", label: "TVA régime appliqué (3% hébergement 90j, 17% standard, F&B 14%)", category: "fiscal", critical: true },
  { id: "f2", label: "Taxe communale hébergement / séjour — déclarations à jour", category: "fiscal", critical: false },
  { id: "f3", label: "Impôt sur les bénéfices — liasses fiscales 3 dernières années", category: "fiscal", critical: true },
  { id: "f4", label: "Retenue à la source salaires — conformité CNS/CNAP", category: "fiscal", critical: true },
  { id: "f5", label: "Due diligence fiscale sur la structure d'acquisition (share deal vs asset deal)", category: "fiscal", critical: true },
  { id: "f6", label: "Amortissements immobiliers et mobilier — optimisation", category: "fiscal", critical: false },
  // ESG (8)
  { id: "e1", label: "CPE actuel et trajectoire EPBD IV (obligations 2030/2050)", category: "esg", critical: true },
  { id: "e2", label: "Stranding risk CRREM — alignement avec pathway secteur hôtelier", category: "esg", critical: true },
  { id: "e3", label: "Plan rénovation énergétique à 5-10 ans + CAPEX estimé", category: "esg", critical: false },
  { id: "e4", label: "Certification environnementale (LENOZ, BREEAM, Green Key)", category: "esg", critical: false },
  { id: "e5", label: "Consommation eau / électricité / déchets — benchmark secteur", category: "esg", critical: false },
  { id: "e6", label: "Diversité staff et politique RH / genre / âge (SFDR)", category: "esg", critical: false },
  { id: "e7", label: "Approvisionnement durable F&B (local, bio, circuits courts)", category: "esg", critical: false },
  { id: "e8", label: "Impact communautaire (emploi local, événements, partenariats)", category: "esg", critical: false },
  // RH (10)
  { id: "r1", label: "Effectif total (FTE) et pyramide hiérarchique", category: "rh", critical: true },
  { id: "r2", label: "Absentéisme et turnover 3 dernières années", category: "rh", critical: false },
  { id: "r3", label: "Contrats collectifs applicables (HORESCA) — salaires vs marché", category: "rh", critical: true },
  { id: "r4", label: "Délégation du personnel — relations sociales", category: "rh", critical: false },
  { id: "r5", label: "Clés de staff — identification des profils critiques (DG, chef)", category: "rh", critical: true },
  { id: "r6", label: "Formation obligatoire (HACCP, incendie, accueil PMR)", category: "rh", critical: true },
  { id: "r7", label: "Plan de succession / transmission si patron exploitant", category: "rh", critical: false },
  { id: "r8", label: "Pratique linguistique (FR/LU/DE/EN) — adaptation clientèle LU", category: "rh", critical: false },
  { id: "r9", label: "Congés / RTT / passage en revue", category: "rh", critical: false },
  { id: "r10", label: "Contrats management si franchise/Accor/Marriott — incentives", category: "rh", critical: false },
];

const CATEGORY_LABELS: Record<DDItem["category"], { label: string; color: string }> = {
  technique: { label: "Technique", color: "bg-blue-100 text-blue-800" },
  commercial: { label: "Commercial", color: "bg-emerald-100 text-emerald-800" },
  juridique: { label: "Juridique", color: "bg-purple-100 text-purple-800" },
  fiscal: { label: "Fiscal", color: "bg-amber-100 text-amber-800" },
  esg: { label: "ESG", color: "bg-green-100 text-green-800" },
  rh: { label: "RH", color: "bg-rose-100 text-rose-800" },
};

const pdfStyles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: "Helvetica", color: "#0B2447" },
  title: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginTop: 10, marginBottom: 4, color: "#1B2A4A" },
  row: { flexDirection: "row", borderBottom: "0.5 solid #e5e7eb", paddingVertical: 2 },
  label: { width: "60%", fontSize: 8 },
  status: { width: "15%", fontSize: 8, fontWeight: "bold" },
  notes: { width: "25%", fontSize: 7, color: "#475569" },
});

function DdPdf({ hotelName, items }: { hotelName: string; items: DDItem[] }) {
  const byCategory = Object.keys(CATEGORY_LABELS) as DDItem["category"][];
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Due Diligence Hôtelière — {hotelName}</Text>
        <Text style={{ fontSize: 9, marginBottom: 10 }}>Date : {new Date().toLocaleDateString("fr-LU")} · 50 points structurés par thématique</Text>
        {byCategory.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          if (catItems.length === 0) return null;
          return (
            <View key={cat} wrap={false}>
              <Text style={pdfStyles.sectionTitle}>{CATEGORY_LABELS[cat].label} ({catItems.length} points)</Text>
              {catItems.map((i) => (
                <View key={i.id} style={pdfStyles.row}>
                  <Text style={pdfStyles.label}>{i.critical ? "★ " : ""}{i.label}</Text>
                  <Text style={pdfStyles.status}>
                    {i.status === "ok" ? "OK" : i.status === "nc" ? "NC" : i.status === "na" ? "N/A" : "TODO"}
                  </Text>
                  <Text style={pdfStyles.notes}>{i.notes || "—"}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}

export default function DueDiligencePage() {
  const [hotelName, setHotelName] = useState("");
  const [items, setItems] = useState<DDItem[]>(
    DD_ITEMS.map((it) => ({ ...it, status: "todo", notes: "" })),
  );

  const progress = useMemo(() => {
    const done = items.filter((it) => it.status !== "todo").length;
    const ok = items.filter((it) => it.status === "ok").length;
    const nc = items.filter((it) => it.status === "nc").length;
    const criticalNc = items.filter((it) => it.critical && it.status === "nc").length;
    return { total: items.length, done, ok, nc, criticalNc, pct: (done / items.length) * 100 };
  }, [items]);

  const setItem = (id: string, patch: Partial<DDItem>) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...patch } : it));
  };

  const downloadPdf = async () => {
    const blob = await pdf(<DdPdf hotelName={hotelName || "Hôtel"} items={items} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `due-diligence-${(hotelName || "hotel").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">&larr; Hôtellerie</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Due diligence hôtelière — 50 points</h1>
          <p className="mt-2 text-muted">
            Checklist exhaustive pré-acquisition : technique, commercial, juridique, fiscal, ESG, RH. Items critiques marqués ★.
            Inspiré HVS / Cushman & Wakefield Hospitality. Exportable en PDF pour dossier investisseur/banquier.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <input type="text" placeholder="Nom de l'hôtel" value={hotelName}
            onChange={(e) => setHotelName(e.target.value)}
            className="flex-1 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          <button onClick={downloadPdf}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            📄 Exporter PDF
          </button>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">Progrès</div>
            <div className="mt-1 text-2xl font-bold text-navy">{progress.pct.toFixed(0)}%</div>
            <div className="text-xs text-muted">{progress.done}/{progress.total}</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs text-emerald-700">OK</div>
            <div className="mt-1 text-2xl font-bold text-emerald-800">{progress.ok}</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-xs text-rose-700">Non-conformités</div>
            <div className="mt-1 text-2xl font-bold text-rose-800">{progress.nc}</div>
          </div>
          <div className="rounded-xl border border-rose-300 bg-rose-100 p-4">
            <div className="text-xs text-rose-800">★ Critiques NC</div>
            <div className="mt-1 text-2xl font-bold text-rose-900">{progress.criticalNc}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">À traiter</div>
            <div className="mt-1 text-2xl font-bold text-navy">{progress.total - progress.done}</div>
          </div>
        </div>

        {(Object.keys(CATEGORY_LABELS) as DDItem["category"][]).map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          return (
            <div key={cat} className="mb-6 rounded-xl border border-card-border bg-card overflow-hidden">
              <div className={`px-4 py-2 ${CATEGORY_LABELS[cat].color} border-b border-card-border`}>
                <span className="text-sm font-semibold">{CATEGORY_LABELS[cat].label} ({catItems.length} points)</span>
              </div>
              <div className="divide-y divide-card-border/50">
                {catItems.map((it) => (
                  <div key={it.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-sm text-navy">
                          {it.critical && <span className="text-rose-600 mr-1">★</span>}
                          {it.label}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {(["ok", "nc", "na"] as const).map((s) => (
                          <button key={s} onClick={() => setItem(it.id, { status: it.status === s ? "todo" : s })}
                            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                              it.status === s
                                ? s === "ok" ? "bg-emerald-600 text-white" : s === "nc" ? "bg-rose-600 text-white" : "bg-slate-500 text-white"
                                : "border border-card-border text-muted"
                            }`}>
                            {s === "ok" ? "OK" : s === "nc" ? "NC" : "N/A"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input type="text" value={it.notes}
                      onChange={(e) => setItem(it.id, { notes: e.target.value })}
                      placeholder="Notes / réserves"
                      className="mt-1.5 w-full rounded border border-card-border/50 bg-transparent px-2 py-1 text-[11px]" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <AiAnalysisCard
          context={[
            `Due diligence hôtelière — ${hotelName || "Hôtel"}`,
            `Progrès: ${progress.done}/${progress.total} (${progress.pct.toFixed(0)}%)`,
            `OK: ${progress.ok} · NC: ${progress.nc} · ★ critiques NC: ${progress.criticalNc}`,
            "",
            `Items critiques NC:`,
            ...items.filter((i) => i.critical && i.status === "nc").map((i) => `  [${i.category.toUpperCase()}] ${i.label} — ${i.notes || "pas de note"}`),
            "",
            `Items NC non-critiques:`,
            ...items.filter((i) => !i.critical && i.status === "nc").slice(0, 10).map((i) => `  [${i.category}] ${i.label}`),
          ].join("\n")}
          prompt="Analyse cette due diligence hôtelière Luxembourg. Livre : (1) synthèse du risque global (feu vert / orange / rouge) en fonction des ★ critiques NC, (2) top 3 des points à sécuriser AVANT signature (LOI non-binding / SPA), (3) conditions suspensives recommandées, (4) impact probable sur le prix (décote/escrow/warranty selon gravité), (5) recommandation d'avancement de la transaction : go / go-conditionnel / stop. Référence HVS / Cushman & Wakefield Hospitality standards. Concret pour un investisseur/banquier."
        />
      </div>
    </div>
  );
}
