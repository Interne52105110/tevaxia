export type ConstructionBudgetLine={id:string;label:string;kind:'works'|'fees';quantity:number;unit:'unit'|'m2'|'m3'|'m'|'h';unitPriceTtc:number;reference:string};
export type ConstructionBudgetInput={lines:ConstructionBudgetLine[];surfaceM2:number|null;contingencyPct:number;contingencyReason:string};
export type ConstructionBudgetResult={lines:(ConstructionBudgetLine&{totalTtc:number})[];worksTtc:number;feesTtc:number;contingencyTtc:number;totalTtc:number;costPerM2:number|null};
function scaled(value:number,factor:number,max:number){if(!Number.isFinite(value)||value<0||value>max||Math.abs(value*factor-Math.round(value*factor))>1e-5)throw new RangeError('Invalid precision or amount');return Math.round(value*factor)}
export function calculateConstructionBudget(input:ConstructionBudgetInput):ConstructionBudgetResult{
 if(!Array.isArray(input.lines)||input.lines.length<1||input.lines.length>200)throw new RangeError('One to 200 lines required');
 if(input.surfaceM2!==null&&(!Number.isFinite(input.surfaceM2)||input.surfaceM2<0.0001||input.surfaceM2>1e6))throw new RangeError('Invalid surface');
 const rate=scaled(input.contingencyPct,100,100);
 if(rate>0&&!input.contingencyReason.trim())throw new RangeError('Contingency reason required');
 const ids=new Set<string>();let works=0,fees=0;
 const lines=input.lines.map(line=>{
  if(!line.id||ids.has(line.id)||!line.label.trim()||line.label.length>240||!line.reference.trim()||line.reference.length>500||!['works','fees'].includes(line.kind)||!['unit','m2','m3','m','h'].includes(line.unit))throw new RangeError('Invalid line');
  ids.add(line.id);const quantity=scaled(line.quantity,10000,1e6),price=scaled(line.unitPriceTtc,100,1e8);if(quantity===0)throw new RangeError('Positive quantity required');
  // Integer arithmetic: unit price in cents, quantity to four decimals, round each line half up.
  const cents=Number((BigInt(quantity)*BigInt(price)+5000n)/10000n);if(cents>1e12)throw new RangeError('Line amount out of scope');
  if(line.kind==='works')works+=cents;else fees+=cents;
  return {...line,totalTtc:cents/100};
 });
 const contingency=Number((BigInt(works)*BigInt(rate)+5000n)/10000n),total=works+fees+contingency;
 if(total>1e12)throw new RangeError('Budget out of scope');
 return {lines,worksTtc:works/100,feesTtc:fees/100,contingencyTtc:contingency/100,totalTtc:total/100,costPerM2:input.surfaceM2===null?null:total/100/input.surfaceM2};
}
export function constructionBudgetCsv(input:ConstructionBudgetInput){
 const r=calculateConstructionBudget(input),cell=(value:unknown)=>{let v=String(value??'');if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
 return '\uFEFF'+[
 ['kind','label','quantity','unit','unit_price_TTC_EUR','total_TTC_EUR','reference'],
 ...r.lines.map(l=>[l.kind,l.label,l.quantity,l.unit,l.unitPriceTtc,l.totalTtc,l.reference]),
 ['summary','works_TTC','','','',r.worksTtc,''],['summary','fees_TTC','','','',r.feesTtc,''],
 ['assumption','contingency_pct',input.contingencyPct,'%','','',input.contingencyReason],['summary','contingency_TTC','','','',r.contingencyTtc,''],
 ['summary','total_TTC','','','',r.totalTtc,''],['assumption','surface',input.surfaceM2,'m2','','',''],['summary','cost_per_m2_TTC','','m2','',r.costPerM2,''],
 ].map(row=>row.map(cell).join(';')).join('\r\n');
}
