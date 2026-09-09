// Monthly scenario for one rental unit available throughout each calendar month.
import { holtWinters } from './hotel-forecast';
export interface StrMonthlyMetric { year:number; month:number; occupancy:number; adr:number; nights?:number|null }
export interface StrForecastPoint { year:number; month:number; occupancy:number; adr:number; nights:number; days:number; revenue:number; lowerRevenue:number; upperRevenue:number; isForecast:boolean; revenueBasis:'reported-nights'|'occupancy-estimate'|'projection' }
export interface StrForecastResult { historical:StrForecastPoint[]; forecast:StrForecastPoint[]; method:'mean'|'seasonal'; variationPct:number }
export const calendarDays=(year:number,month:number)=>new Date(Date.UTC(year,month,0)).getUTCDate();
export function sortedMonthly(metrics:StrMonthlyMetric[]):StrMonthlyMetric[]{return [...metrics].sort((a,b)=>(a.year-b.year)*12+a.month-b.month)}
function validateRows(rows:StrMonthlyMetric[]):StrMonthlyMetric[]{
 if(!Array.isArray(rows)||rows.length>1200)throw new RangeError('Invalid monthly series');
 const sorted=sortedMonthly(rows);
 sorted.forEach((r,i)=>{
  if(!Number.isInteger(r.year)||r.year<2000||r.year>2100||!Number.isInteger(r.month)||r.month<1||r.month>12||!Number.isFinite(r.occupancy)||r.occupancy<0||r.occupancy>1||!Number.isFinite(r.adr)||r.adr<0||r.adr>1e6||r.nights!=null&&(!Number.isInteger(r.nights)||r.nights<0||r.nights>calendarDays(r.year,r.month)))throw new RangeError('Invalid monthly observation');
  if(i&&r.year*12+r.month!==sorted[i-1].year*12+sorted[i-1].month+1)throw new RangeError('Months must be unique and consecutive');
 });return sorted;
}
function csvRows(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const delimiter = text.slice(0, text.search(/[\r\n]/) < 0 ? text.length : text.search(/[\r\n]/)).includes(";") ? ";" : text.split(/[\r\n]/)[0].includes("\t") ? "\t" : ",";
  const rows: string[][] = []; let row: string[] = [], field = "", quoted = false, closed = false;
  const pushField = () => { row.push(field.trim()); field = ""; closed = false; };
  const pushRow = () => { pushField(); if (row.some(f => f !== "")) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else field += ch;
    } else if (ch === delimiter) pushField();
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; pushRow(); }
    else if (ch === '"' && field.trim() === "" && !closed) { field = ""; quoted = true; }
    else if (ch === '"' || (closed && ch.trim())) throw new Error("Malformed CSV");
    else field += ch;
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  pushRow(); return rows;
}


/** Occupancy: fraction 0..1, bare percentage >1, or explicit percent (1% = .01). */
export function parseStrCsv(csv:string):StrMonthlyMetric[]{
 if(csv.length>2_000_000)throw new RangeError('CSV too large');
 const rows=csvRows(csv);
 if(rows[0]?.[0]==='date'){
  const header=rows.shift()!;
  if(header.join(',')!=='date,occupancy,adr'&&header.join(',')!=='date,occupancy,adr,nights')throw new RangeError('Invalid CSV header');
 }
 if(!rows.length)throw new RangeError('Empty CSV');
 const number=(s:string)=>{const v=s.replace(/[ \u00a0\u202f]/g,'').replace(',','.');if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(v))throw new RangeError('Invalid number');return Number(v)};
 const result=rows.map(row=>{
  if(row.length<3||row.length>4)throw new RangeError('Invalid CSV columns');
  const match=/^(\d{4})-(\d{2})$/.exec(row[0]);if(!match)throw new RangeError('Invalid month');
  const explicitPct=row[1].endsWith('%'),raw=number(explicitPct?row[1].slice(0,-1):row[1]);
  return {year:Number(match[1]),month:Number(match[2]),occupancy:explicitPct||raw>1?raw/100:raw,adr:number(row[2]),nights:row[3]?.trim()?number(row[3]):null};
 });return validateRows(result);
}
export function buildStrForecast(rawMetrics:StrMonthlyMetric[],horizonMonths=12,variationPct=0):StrForecastResult|null{
 const metrics=validateRows(rawMetrics);
 if(!Number.isInteger(horizonMonths)||horizonMonths<1||horizonMonths>24||!Number.isFinite(variationPct)||variationPct<0||variationPct>100)throw new RangeError('Invalid forecast assumptions');
 if(metrics.length<6)return null;
 const last=metrics[metrics.length-1];if(last.year*12+last.month+horizonMonths>2100*12+12)throw new RangeError('Forecast beyond supported dates');
 const occ=holtWinters(metrics.map(r=>r.occupancy),horizonMonths,{m:12}),adr=holtWinters(metrics.map(r=>r.adr),horizonMonths,{m:12});
 const historical:StrForecastPoint[]=metrics.map(r=>{
  const days=calendarDays(r.year,r.month),nights=r.nights??r.occupancy*days,revenue=nights*r.adr;
  return {...r,nights,days,revenue,lowerRevenue:revenue,upperRevenue:revenue,isForecast:false,revenueBasis:r.nights!=null?'reported-nights':'occupancy-estimate'};
 });
 const forecast:StrForecastPoint[]=Array.from({length:horizonMonths},(_,i)=>{
  const index=last.year*12+last.month+i,year=Math.floor(index/12),month=index%12+1,days=calendarDays(year,month);
  const occupancy=Math.max(0,Math.min(1,occ.forecast[i])),rate=Math.max(0,adr.forecast[i]),nights=occupancy*days,revenue=nights*rate;
  if(!Number.isFinite(revenue))throw new RangeError('Non-finite forecast');
  return {year,month,days,occupancy,adr:rate,nights,revenue,lowerRevenue:revenue*(1-variationPct/100),upperRevenue:revenue*(1+variationPct/100),isForecast:true,revenueBasis:'projection'};
 });
 return {historical,forecast,method:metrics.length>=24?'seasonal':'mean',variationPct};
}
/** Explicitly fictional deterministic demonstration. No market-data attribution. */
export function generateStrSeed(baseOcc=.65,baseAdr=130,months=24):StrMonthlyMetric[]{
 if(!Number.isInteger(months)||months<1||months>1200||!Number.isFinite(baseOcc)||baseOcc<0||baseOcc>1||!Number.isFinite(baseAdr)||baseAdr<0||baseAdr>1e6)throw new RangeError('Invalid demo');
 const factors=[.75,.78,.92,1.02,1.12,1.22,1.30,1.32,1.18,1.08,.88,.82],rates=[.88,.90,.95,1.02,1.08,1.15,1.22,1.25,1.12,1.05,.96,.95];
 const now=new Date(),end=now.getUTCFullYear()*12+now.getUTCMonth();
 return Array.from({length:months},(_,i)=>{const index=end-months+i,year=Math.floor(index/12),month=index%12+1;return {year,month,occupancy:Math.min(1,baseOcc*factors[month-1]),adr:baseAdr*rates[month-1],nights:null}});
}
