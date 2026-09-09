/** Preliminary document screening: activity 7.7, climate mitigation only.
 * Regulation 2021/2139 Annex I, consolidated 2026-01-01; 2023/267 FAQ 140–145.
 * No estimated Luxembourg thresholds and no certification of evidence.
 */
export const EPC_CLASS_ORDER=['A+','A','B','C','D','E','F','G','H','I'] as const;
export type Evidence='unknown'|'yes'|'no';
export type TaxonomyInput={
 period:'unknown'|'before'|'after'; use:'unknown'|'residential'|'nonResidential';
 route:'epc'|'top15';epc:string;ped:number;threshold:number;area:number;power:number;
 epcEvidence:Evidence;thresholdEvidence:Evidence;envelope:Evidence;gwp:Evidence;
 monitoring:Evidence;adaptation:Evidence;safeguards:Evidence;
};
export const EMPTY_TAXONOMY:TaxonomyInput={period:'unknown',use:'unknown',route:'epc',epc:'',ped:NaN,threshold:NaN,area:NaN,power:NaN,epcEvidence:'unknown',thresholdEvidence:'unknown',envelope:'unknown',gwp:'unknown',monitoring:'unknown',adaptation:'unknown',safeguards:'unknown'};
export type CheckStatus='met'|'unmet'|'missing'|'notApplicable';
export type TaxonomyCheck={key:string;status:CheckStatus};
const evidence=(s:Evidence):CheckStatus=>s==='yes'?'met':s==='no'?'unmet':'missing';
const valid=(n:number,min=0)=>Number.isFinite(n)&&n>=min&&n<=1e12;
export function screenTaxonomy(i:TaxonomyInput){
 const checks:TaxonomyCheck[]=[];
 const add=(key:string,status:CheckStatus)=>checks.push({key,status});
 let limit:number|null=null;
 add('period',i.period==='unknown'?'missing':'met');
 if(i.period==='before'&&i.route==='epc'){
  add('energy',!EPC_CLASS_ORDER.includes(i.epc as typeof EPC_CLASS_ORDER[number])?'missing':['A+','A'].includes(i.epc)?'met':'unmet');
  add('epcEvidence',evidence(i.epcEvidence));
 }else if(i.period!=='unknown'){
  const numeric=valid(i.ped)&&valid(i.threshold)&&i.threshold>0;
  limit=numeric?i.threshold*(i.period==='after'?0.9:1):null;
  add('energy',limit===null?'missing':i.ped<=limit?'met':'unmet');
  add('thresholdEvidence',evidence(i.thresholdEvidence));
  add('epcEvidence',evidence(i.epcEvidence));
 }
 if(i.period==='after'){
  add('area',valid(i.area)&&i.area>0?'met':'missing');
  for(const key of ['envelope','gwp'] as const)add(key,!valid(i.area)||i.area<=0?'missing':i.area>5000?evidence(i[key]):'notApplicable');
 }
 add('use',i.use==='unknown'?'missing':'met');
 if(i.use==='nonResidential'){
  add('power',valid(i.power)?'met':'missing');
  add('monitoring',!valid(i.power)?'missing':i.power>290?evidence(i.monitoring):'notApplicable');
 }else add('monitoring',i.use==='unknown'?'missing':'notApplicable');
 add('adaptation',evidence(i.adaptation));add('safeguards',evidence(i.safeguards));
 return{checks,limit,status:checks.some(c=>c.status==='unmet')?'issues':checks.some(c=>c.status==='missing')?'incomplete':'review'};
}
export const TAXONOMY_SOURCES=['https://eur-lex.europa.eu/eli/reg_del/2021/2139/2026-01-01','https://eur-lex.europa.eu/eli/C/2023/267/oj','https://eur-lex.europa.eu/eli/reg/2020/852/oj'];
