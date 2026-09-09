export type DevelopmentLine={id:string;label:string;kind:'revenue'|'works'|'fees'|'finance'|'contingency';amount:number;month:number;reference:string};
export type DevelopmentInput={version:1;name:string;mode:'known'|'residual';lines:DevelopmentLine[];targetPct:number;targetReference:string;landPrice:number|null;landMonth:number;landReference:string;acquisitionFixed:number;acquisitionPct:number;acquisitionReference:string;taxReference:string};
export const DEVELOPMENT_SOURCES={rics:'https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/valuation-standards/valuation-of-development-property',vefa:'https://guichet.public.lu/fr/citoyens/logement/acquisition/aspects-contractuels/acquerir-bien-a-construire.html'};
function amount(n:number,max=1e9){if(typeof n!=='number'||!Number.isFinite(n)||n<0||n>max||Math.abs(n*100-Math.round(n*100))>1e-5)throw new RangeError('Invalid amount');return Math.round(n*100)}
function text(s:string,max=500){if(typeof s!=='string'||!s.trim()||s.length>max)throw new RangeError('Reference required')}
function month(n:number){if(!Number.isInteger(n)||n<1||n>120)throw new RangeError('Invalid month')}
function percent(cents:number,rate:number){return Number((BigInt(cents)*BigInt(rate)+5000n)/10000n)}
export function calculateDevelopment(input:DevelopmentInput){
 if(!input||input.version!==1||!['known','residual'].includes(input.mode)||!Array.isArray(input.lines)||input.lines.length<2||input.lines.length>200)throw new RangeError('Invalid appraisal');
 if(typeof input.landReference!=='string'||input.landReference.length>500)throw new RangeError('Invalid land reference');if(input.landPrice!==null)amount(input.landPrice);
 text(input.name,160);text(input.taxReference);text(input.targetReference);text(input.acquisitionReference);month(input.landMonth);
 const rate=amount(input.targetPct,100),acqRate=amount(input.acquisitionPct,100),fixed=amount(input.acquisitionFixed),ids=new Set<string>();
 const totals={revenue:0,works:0,fees:0,finance:0,contingency:0};
 for(const l of input.lines){if(!l||typeof l.id!=='string'||!l.id||l.id.length>100||ids.has(l.id)||!Object.hasOwn(totals,l.kind))throw new RangeError('Invalid line');ids.add(l.id);text(l.label,160);text(l.reference);month(l.month);totals[l.kind]+=amount(l.amount)}
 if(totals.revenue<=0||!input.lines.some(l=>l.kind!=='revenue'))throw new RangeError('Revenue and costs required');
 const costs=totals.works+totals.fees+totals.finance+totals.contingency;if(totals.revenue>1e12||costs>1e12)throw new RangeError('Out of scope');
 const target=percent(totals.revenue,rate),residualBudget=totals.revenue-costs-target-fixed;
 // The residual budget pays the price and proportional acquisition costs. A negative budget is retained; no negative acquisition tax is invented.
 const capacity=residualBudget<0?null:Number(BigInt(residualBudget)*10000n/BigInt(10000+acqRate));
 let land:number|null=null,acquisition:number|null=null,profit:number|null=null;
 if(input.mode==='known'){text(input.landReference);land=amount(input.landPrice as number);acquisition=fixed+percent(land,acqRate);profit=totals.revenue-costs-land-acquisition}
 const timeline: {month:number;revenue:number;costs:number;net:number;cumulative:number;beforeReceipts:number}[]=[];
 let cumulative=0,minimum=0;
 if(land!==null&&acquisition!==null){const last=Math.max(input.landMonth,...input.lines.map(l=>l.month));for(let m=1;m<=last;m++){const rows=input.lines.filter(l=>l.month===m),receipts=rows.filter(l=>l.kind==='revenue').reduce((s,l)=>s+amount(l.amount),0),expenses=rows.filter(l=>l.kind!=='revenue').reduce((s,l)=>s+amount(l.amount),0)+(m===input.landMonth?land+acquisition:0),before=cumulative-expenses;minimum=Math.min(minimum,before);cumulative+=receipts-expenses;timeline.push({month:m,revenue:receipts/100,costs:expenses/100,net:(receipts-expenses)/100,cumulative:cumulative/100,beforeReceipts:before/100})}}
 return {totals:Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,v/100])) as Record<DevelopmentLine['kind'],number>,costs:costs/100,target:target/100,residualBudget:residualBudget/100,landCapacity:capacity===null?null:capacity/100,landPrice:land===null?null:land/100,acquisition:acquisition===null?null:acquisition/100,profit:profit===null?null:profit/100,profitPct:profit===null?null:profit/totals.revenue*100,headroom:profit===null?null:(profit-target)/100,timeline,maximumBudgetDeficit:land===null?null:-minimum/100};
}
export function parseDevelopmentSnapshot(raw:string):DevelopmentInput{if(raw.length>250000)throw new RangeError('File too large');const data=JSON.parse(raw);calculateDevelopment(data);return data}
export function developmentCsv(input:DevelopmentInput){const r=calculateDevelopment(input),cell=(value:unknown)=>{let s=String(value??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};return '\uFEFF'+[
 ['kind','label','month','value','reference'],...input.lines.map(l=>[l.kind,l.label,l.month,l.amount,l.reference]),
 ['assumption','project','',input.name,''],['assumption','mode','',input.mode,''],['assumption','tax_basis','','net_of_recoverable_VAT_including_nonrecoverable_VAT',input.taxReference],['assumption','target_pct','',input.targetPct,input.targetReference],['assumption','land_price',input.landMonth,input.mode==='known'?input.landPrice:null,input.landReference],['assumption','acquisition_fixed',input.landMonth,input.acquisitionFixed,input.acquisitionReference],['assumption','acquisition_pct',input.landMonth,input.acquisitionPct,input.acquisitionReference],
 ...(['costs','target','residualBudget','landCapacity','acquisition','profit','profitPct','headroom','maximumBudgetDeficit'] as const).map(k=>['summary',k,'',r[k],'']),
 ...r.timeline.flatMap(m=>[['timeline','revenue',m.month,m.revenue,''],['timeline','costs',m.month,m.costs,''],['timeline','cumulative',m.month,m.cumulative,''],['timeline','before_receipts',m.month,m.beforeReceipts,'']]),
 ].map(row=>row.map(cell).join(';')).join('\r\n')}
