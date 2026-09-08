/** Cash-flow scenario; does not infer grants, energy consumption or market value from a CPE class. */
export interface RenovationScenarioInput {
  travauxTTC: number;
  honorairesTTC: number;
  aidesConfirmees: number;
  anneeVersementAides: number;
  factureAvant: number;
  factureApres: number;
  entretienSupplementaire: number;
  hausseEnergiePct: number;
  actualisationPct: number;
  horizonAns: number;
  montantPret: number;
  tauxPretPct: number;
  dureePretAns: number;
}
export interface RenovationScenarioResult {
  coutTotal: number;
  coutNetAides: number;
  besoinInitial: number;
  apportInitial: number;
  economieEnergieAn1: number;
  economieNetteAn1: number;
  mensualite: number;
  interetsPret: number;
  soldeAnnuelApresCredit: number;
  van: number;
  triPct: number | null;
  anneeRetour: number | null;
  flux: { annee: number; energie: number; entretien: number; aides: number; flux: number; cumule: number; actualise: number }[];
}
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export function calculerScenarioRenovation(input: RenovationScenarioInput): RenovationScenarioResult {
  const values=['travauxTTC','honorairesTTC','aidesConfirmees','anneeVersementAides','factureAvant','factureApres','entretienSupplementaire','hausseEnergiePct','actualisationPct','horizonAns','montantPret','tauxPretPct','dureePretAns'].map(k=>input[k as keyof RenovationScenarioInput]);
  if (values.some(n=>typeof n !== 'number' || !Number.isFinite(n))) throw new RangeError('Données non numériques.');
  for (const k of ['travauxTTC','honorairesTTC','aidesConfirmees','factureAvant','factureApres','entretienSupplementaire','montantPret','tauxPretPct'] as const) if(input[k]<0)throw new RangeError('Montant négatif.');
  if (!Number.isInteger(input.horizonAns) || input.horizonAns<1 || input.horizonAns>50 || !Number.isInteger(input.dureePretAns) || input.dureePretAns<1 || input.dureePretAns>40 || !Number.isInteger(input.anneeVersementAides) || input.anneeVersementAides<0 || input.anneeVersementAides>input.horizonAns || input.hausseEnergiePct<=-100 || input.hausseEnergiePct>100 || input.actualisationPct<=-100 || input.actualisationPct>100 || input.tauxPretPct>100)throw new RangeError('Durée ou taux hors limites.');
  const coutTotal=input.travauxTTC+input.honorairesTTC;
  if(!Number.isFinite(coutTotal))throw new RangeError('Coût hors limites.');
  if(input.aidesConfirmees>coutTotal)throw new RangeError('Les aides dépassent le coût.');
  const besoinInitial=coutTotal-(input.anneeVersementAides===0?input.aidesConfirmees:0);
  if(input.montantPret>besoinInitial)throw new RangeError('Le prêt dépasse le besoin initial.');
  const eco=input.factureAvant-input.factureApres, net=eco-input.entretienSupplementaire;
  const m=input.dureePretAns*12,r=input.tauxPretPct/1200;
  const mensualite=input.montantPret===0?0:r===0?input.montantPret/m:input.montantPret*r/(-Math.expm1(-m*Math.log1p(r)));
  let cumule=-besoinInitial, van=-besoinInitial;
  let anneeRetour: number|null=besoinInitial===0?0:null;
  const cashflows=[-besoinInitial];
  const flux=[];
  for(let annee=1;annee<=input.horizonAns;annee++){
    const energie=eco*Math.pow(1+input.hausseEnergiePct/100,annee-1);
    const aides=annee===input.anneeVersementAides?input.aidesConfirmees:0;
    const cash=energie-input.entretienSupplementaire+aides;
    const actualise=cash/Math.pow(1+input.actualisationPct/100,annee);
    cumule+=cash;van+=actualise;cashflows.push(cash);
    if(![energie,cash,cumule,van,mensualite].every(Number.isFinite))throw new RangeError('Projection hors limites numériques.');
    if(anneeRetour===null && cumule>=0)anneeRetour=annee;
    flux.push({annee,energie:round(energie),entretien:input.entretienSupplementaire,aides,flux:round(cash),cumule:round(cumule),actualise:round(actualise)});
  }
  // Only the conventional, unique-IRR case is quoted. Negative IRRs remain negative.
  let triPct: number|null=null;
  if(besoinInitial>0 && cashflows.slice(1).every(n=>n>=0) && cashflows.slice(1).some(n=>n>0)){
    const npv=(t:number)=>cashflows.reduce((s,n,y)=>s+n/Math.pow(1+t,y),0);
    let low=-.999999, high=1;
    while(npv(high)>0 && high<1e12)high*=2;
    if(npv(low)>0 && npv(high)<=0){
      for(let i=0;i<150;i++){const mid=(low+high)/2;if(npv(mid)>0)low=mid;else high=mid;}
      triPct=round((low+high)/2*100);
    }
  }
  return {coutTotal:round(coutTotal),coutNetAides:round(coutTotal-input.aidesConfirmees),besoinInitial:round(besoinInitial),apportInitial:round(besoinInitial-input.montantPret),economieEnergieAn1:round(eco),economieNetteAn1:round(net),mensualite:round(mensualite),interetsPret:round(mensualite*m-input.montantPret),soldeAnnuelApresCredit:round(net-mensualite*12),van:round(van),triPct,anneeRetour,flux};
}
