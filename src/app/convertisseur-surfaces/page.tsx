"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import SliderField from "@/components/SliderField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";

/* ------------------------------------------------------------------ */
/*  ACT coefficients for weighted accessories                         */
/* ------------------------------------------------------------------ */
const ACT_COEFFICIENTS = {
  balcons:    { base: 0.40, reduced: 0.30, seuil: 20 },
  terrasses:  { base: 0.40, reduced: 0.30, seuil: 20 },
  terrassesVerdure: { base: 0.20, reduced: 0.10, seuil: 20 },
  caves:      { base: 0.50, reduced: 0.50, seuil: Infinity },
  garages:    { base: 0.50, reduced: 0.50, seuil: Infinity },
  loggias:    { base: 0.50, reduced: 0.50, seuil: Infinity },
} as const;

/** Weighted surface with ACT degressive rule */
function weightedSurface(surface: number, coeff: typeof ACT_COEFFICIENTS[keyof typeof ACT_COEFFICIENTS]): number {
  if (surface <= 0) return 0;
  if (surface <= coeff.seuil) return surface * coeff.base;
  return coeff.seuil * coeff.base + (surface - coeff.seuil) * coeff.reduced;
}

/** Effective average coefficient after degressive rule */
function effectiveCoeff(surface: number, coeff: typeof ACT_COEFFICIENTS[keyof typeof ACT_COEFFICIENTS]): number {
  if (surface <= 0) return coeff.base;
  return weightedSurface(surface, coeff) / surface;
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                */
/* ------------------------------------------------------------------ */
function fmtM2(v: number): string {
  return `${v.toLocaleString("fr-LU", { maximumFractionDigits: 1 })} m²`;
}

function fmtPct(v: number): string {
  return `${(v * 100).toLocaleString("fr-LU", { maximumFractionDigits: 1 })} %`;
}

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */
export default function ConvertisseurSurfaces() {
  // --- Surface de référence ---
  const [surfaceReference, setSurfaceReference] = useState(2500);
  const [typeSurface, setTypeSurface] = useState<"scb" | "scp" | "su" | "shab">("scb");
  const [nbNiveaux, setNbNiveaux] = useState(3);

  // --- Épaisseurs structurelles ---
  const [epaisseurMursExt, setEpaisseurMursExt] = useState(35);
  const [epaisseurMursPorteurs, setEpaisseurMursPorteurs] = useState(20);
  const [partiesCommunes, setPartiesCommunes] = useState(12);

  // --- Accessoires ---
  const [surfaceBalcons, setSurfaceBalcons] = useState(0);
  const [surfaceTerrasses, setSurfaceTerrasses] = useState(0);
  const [surfaceTerrassesVerdure, setSurfaceTerrassesVerdure] = useState(0);
  const [surfaceCaves, setSurfaceCaves] = useState(0);
  const [surfaceGarages, setSurfaceGarages] = useState(0);
  const [surfaceLoggias, setSurfaceLoggias] = useState(0);

  // --- Paramètres ---
  const [typeBatiment, setTypeBatiment] = useState<"immeuble" | "maison_individuelle" | "maison_jumelee">("immeuble");
  const [hauteurMinCounting, setHauteurMinCounting] = useState(2.0);
  const [pctSousHauteur, setPctSousHauteur] = useState(3);

  // --- Projection financière ---
  const [prixM2, setPrixM2] = useState(8500);

  /* ================================================================ */
  /*  Calculations                                                     */
  /* ================================================================ */
  const result = useMemo(() => {
    // ------ Conversion ratios derived from structural parameters ------
    // SCB → SCP
    let scbToScp: number;
    switch (typeBatiment) {
      case "immeuble":
        scbToScp = 0.85 + (50 - epaisseurMursExt) * 0.002;
        break;
      case "maison_individuelle":
        scbToScp = 0.88 + (50 - epaisseurMursExt) * 0.002;
        break;
      case "maison_jumelee":
        scbToScp = 0.87 + (50 - epaisseurMursExt) * 0.002;
        break;
    }

    // SCP → SU
    const scpToSu =
      typeBatiment === "immeuble"
        ? 1 - partiesCommunes / 100 - epaisseurMursPorteurs * 0.003
        : 1 - epaisseurMursPorteurs * 0.003;

    // SU → SHAB
    const suToShab = 1 - pctSousHauteur / 100;

    // Composite ratios
    const scbToSu = scbToScp * scpToSu;
    const scbToShab = scbToSu * suToShab;
    const scpToShab = scpToSu * suToShab;

    // ------ Reverse-compute all surfaces from the reference ------
    let scb: number, scp: number, su: number, shab: number;
    switch (typeSurface) {
      case "scb":
        scb = surfaceReference;
        scp = scb * scbToScp;
        su = scp * scpToSu;
        shab = su * suToShab;
        break;
      case "scp":
        scp = surfaceReference;
        scb = scbToScp > 0 ? scp / scbToScp : 0;
        su = scp * scpToSu;
        shab = su * suToShab;
        break;
      case "su":
        su = surfaceReference;
        scp = scpToSu > 0 ? su / scpToSu : 0;
        scb = scbToScp > 0 ? scp / scbToScp : 0;
        shab = su * suToShab;
        break;
      case "shab":
        shab = surfaceReference;
        su = suToShab > 0 ? shab / suToShab : 0;
        scp = scpToSu > 0 ? su / scpToSu : 0;
        scb = scbToScp > 0 ? scp / scbToScp : 0;
        break;
    }

    // ------ ACT weighted accessories ------
    const wBalcons = weightedSurface(surfaceBalcons, ACT_COEFFICIENTS.balcons);
    const wTerrasses = weightedSurface(surfaceTerrasses, ACT_COEFFICIENTS.terrasses);
    const wTerrassesVerdure = weightedSurface(surfaceTerrassesVerdure, ACT_COEFFICIENTS.terrassesVerdure);
    const wCaves = weightedSurface(surfaceCaves, ACT_COEFFICIENTS.caves);
    const wGarages = weightedSurface(surfaceGarages, ACT_COEFFICIENTS.garages);
    const wLoggias = weightedSurface(surfaceLoggias, ACT_COEFFICIENTS.loggias);
    const totalWeighted = wBalcons + wTerrasses + wTerrassesVerdure + wCaves + wGarages + wLoggias;

    // ------ Surface vendable ------
    const surfaceVendable = shab + totalWeighted;

    // ------ Projection financière ------
    const caVendable = surfaceVendable * prixM2;
    const caHabitable = shab * prixM2;
    const ecart = caVendable - caHabitable;
    const ratioVendableSCB = scb > 0 ? surfaceVendable / scb : 0;

    // ------ Surface per level ------
    const surfaceParNiveau = nbNiveaux > 0 ? scb / nbNiveaux : scb;

    return {
      // Ratios
      scbToScp,
      scpToSu,
      suToShab,
      scbToSu,
      scbToShab,
      scpToShab,
      // Surfaces
      scb,
      scp,
      su,
      shab,
      surfaceParNiveau,
      // Accessories
      wBalcons,
      wTerrasses,
      wTerrassesVerdure,
      wCaves,
      wGarages,
      wLoggias,
      totalWeighted,
      // Vendable
      surfaceVendable,
      // Financier
      caVendable,
      caHabitable,
      ecart,
      ratioVendableSCB,
    };
  }, [
    surfaceReference, typeSurface, nbNiveaux,
    epaisseurMursExt, epaisseurMursPorteurs, partiesCommunes,
    surfaceBalcons, surfaceTerrasses, surfaceTerrassesVerdure,
    surfaceCaves, surfaceGarages, surfaceLoggias,
    typeBatiment, hauteurMinCounting, pctSousHauteur,
    prixM2,
  ]);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Convertisseur de surfaces
          </h1>
          <p className="mt-2 text-muted">
            Conversion entre SCB, SCP, surface utile et surface habitable — normes OAI FC.04 et ILNAS 101:2016
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ======================== INPUTS ======================== */}
          <div className="space-y-6">
            {/* Surface de référence */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Surface de référence</h2>
              <div className="space-y-4">
                <InputField
                  label="Surface connue"
                  value={surfaceReference}
                  onChange={(v) => setSurfaceReference(Number(v))}
                  suffix="m²"
                  min={0}
                  hint="Superficie mesurée ou documentée"
                />
                <InputField
                  label="Type de surface"
                  value={typeSurface}
                  onChange={(v) => setTypeSurface(v as "scb" | "scp" | "su" | "shab")}
                  type="select"
                  options={[
                    { value: "scb", label: "SCB — Surface Construite Brute" },
                    { value: "scp", label: "SCP — Surface de Plancher" },
                    { value: "su", label: "SU — Surface Utile" },
                    { value: "shab", label: "SHAB — Surface Habitable (ILNAS 101)" },
                  ]}
                  hint="Surface à partir de laquelle calculer les autres"
                />
                <InputField
                  label="Nombre de niveaux"
                  value={nbNiveaux}
                  onChange={(v) => setNbNiveaux(Math.max(1, Math.min(20, Number(v))))}
                  min={1}
                  max={20}
                  hint="Nombre de niveaux hors-sol du bâtiment"
                />
              </div>
            </div>

            {/* Épaisseurs structurelles */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Épaisseurs structurelles</h2>
              <div className="space-y-5">
                <SliderField
                  label="Murs extérieurs"
                  value={epaisseurMursExt}
                  onChange={setEpaisseurMursExt}
                  min={20}
                  max={50}
                  step={1}
                  suffix="cm"
                  hint="Épaisseur moyenne des murs de façade (isolation incluse)"
                />
                <SliderField
                  label="Murs porteurs intérieurs"
                  value={epaisseurMursPorteurs}
                  onChange={setEpaisseurMursPorteurs}
                  min={15}
                  max={35}
                  step={1}
                  suffix="cm"
                  hint="Épaisseur moyenne des murs porteurs et refends"
                />
                <SliderField
                  label="Parties communes"
                  value={partiesCommunes}
                  onChange={setPartiesCommunes}
                  min={5}
                  max={25}
                  step={0.5}
                  suffix="%"
                  hint="Halls, escaliers, local technique — en % de la SCP (immeuble collectif uniquement)"
                />
              </div>
            </div>

            {/* Accessoires (pondération ACT) */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Accessoires (pondération ACT)</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Balcons"
                  value={surfaceBalcons}
                  onChange={(v) => setSurfaceBalcons(Number(v))}
                  suffix="m²"
                  min={0}
                  hint="Coeff. 0,40 (0,30 au-delà de 20 m²)"
                />
                <InputField
                  label="Terrasses"
                  value={surfaceTerrasses}
                  onChange={(v) => setSurfaceTerrasses(Number(v))}
                  suffix="m²"
                  min={0}
                  hint="Coeff. 0,40 (0,30 au-delà de 20 m²)"
                />
                <InputField
                  label="Terrasses-verdure"
                  value={surfaceTerrassesVerdure}
                  onChange={(v) => setSurfaceTerrassesVerdure(Number(v))}
                  suffix="m²"
                  min={0}
                  hint="Coeff. 0,20 (0,10 au-delà de 20 m²)"
                />
                <InputField
                  label="Caves"
                  value={surfaceCaves}
                  onChange={(v) => setSurfaceCaves(Number(v))}
                  suffix="m²"
                  min={0}
                  hint="Coeff. 0,50"
                />
                <InputField
                  label="Garages"
                  value={surfaceGarages}
                  onChange={(v) => setSurfaceGarages(Number(v))}
                  suffix="m²"
                  min={0}
                  hint="Coeff. 0,50"
                />
                <InputField
                  label="Loggias"
                  value={surfaceLoggias}
                  onChange={(v) => setSurfaceLoggias(Number(v))}
                  suffix="m²"
                  min={0}
                  hint="Coeff. 0,50"
                />
              </div>
            </div>

            {/* Paramètres */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Paramètres</h2>
              <div className="space-y-5">
                <InputField
                  label="Type de bâtiment"
                  value={typeBatiment}
                  onChange={(v) => setTypeBatiment(v as "immeuble" | "maison_individuelle" | "maison_jumelee")}
                  type="select"
                  options={[
                    { value: "immeuble", label: "Immeuble collectif" },
                    { value: "maison_individuelle", label: "Maison individuelle" },
                    { value: "maison_jumelee", label: "Maison jumelée / en bande" },
                  ]}
                  hint="Influence le ratio SCB → SCP (périmètre de façade vs surface)"
                />
                <SliderField
                  label="Hauteur minimale comptable"
                  value={hauteurMinCounting}
                  onChange={setHauteurMinCounting}
                  min={1.8}
                  max={2.2}
                  step={0.1}
                  suffix="m"
                  hint="Hauteur sous plafond minimale pour la surface habitable (ILNAS 101)"
                />
                <SliderField
                  label="% sous hauteur minimale"
                  value={pctSousHauteur}
                  onChange={setPctSousHauteur}
                  min={0}
                  max={15}
                  step={1}
                  suffix="%"
                  hint="Part de la surface utile sous la hauteur minimale (combles, soupentes)"
                />
              </div>
            </div>

            {/* Projection financière */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Projection financière</h2>
              <SliderField
                label="Prix au m²"
                value={prixM2}
                onChange={setPrixM2}
                min={4000}
                max={15000}
                step={100}
                suffix="€"
                hint="Prix de vente moyen par m² vendable"
              />
            </div>
          </div>

          {/* ======================== RESULTS ======================== */}
          <div className="space-y-6">
            {/* Hero: Surface vendable */}
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-center text-white shadow-lg">
              <div className="text-sm text-white/60">Surface vendable</div>
              <div className="mt-2 text-5xl font-bold">{fmtM2(result.surfaceVendable)}</div>
              <div className="mt-2 text-sm text-white/60">
                SHAB {fmtM2(result.shab)} + accessoires pondérés {fmtM2(result.totalWeighted)}
              </div>
            </div>

            {/* Surfaces calculées */}
            <ResultPanel
              title="Surfaces calculées"
              lines={[
                {
                  label: "SCB — Surface Construite Brute",
                  value: fmtM2(result.scb),
                  highlight: typeSurface === "scb",
                },
                {
                  label: `SCP — Surface de Plancher (${fmtPct(result.scbToScp)})`,
                  value: fmtM2(result.scp),
                  highlight: typeSurface === "scp",
                },
                {
                  label: `SU — Surface Utile (${fmtPct(result.scbToSu)})`,
                  value: fmtM2(result.su),
                  highlight: typeSurface === "su",
                },
                {
                  label: `SHAB — Surface Habitable (${fmtPct(result.scbToShab)})`,
                  value: fmtM2(result.shab),
                  highlight: typeSurface === "shab",
                },
                {
                  label: "Surface vendable",
                  value: fmtM2(result.surfaceVendable),
                  highlight: true,
                  large: true,
                },
                {
                  label: "Surface par niveau (SCB)",
                  value: fmtM2(result.surfaceParNiveau),
                  sub: true,
                },
              ]}
            />

            {/* Ratios de conversion */}
            <ResultPanel
              title="Ratios de conversion"
              lines={[
                { label: "SCB → SCP", value: fmtPct(result.scbToScp) },
                { label: "SCP → SU", value: fmtPct(result.scpToSu) },
                { label: "SU → SHAB", value: fmtPct(result.suToShab) },
                { label: "SCB → SHAB (composé)", value: fmtPct(result.scbToShab), highlight: true },
                { label: "SCP → SHAB (composé)", value: fmtPct(result.scpToShab), sub: true },
              ]}
            />

            {/* Accessoires pondérés (ACT) */}
            <ResultPanel
              title="Accessoires pondérés (ACT)"
              lines={[
                ...(surfaceBalcons > 0
                  ? [{
                      label: `Balcons : ${fmtM2(surfaceBalcons)} × ${effectiveCoeff(surfaceBalcons, ACT_COEFFICIENTS.balcons).toFixed(2)}`,
                      value: fmtM2(result.wBalcons),
                    }]
                  : []),
                ...(surfaceTerrasses > 0
                  ? [{
                      label: `Terrasses : ${fmtM2(surfaceTerrasses)} × ${effectiveCoeff(surfaceTerrasses, ACT_COEFFICIENTS.terrasses).toFixed(2)}`,
                      value: fmtM2(result.wTerrasses),
                    }]
                  : []),
                ...(surfaceTerrassesVerdure > 0
                  ? [{
                      label: `Terrasses-verdure : ${fmtM2(surfaceTerrassesVerdure)} × ${effectiveCoeff(surfaceTerrassesVerdure, ACT_COEFFICIENTS.terrassesVerdure).toFixed(2)}`,
                      value: fmtM2(result.wTerrassesVerdure),
                    }]
                  : []),
                ...(surfaceCaves > 0
                  ? [{
                      label: `Caves : ${fmtM2(surfaceCaves)} × 0,50`,
                      value: fmtM2(result.wCaves),
                    }]
                  : []),
                ...(surfaceGarages > 0
                  ? [{
                      label: `Garages : ${fmtM2(surfaceGarages)} × 0,50`,
                      value: fmtM2(result.wGarages),
                    }]
                  : []),
                ...(surfaceLoggias > 0
                  ? [{
                      label: `Loggias : ${fmtM2(surfaceLoggias)} × 0,50`,
                      value: fmtM2(result.wLoggias),
                    }]
                  : []),
                {
                  label: "Total pondéré",
                  value: fmtM2(result.totalWeighted),
                  highlight: true,
                },
              ]}
            />

            {/* Projection financière */}
            <ResultPanel
              title="Projection financière"
              lines={[
                {
                  label: "CA surface vendable",
                  value: formatEUR(result.caVendable),
                  highlight: true,
                  large: true,
                },
                {
                  label: "CA surface habitable",
                  value: formatEUR(result.caHabitable),
                },
                {
                  label: "Écart (accessoires)",
                  value: formatEUR(result.ecart),
                  sub: true,
                },
                {
                  label: "Ratio vendable / SCB",
                  value: fmtPct(result.ratioVendableSCB),
                },
              ]}
            />

            {/* Sources */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-navy">Sources et références</h3>
              <p className="text-xs leading-relaxed text-muted">
                OAI FC.04 (janv. 2025) — Fiches de calcul des surfaces, Ordre des Architectes et des Ingénieurs-Conseils.
                ILNAS 101:2016 — Norme luxembourgeoise de mesurage de la surface habitable.
                ACT — Guide pratique du cadastre vertical (juill. 2023), Administration du Cadastre et de la Topographie.
                RGD PAG art. 32 — Définition de la Surface Construite Brute.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
