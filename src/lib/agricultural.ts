export type AgriculturalInput={surfaceHa:number;priceHa:number;priceReference:string;buildingValue:number;buildingReference:string;demolitionCost:number;demolitionReference:string;remediationCost:number;remediationReference:string;rightsReference:string};
function scaled(n:number,factor:number,max:number){if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>max||Math.abs(n*factor-Math.round(n*factor))>1e-5)throw new RangeError('Invalid amount or precision');return Math.round(n*factor)}
export function evaluerTerreAgricole(i:AgriculturalInput){
 const area=scaled(i.surfaceHa,10000,100000);if(area===0)throw new RangeError('Positive area required');
 for(const key of ['priceReference','buildingReference','demolitionReference','remediationReference','rightsReference'] as const){if(typeof i[key]!=='string'||!i[key].trim()||i[key].length>500)throw new RangeError('Reference required')}
 const price=scaled(i.priceHa,100,1e8),building=scaled(i.buildingValue,100,1e9),demolition=scaled(i.demolitionCost,100,1e9),remediation=scaled(i.remediationCost,100,1e9),land=Number((BigInt(area)*BigInt(price)+5000n)/10000n);if(land>1e12)throw new RangeError('Out of scope');
 return {surfaceM2:area,landValue:land/100,buildingValue:building/100,demolitionCost:demolition/100,remediationCost:remediation/100,netValue:(land+building-demolition-remediation)/100};
}
export function agriculturalCsv(input:AgriculturalInput){const result=evaluerTerreAgricole(input),cell=(v:unknown)=>{let s=String(v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};return '\uFEFF'+[['kind','key','value'],...Object.entries(input).map(([k,v])=>['input',k,v]),...Object.entries(result).map(([k,v])=>['result',k,v])].map(r=>r.map(cell).join(';')).join('\r\n')}
