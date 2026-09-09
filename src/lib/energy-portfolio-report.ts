import type {EnergyAuditReport} from "../components/energy/EnergyAuditPdf";
import {ENERGY_CLASSES as CLASSES, summarizeEnergyPortfolio, type EnergyProperty} from "./energy-portfolio";
export const PORTFOLIO_SOURCES = ["https://guichet.public.lu/fr/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html", "https://energy.ec.europa.eu/topics/energy-efficiency/energy-performance-buildings/energy-performance-buildings-directive_en"];
export function buildEnergyPortfolioReport(properties:EnergyProperty[],t:(key:string)=>string,a:(key:string)=>string,locale:string):EnergyAuditReport {
 const stats=properties.length?summarizeEnergyPortfolio(properties):null;
 const numberLocale=locale==="lb"?"de-DE":locale;
 const fmt=(n:number)=>new Intl.NumberFormat(numberLocale,{maximumFractionDigits:2}).format(n);
 const fmtDec=(n:number)=>new Intl.NumberFormat(numberLocale,{maximumFractionDigits:1}).format(n);
 const typeLabel=(v:string)=>{const key:Record<string,string>={Appartement:"apartment",Maison:"house",Commercial:"commercial"};return key[v]?t("type_"+key[v]):v;};
  return {title:t("title"),sections:[
    {title:a("scopeTitle"),text:a("scope")+" "+a("method")},
    {title:a("summary"),rows:stats?[{label:a("valueLabel"),value:fmt(stats.totalValeur)+" EUR"},{label:t("colSurface"),value:fmt(stats.totalSurface)+" m²"}]:[]},
    {title:t("distributionByClass"),text:a("distributionNote"),rows:stats?CLASSES.filter(c=>stats.repartition[c]>0).map(c=>({label:c==="?"?a("unknown"):c,value:fmt(stats.repartition[c])+" m² · "+fmtDec(stats.repartition[c]/stats.totalSurface*100)+" %"})):[]},
    ...properties.map(p=>({title:p.nom,keepTogether:true,rows:[{label:a("classLabel"),value:p.classe==="?"?a("unknown"):p.classe},{label:t("colSurface"),value:fmt(p.surface)+" m²"},{label:a("valueLabel"),value:fmt(p.valeur)+" EUR"},{label:t("labelType"),value:typeLabel(p.type)},{label:t("labelAnnee"),value:String(p.annee)}]})),
    {title:a("epbdLink"),text:a("regulation")}
  ],sources:PORTFOLIO_SOURCES};
}
