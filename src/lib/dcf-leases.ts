// ============================================================
// DCF MULTI-LOCATAIRES — Modélisation bail par bail
// ============================================================
// Modélisation bail par bail : chaque locataire avec ses propres conditions
// avec ses propres dates, loyer, indexation, franchise, renouvellement.



export interface Lease {
  id: string;
  locataire: string;
  surface: number; // m²
  loyerAnnuel: number; // Loyer annuel courant à la date de valeur, ou initial si bail futur
  dateDebut: string; // YYYY-MM
  dateFin: string; // YYYY-MM
  dateBreak?: string; // YYYY-MM, sortie retenue en fin de mois dans ce scénario
  probabiliteRenouvellement: number; // 0-100%
  ervM2: number; // Loyer de marché estimé au renouvellement (€/m²/an)
  indexation: number; // % annuel d'indexation contractuelle
  stepRents?: { annee: number; nouveauLoyer: number }[]; // Paliers de loyer (année relative + montant)
  franchiseMois: number; // Mois de franchise (rent-free) à l'entrée
  fitOutContribution: number; // Participation aménagement (€)
  chargesLocataire: number; // Charges refacturées annuelles
}

export interface DCFLeaseInput {
  leases: Lease[];
  periodeAnalyse: number; // années
  tauxActualisation: number; // %
  tauxCapSortie: number; // %
  fraisCessionPct: number; // %
  chargesProprietaireFixe: number; // charges non récup annuelles
  vacanceERV: number; // % de vacance appliqué sur les périodes vides
  capexAnnuel?: number; // Annual recurring reserve, also deducted from terminal cash flow
  dateValeur: string; // YYYY-MM
}

export interface DCFLeaseAnnualCF {
  annee: number;
  loyers: number; // Total loyers contractuels
  franchises: number; // Déduction franchises
  chargesRecuperees: number;
  loyerBrutEffectif: number;
  vacanceLots: string[]; // Lots vacants cette année
  loyerVacance: number; // Perte vacance
  chargesProprietaire: number;
  noi: number;
  facteurActu: number;
  noiActualise: number;
  fitOut: number;
  capex: number;
  fluxNet: number;
  fluxActualise: number;
}

export interface DCFLeaseResult {
  cashFlows: DCFLeaseAnnualCF[];
  totalNOIActualise: number;
  // Terminal value
  noiStabilise: number; // NOI stabilisé (tous baux renouvelés à ERV)
  valeurTerminaleBrute: number;
  fraisCession: number;
  valeurTerminaleNette: number;
  valeurTerminaleActualisee: number;
  valeurDCF: number;
  irr: null; // A valuation discount rate is not an independently measured investment IRR
  fluxTerminal: number;
  totalFluxActualise: number;
  monthly: {date:string;leaseId:string;locataire:string;loyer:number;franchise:number;vacance:number;chargesRecuperees:number;fitOut:number}[];
  // Métriques
  surfaceTotale: number;
  loyerTotalAnnuel: number;
  loyerMoyenM2: number;
  ervMoyenM2: number;
  tauxOccupation: number; // % de surface louée
  wault: number; // Weighted Average Unexpired Lease Term
  potentielReversion: number; // % ERV vs loyer en place
  // Détail par locataire
  leaseDetails: {
    locataire: string;
    surface: number;
    loyerAnnuel: number;
    loyerM2: number;
    ervM2: number;
    ecartERV: number; // %
    dureeRestante: number; // années
    pctSurface: number;
    pctLoyer: number;
  }[];
}

export function leaseMonthIndex(value:string):number {
  if(typeof value!=='string'||!/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(value))throw new RangeError('Invalid month; expected YYYY-MM in 1900–2199');
  const [y,m]=value.split('-').map(Number);return y*12+m-1;
}
const monthLabel=(m:number)=>`${Math.floor(m/12)}-${String(m%12+1).padStart(2,'0')}`;
const amount=(n:number)=>Number.isFinite(n)&&n>=0&&n<=1e12;
const percent=(n:number)=>Number.isFinite(n)&&n>=0&&n<=100;

