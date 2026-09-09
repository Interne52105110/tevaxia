import type {EnergyAuditReport} from '../components/energy/EnergyAuditPdf';
export const LENOZ_THRESHOLDS=[{level:1,global:85,category:40},{level:2,global:70,category:35},{level:3,global:55,category:30},{level:4,global:40,category:0}] as const;
export const LENOZ_INPUT_KEYS=['global','economy','ecology','building','functionality'] as const;
export type LenozInputs=Record<typeof LENOZ_INPUT_KEYS[number],number>;
export const LENOZ_SOURCES=['https://logement.public.lu/fr/professionnels/logement-durable/classification.html','https://guichet.public.lu/fr/entreprises/urbanisme-environnement/energie/lenoz/certificat-lenoz.html','https://logement.public.lu/fr/professionnels/logement-durable/dossier-lenoz.html'];
export function classifyLenozThresholds(i:LenozInputs){
 if(!LENOZ_INPUT_KEYS.every(k=>Number.isFinite(i[k])&&i[k]>=0&&i[k]<=100))throw new RangeError('Invalid percentages');
 const minimum=Math.min(i.economy,i.ecology,i.building,i.functionality);
 const checks=LENOZ_THRESHOLDS.map(t=>({...t,met:i.global>=t.global&&minimum>=t.category}));
 return {level:checks.find(t=>t.met)?.level??0,minimum,checks};
}
export function buildLenozReport(i:LenozInputs,t:(key:string)=>string,locale:string):EnergyAuditReport{
 const r=classifyLenozThresholds(i),pct=(n:number)=>new Intl.NumberFormat(locale==='lb'?'de-DE':locale,{maximumFractionDigits:6}).format(n)+' %';
 return {title:t('title'),sections:[{title:t('scopeTitle'),text:t('intro')+' '+t('scope')},
 {title:t('inputs'),rows:LENOZ_INPUT_KEYS.map(k=>({label:t(k),value:pct(i[k])}))},
 {title:t('result'),text:t('level'+r.level)+' '+t('resultNote')},
 {title:t('thresholds'),text:t('exceptions'),rows:LENOZ_THRESHOLDS.map(v=>({label:t('level'+v.level),value:t('globalShort')+' ≥ '+v.global+' %; '+t('categoryShort')+' ≥ '+v.category+' %'}))}
 ],sources:LENOZ_SOURCES};
}
