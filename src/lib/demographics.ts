import snapshot from './data/rnpp-2026-07-01.json';
/** Official administrative register extract. Not a STATEC resident-population estimate. */
export interface DemographicData { code:string; commune:string; population:number; mineurs:number; majeurs:number }
export const DEMOGRAPHIC_SOURCE=snapshot;
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const records=new Map(snapshot.records.map(row=>[normalize(row.commune),row]));
export function getDemographics(commune:string):DemographicData|null{
 if(typeof commune!=='string')return null;
 const key=normalize(commune);
 // The market dataset uses Redange; RNPP names the same municipality (0809) Redange/Attert.
 return records.get(key === "redange" || key === "redange-sur-attert" ? "redange/attert" : key)??null;
}