export function validateDcfLease(l:Lease){
    const start=leaseMonthIndex(l.dateDebut),end=leaseMonthIndex(l.dateFin),exit=l.dateBreak?leaseMonthIndex(l.dateBreak):end;
    if(!l.id||!l.locataire.trim()||!amount(l.surface)||l.surface===0||![l.loyerAnnuel,l.ervM2,l.fitOutContribution,l.chargesLocataire].every(amount)||!percent(l.probabiliteRenouvellement)||!Number.isFinite(l.indexation)||l.indexation < -100||l.indexation>100||!Number.isInteger(l.franchiseMois)||l.franchiseMois<0||l.franchiseMois>120||end<start||exit<start||exit>end)throw new RangeError('Invalid lease');
    const steps=l.stepRents??[];
    if(new Set(steps.map(s=>s.annee)).size!==steps.length||steps.some(s=>!Number.isInteger(s.annee)||s.annee<1||s.annee>300||!amount(s.nouveauLoyer)))throw new RangeError('Invalid rent steps');
    return {l,start,end:exit,steps:steps.map(s=>({month:start+(s.annee-1)*12,rent:s.nouveauLoyer})).sort((a,b)=>a.month-b.month)};
}

export function calculerDCFLeases(input:DCFLeaseInput):DCFLeaseResult {
  const {leases,periodeAnalyse,tauxActualisation,tauxCapSortie,fraisCessionPct,chargesProprietaireFixe,vacanceERV,dateValeur,capexAnnuel=0}=input;
  const valuation=leaseMonthIndex(dateValeur);
  if(!Array.isArray(leases)||leases.length<1||leases.length>100||!Number.isInteger(periodeAnalyse)||periodeAnalyse<1||periodeAnalyse>50||!percent(tauxActualisation)||!percent(tauxCapSortie)||tauxCapSortie===0||!percent(fraisCessionPct)||!percent(vacanceERV)||!amount(chargesProprietaireFixe)||!amount(capexAnnuel)||valuation+12*(periodeAnalyse+1)>=2200*12)throw new RangeError('Invalid multi-lease DCF inputs');
  const ids=new Set<string>();
  const records=leases.map(l=>{if(ids.has(l.id))throw new RangeError('Duplicate lease id');ids.add(l.id);const r=validateDcfLease(l);return {...r,anchor:Math.max(r.start,valuation)}});
  const monthly:DCFLeaseResult['monthly']=[];
  const projectYear=(year:number,save:boolean):DCFLeaseAnnualCF=>{
    let loyers=0,franchises=0,chargesRecuperees=0,loyerVacance=0,fitOut=0;const vacancies=new Set<string>();
    for(let offset=0;offset<12;offset++){
      const month=valuation+(year-1)*12+offset;
      for(const r of records){
        const {l,start,end,anchor,steps}=r;let rent=0,free=0,loss=0,recovery=0;
        if(month>=start&&month<=end){
          // Declared rent is current at valuation, or initial at a future lease start.
          // Future steps override it; historical steps are already reflected in current rent.
          const step=steps.filter(s=>s.month>=anchor&&s.month<=month).at(-1);
          const base=step?.rent??l.loyerAnnuel,baseMonth=step?.month??anchor;
          rent=base*Math.pow(1+l.indexation/100,Math.floor((month-baseMonth)/12))/12;
          if(month<start+l.franchiseMois)free=rent;
          recovery=l.chargesLocataire/12;
        }else if(month>end){
          rent=l.ervM2*l.surface/12;
          const retained=l.probabiliteRenouvellement/100*(1-vacanceERV/100);
          loss=rent*(1-retained);recovery=l.chargesLocataire/12*retained;
          if(loss>0)vacancies.add(l.locataire);
        }
        const contribution=month===start?l.fitOutContribution:0;
        loyers+=rent;franchises+=free;chargesRecuperees+=recovery;loyerVacance+=loss;fitOut+=contribution;
        if(save)monthly.push({date:monthLabel(month),leaseId:l.id,locataire:l.locataire,loyer:rent,franchise:free,vacance:loss,chargesRecuperees:recovery,fitOut:contribution});
      }
    }
    const loyerBrutEffectif=loyers-franchises-loyerVacance;
    // Tenant reimbursements are paired with equal expenses, not treated as profit.
    const chargesProprietaire=chargesProprietaireFixe+chargesRecuperees;
    const noi=loyerBrutEffectif+chargesRecuperees-chargesProprietaire;
    const facteurActu=1/Math.pow(1+tauxActualisation/100,year),fluxNet=noi-fitOut-capexAnnuel;
    const result={annee:year,loyers,franchises,chargesRecuperees,loyerBrutEffectif,vacanceLots:[...vacancies],loyerVacance,chargesProprietaire,noi,facteurActu,noiActualise:noi*facteurActu,fitOut,capex:capexAnnuel,fluxNet,fluxActualise:fluxNet*facteurActu};
    if(Object.values(result).some(v=>typeof v==='number'&&!Number.isFinite(v)))throw new RangeError('Cash-flow overflow');
    return result;
  };
  const cashFlows=Array.from({length:periodeAnalyse},(_,i)=>projectYear(i+1,true)),terminal=projectYear(periodeAnalyse+1,false);
  const totalNOIActualise=cashFlows.reduce((s,c)=>s+c.noiActualise,0),totalFluxActualise=cashFlows.reduce((s,c)=>s+c.fluxActualise,0);
  const noiStabilise=terminal.noi,fluxTerminal=noiStabilise-capexAnnuel;
  if(fluxTerminal<=0)throw new RangeError('A positive recurring terminal cash flow is required');
  // Capitalize year N+1 recurring cash flow; deduct its known one-off fit-out at its year-end PV.
  const valeurTerminaleBrute=fluxTerminal/(tauxCapSortie/100),fraisCession=valeurTerminaleBrute*fraisCessionPct/100;
  const valeurTerminaleNette=valeurTerminaleBrute-fraisCession-terminal.fitOut/(1+tauxActualisation/100);
  const valeurTerminaleActualisee=valeurTerminaleNette/Math.pow(1+tauxActualisation/100,periodeAnalyse),valeurDCF=totalFluxActualise+valeurTerminaleActualisee;
  if(![valeurTerminaleBrute,valeurTerminaleNette,valeurTerminaleActualisee,valeurDCF].every(Number.isFinite))throw new RangeError('Valuation overflow');
  const active=records.filter(r=>r.start<=valuation&&r.end>=valuation),surfaceTotale=leases.reduce((s,l)=>s+l.surface,0),activeArea=active.reduce((s,r)=>s+r.l.surface,0);
  const loyerTotalAnnuel=active.reduce((s,r)=>s+r.l.loyerAnnuel,0),ervTotal=leases.reduce((s,l)=>s+l.ervM2*l.surface,0);
  const wault=activeArea>0?active.reduce((s,r)=>s+r.l.surface*(r.end-valuation+1)/12,0)/activeArea:0;
  const leaseDetails=records.map(r=>{const {l}=r,isActive=r.start<=valuation&&r.end>=valuation;return {locataire:l.locataire,surface:l.surface,loyerAnnuel:l.loyerAnnuel,loyerM2:l.loyerAnnuel/l.surface,ervM2:l.ervM2,ecartERV:l.loyerAnnuel>0?(l.ervM2*l.surface/l.loyerAnnuel-1)*100:0,dureeRestante:isActive?(r.end-valuation+1)/12:0,pctSurface:100*l.surface/surfaceTotale,pctLoyer:isActive&&loyerTotalAnnuel>0?100*l.loyerAnnuel/loyerTotalAnnuel:0}});
  return {cashFlows,totalNOIActualise,totalFluxActualise,monthly,noiStabilise,fluxTerminal,valeurTerminaleBrute,fraisCession,valeurTerminaleNette,valeurTerminaleActualisee,valeurDCF,irr:null,surfaceTotale,loyerTotalAnnuel,loyerMoyenM2:loyerTotalAnnuel/surfaceTotale,ervMoyenM2:ervTotal/surfaceTotale,tauxOccupation:100*activeArea/surfaceTotale,wault,potentielReversion:loyerTotalAnnuel>0?(ervTotal/loyerTotalAnnuel-1)*100:0,leaseDetails};
}
