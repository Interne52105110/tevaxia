import type {
  RenovationHotelInputs,
  RenovationHotelLine,
  RenovationHotelResult,
} from "./types";

interface PostRenovation {
  poste: string;
  coutParChambre: number;
  reductionPct: number;
  tauxAideKlimabonus: number;
}

const POSTES: Record<keyof Pick<RenovationHotelInputs, "travauxIsolation" | "travauxCVC" | "travauxECS" | "travauxLED" | "travauxFenetres">, PostRenovation> = {
  travauxIsolation: {
    poste: "Isolation enveloppe (toiture, façade)",
    coutParChambre: 8500,
    reductionPct: 0.30,
    tauxAideKlimabonus: 0, // Aucun taux réglementaire présumé.
  },
  travauxCVC: {
    poste: "CVC (chauffage / ventilation / clim)",
    coutParChambre: 6500,
    reductionPct: 0.25,
    tauxAideKlimabonus: 0, // Aucun taux réglementaire présumé.
  },
  travauxECS: {
    poste: "Eau chaude sanitaire (PAC, solaire)",
    coutParChambre: 2200,
    reductionPct: 0.10,
    tauxAideKlimabonus: 0, // Aucun taux réglementaire présumé.
  },
  travauxLED: {
    poste: "Éclairage LED + GTB",
    coutParChambre: 800,
    reductionPct: 0.08,
    tauxAideKlimabonus: 0, // Aucun taux réglementaire présumé.
  },
  travauxFenetres: {
    poste: "Menuiseries (triple vitrage)",
    coutParChambre: 4500,
    reductionPct: 0.15,
    tauxAideKlimabonus: 0, // Aucun taux réglementaire présumé.
  },
};

const ACTUALISATION_RATE = 0.04;
const HORIZON_YEARS = 10;

export function computeRenovationHotel(input: RenovationHotelInputs): RenovationHotelResult {
  for (const n of [input.surfaceChauffeeM2,input.nbChambres,input.consoActuelleKwhM2,input.consoCibleKwhM2,input.prixKwhMoyen,input.adr,input.occupancy,input.gainRevparPctViaLabel,input.aidesConfirmees ?? 0,input.coutTravauxSaisi ?? 0,input.margeRecettesSupplementaires ?? 0,input.entretienAnnuelSupplementaire ?? 0]) if(!Number.isFinite(n) || n<0)throw new RangeError('Invalid renovation data');
  if(!Number.isInteger(input.nbChambres) || (input.margeRecettesSupplementaires ?? 0)>1)throw new RangeError('Invalid room count or contribution margin');
  if (input.surfaceChauffeeM2 <= 0) throw new Error("surfaceChauffeeM2 must be > 0");
  if (input.nbChambres <= 0) throw new Error("nbChambres must be > 0");
  if (input.consoActuelleKwhM2 <= 0) throw new Error("consoActuelleKwhM2 must be > 0");
  if (input.prixKwhMoyen <= 0) throw new Error("prixKwhMoyen must be > 0");
  if (input.adr < 0 || input.occupancy < 0 || input.occupancy > 1) {
    throw new Error("Invalid ADR / occupancy");
  }

  for(const key of Object.keys(POSTES) as Array<keyof typeof POSTES>)if(typeof input[key] !== 'boolean')throw new RangeError('Invalid work selection');
  const lines: RenovationHotelLine[] = [];
  let coutBrutTotal = 0;
  let aideTotal = 0;
  let consommationRelative = 1;

  for (const [key, post] of Object.entries(POSTES) as Array<[keyof typeof POSTES, PostRenovation]>) {
    const retenu = input[key];
    const coutBrut = retenu ? post.coutParChambre * input.nbChambres : 0;
    const aide = coutBrut * post.tauxAideKlimabonus;
    const coutNet = coutBrut - aide;
    if (retenu) {
      coutBrutTotal += coutBrut;
      aideTotal += aide;
      consommationRelative *= (1 - post.reductionPct); // Hypothèse de scénario, pas un diagnostic.
    }
    lines.push({
      poste: post.poste,
      retenu,
      coutBrut,
      tauxAideKlimabonus: post.tauxAideKlimabonus,
      aide,
      coutNet,
    });
  }

  const travauxRetenus = lines.some(l=>l.retenu);
  if(input.coutTravauxSaisi !== undefined){
    if(!travauxRetenus && input.coutTravauxSaisi>0)throw new RangeError('Select at least one work item');
    const ratio=coutBrutTotal>0?input.coutTravauxSaisi/coutBrutTotal:0;
    for(const line of lines)line.coutBrut*=ratio;
    coutBrutTotal=input.coutTravauxSaisi;
  }
  aideTotal=input.aidesConfirmees ?? 0;
  if(aideTotal>coutBrutTotal)throw new RangeError('Confirmed aid exceeds cost');
  for(const line of lines){
    line.aide=coutBrutTotal>0?aideTotal*line.coutBrut/coutBrutTotal:0;
    line.coutNet=line.coutBrut-line.aide;
    // Champ historique : ratio comptable de l'aide saisie, jamais un barème Klimabonus.
    line.tauxAideKlimabonus=line.coutBrut>0?line.aide/line.coutBrut:0;
  }
  const coutNetTotal = coutBrutTotal - aideTotal;

  const consoAvantKwh = input.consoActuelleKwhM2 * input.surfaceChauffeeM2;
  const consoCible = input.consoCibleKwhM2 > 0
    ? input.consoCibleKwhM2 * input.surfaceChauffeeM2
    : consoAvantKwh * consommationRelative;
  const consoApresKwh = travauxRetenus ? consoCible : consoAvantKwh;
  const reductionKwh = consoAvantKwh - consoApresKwh;
  const economiesAnnuelles = reductionKwh * input.prixKwhMoyen;

  const revenuRoomsAnnuel = input.adr * input.occupancy * 365 * input.nbChambres;
  const gainRevparAnnuel = travauxRetenus ? revenuRoomsAnnuel * (input.gainRevparPctViaLabel / 100) * (input.margeRecettesSupplementaires ?? 0) : 0;
  const economieNette = economiesAnnuelles - (travauxRetenus ? input.entretienAnnuelSupplementaire ?? 0 : 0);

  const paybackSansLabel = economieNette > 0 ? coutNetTotal / economieNette : Infinity;
  const totalAnnualBenefit = economieNette + gainRevparAnnuel;
  const paybackAvecLabel = totalAnnualBenefit > 0 ? coutNetTotal / totalAnnualBenefit : Infinity;

  let vanDixAns = -coutNetTotal;
  for (let y = 1; y <= HORIZON_YEARS; y++) {
    vanDixAns += totalAnnualBenefit / Math.pow(1 + ACTUALISATION_RATE, y);
  }

  if(![coutBrutTotal,coutNetTotal,consoAvantKwh,consoApresKwh,economiesAnnuelles,gainRevparAnnuel,vanDixAns].every(Number.isFinite))throw new RangeError('Projection exceeds numerical limits');
  return {
    lines,
    coutBrutTotal,
    aideKlimabonusTotal: aideTotal,
    coutNetTotal,
    consoAvantKwh,
    consoApresKwh,
    reductionKwh,
    economiesAnnuelles,
    gainRevparAnnuel,
    paybackSansLabel,
    paybackAvecLabel,
    vanDixAns,
  };
}
