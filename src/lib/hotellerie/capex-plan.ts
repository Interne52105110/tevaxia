export type CapexPlan = { opening: number; openingReference: string; years: { year: number; spending: number; funding: number; reference: string }[] };
const cents = (n: number) => { if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 1e9 || Math.abs(n * 100 - Math.round(n * 100)) > .00001) throw new RangeError("Invalid amount"); return Math.round(n * 100); };
const reference = (s: string) => { if (typeof s !== "string" || !s.trim() || s.length > 1500) throw new RangeError("Reference required"); };
export function calculateCapexPlan(input: CapexPlan) {
 reference(input.openingReference);const opening=cents(input.opening);
 if (!Array.isArray(input.years) || input.years.length < 1 || input.years.length > 30) throw new RangeError("Invalid horizon");
 let balance=opening,totalSpending=0,totalFunding=0,minBalance=opening;
 const years=input.years.map((row,i)=>{
  if(!Number.isInteger(row.year)||row.year<2000||row.year>2099||i>0&&row.year!==input.years[i-1].year+1)throw new RangeError("Years must be consecutive");
  reference(row.reference);const spending=cents(row.spending),funding=cents(row.funding),start=balance;
  balance+=funding-spending;totalSpending+=spending;totalFunding+=funding;minBalance=Math.min(minBalance,balance);
  return {year:row.year,opening:start/100,spending:spending/100,funding:funding/100,closing:balance/100,gap:Math.max(0,-balance)/100};
 });
 return {years,totalSpending:totalSpending/100,totalFunding:totalFunding/100,closing:balance/100,additionalFunding:Math.max(0,-minBalance)/100};
}
export function capexPlanCsv(input: CapexPlan) {
 const r=calculateCapexPlan(input);
 const rows:unknown[][]=[["section","year","field","value","unit","reference"],["opening","","available",input.opening,"EUR",input.openingReference]];
 for(let i=0;i<r.years.length;i++)for(const [key,value]of Object.entries(r.years[i]))if(key!=="year")rows.push(["annual",r.years[i].year,key,value,"EUR",input.years[i].reference]);
 for(const key of ["totalSpending","totalFunding","closing","additionalFunding"] as const)rows.push(["summary","",key,r[key],"EUR",""]);
 return "\uFEFF"+rows.map(row=>row.map(v=>'"'+(typeof v==="string"&&/^[=+@\t\r-]/.test(v)?"'"+v:String(v)).replace(/"/g,'""')+'"').join(";")).join("\r\n");
}
