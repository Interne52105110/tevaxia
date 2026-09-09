import {getMarketDataCommune,rechercherCommune,type SearchResult} from './market-data';
export interface EstimationHistoryEntry {
 id:string;date:string;commune:string;quartier?:string;adresse?:string;
 surface:number;estimationCentrale:number;prixM2Ajuste:number;classeEnergie:string;
}
const positive=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=1e12;
const shortText=(v:unknown):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=1000;
function isEntry(v:unknown):v is EstimationHistoryEntry {
 if(!v||typeof v!=='object'||Array.isArray(v))return false;
 const e=v as Record<string,unknown>;
 return shortText(e.id)&&shortText(e.commune)&&shortText(e.classeEnergie)&&typeof e.date==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(e.date)&&Number.isFinite(Date.parse(e.date))&&positive(e.surface)&&positive(e.estimationCentrale)&&positive(e.prixM2Ajuste)&&['adresse','quartier'].every(k=>e[k]===undefined||(typeof e[k]==='string'&&e[k].length<=1000));
}
/** Reading never mutates storage. Invalid data must be exported or explicitly cleared before writing. */
export function parseEstimationHistory(raw:string|null):{entries:EstimationHistoryEntry[];invalid:boolean}{
 if(raw===null)return {entries:[],invalid:false};
 try{
  const parsed:unknown=JSON.parse(raw);if(!Array.isArray(parsed))return {entries:[],invalid:true};
  const seen=new Set<string>(),entries:EstimationHistoryEntry[]=[];let invalid=parsed.length>50;
  for(const row of parsed){if(!isEntry(row)||seen.has(row.id)){invalid=true;continue}seen.add(row.id);if(entries.length<50)entries.push(row)}
  return {entries,invalid};
 }catch{return {entries:[],invalid:true}}
}
export function resolveSharedCommune(query:string):SearchResult|null{
 const exact=getMarketDataCommune(query.trim());
 if(exact)return {commune:exact,matchedOn:exact.commune,isLocalite:false};
 const matches=rechercherCommune(query.trim());return matches.length===1?matches[0]:null;
}
