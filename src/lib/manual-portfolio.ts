import type { SavedValuation } from './storage';

export interface PortfolioAsset { id:string; nom:string; type:string; commune:string; valeur:number; loyerAnnuel:number; surface:number; dette:number; }
export function portfolioStorageKey(owner:string|null):string { return `tevaxia_portfolio:v2:${owner ? `user:${encodeURIComponent(owner)}` : 'guest'}`; }
export function validatePortfolio(value:unknown):asserts value is PortfolioAsset[] {
 if(!Array.isArray(value)||value.length>500)throw new Error('Invalid portfolio');
 const ids=new Set<string>();
 for(const item of value){
  if(!item||typeof item!=='object'||typeof item.id!=='string'||!item.id||ids.has(item.id))throw new Error('Invalid portfolio asset');
  ids.add(item.id);
  for(const key of ['nom','type','commune'])if(typeof item[key]!=='string')throw new Error('Invalid portfolio label');
  for(const key of ['valeur','loyerAnnuel','surface','dette'])if(typeof item[key]!=='number'||!Number.isFinite(item[key])||item[key]<0||item[key]>1e12)throw new Error('Invalid portfolio amount');
 }
}
export function readPortfolio(owner:string|null):PortfolioAsset[]{
 if(typeof window==='undefined')return [];
 const raw=localStorage.getItem(portfolioStorageKey(owner));
 if(raw===null)return [];
 const value:unknown=JSON.parse(raw);validatePortfolio(value);return value;
}
export function writePortfolio(items:PortfolioAsset[],owner:string|null):void {
 validatePortfolio(items);
 if(typeof window==='undefined')throw new Error('Portfolio storage unavailable');
 readPortfolio(owner); // Refuse to overwrite an unreadable existing archive.
 localStorage.setItem(portfolioStorageKey(owner),JSON.stringify(items));
}
export function portfolioRecovery(owner:string|null):string|null {
 const legacy=localStorage.getItem('tevaxia_portfolio'),current=localStorage.getItem(portfolioStorageKey(owner));
 return legacy===null&&current===null?null:JSON.stringify({legacy,current});
}
// Only these saved results represent a property valuation; rent, tax, fees and aid do not.
export function isPropertyValuation(v:SavedValuation):boolean {
 return ['estimation','valorisation','capitalisation','dcf','dcf-multi'].includes(v.type)&&typeof v.valeurPrincipale==='number'&&Number.isFinite(v.valeurPrincipale)&&v.valeurPrincipale>0;
}
export function valuationSurface(v:SavedValuation):number {
 for(const key of ['surface','surfaceBien','surfaceHabitable']){
  const raw=v.data[key];const value=typeof raw==='number'||typeof raw==='string'&&raw.trim()!==''?Number(raw):0;
  if(Number.isFinite(value)&&value>0)return value;
 }
 return 0;
}
export function portfolioCsvCell(value:string|number):string {
 let text=String(value);
 if(typeof value==='string'&&/^[\s]*[=+@-]/.test(text))text="'"+text;
 return '"'+text.replace(/"/g,'""')+'"';
}
export function portfolioCsv(assets:PortfolioAsset[],headers:string[]):string {
 validatePortfolio(assets);
 const rows:(string|number)[][]=[headers,...assets.map(a=>[a.nom,a.type,a.commune,a.valeur,a.surface,a.surface>0?a.valeur/a.surface:'',a.loyerAnnuel,a.dette,a.valeur>0?a.dette/a.valeur*100:'',a.valeur>0?a.loyerAnnuel/a.valeur*100:''])];
 return '\uFEFF'+rows.map(row=>row.map(portfolioCsvCell).join(';')).join('\r\n');
}
export function portfolioScenario(rent:number,debt:number):{income:number;charges:number;interest:number;net:number}{
 if(!Number.isFinite(rent)||!Number.isFinite(debt)||rent<0||debt<0)throw new Error('Invalid scenario');
 const income=Math.round(rent/12*0.95*100)/100;
 const charges=Math.round(income*0.15*100)/100;
 const interest=Math.round(debt*0.035/12*100)/100;
 return {income,charges,interest,net:Math.round((income-charges-interest)*100)/100};
}
