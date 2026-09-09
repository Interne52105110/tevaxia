/** Arithmetic price scenarios. No reconstructed observations or estimated probabilities. */
export interface PriceScenario {
  name: 'pessimiste' | 'central' | 'optimiste';
  nameKey: string;
  annualGrowthPct: number;
  color: string;
}
export const DEFAULT_SCENARIOS: PriceScenario[] = [
  {name:'pessimiste',nameKey:'pessimiste',annualGrowthPct:0,color:'#dc2626'},
  {name:'central',nameKey:'central',annualGrowthPct:0,color:'#1e3a5f'},
  {name:'optimiste',nameKey:'optimiste',annualGrowthPct:0,color:'#059669'},
];
export interface PriceForecastPoint {
  year:number; month:number; label:string;
  pessimiste:number; central:number; optimiste:number; isProjection:boolean;
}
export interface PriceForecastResult {
  series:PriceForecastPoint[]; basePrice:number;
  endPessimiste:number; endCentral:number; endOptimiste:number;
}
/** Annual effective growth compounded for h/12 years; precision retained until presentation. */
export function buildPriceForecast(basePrice:number,horizonMonths=24,scenarios:PriceScenario[]=DEFAULT_SCENARIOS,startMonth=new Date().toISOString().slice(0,7)):PriceForecastResult {
  if(!Number.isFinite(basePrice)||basePrice<=0||basePrice>1e6) throw new RangeError('Invalid base price');
  if(!Number.isInteger(horizonMonths)||horizonMonths<1||horizonMonths>48) throw new RangeError('Invalid horizon');
  if(!/^(20\d{2})-(0[1-9]|1[0-2])$/.test(startMonth)) throw new RangeError('Invalid start month');
  const names=DEFAULT_SCENARIOS.map(s=>s.name);
  if(scenarios.length!==3||names.some(name=>scenarios.filter(s=>s.name===name).length!==1)||scenarios.some(s=>!Number.isFinite(s.annualGrowthPct)||s.annualGrowthPct<=-100||s.annualGrowthPct>100)) throw new RangeError('Invalid scenarios');
  const rates=names.map(name=>scenarios.find(s=>s.name===name)!.annualGrowthPct);
  if(rates[0]>rates[1]||rates[1]>rates[2]) throw new RangeError('Unordered scenarios');
  const [year,month]=startMonth.split('-').map(Number);
  const series=Array.from({length:horizonMonths+1},(_,h)=>{
    const index=year*12+month-1+h,y=Math.floor(index/12),m=index%12+1;
    return {year:y,month:m,label:`${String(m).padStart(2,'0')}/${y}`,isProjection:h>0,
      pessimiste:basePrice*Math.pow(1+rates[0]/100,h/12),
      central:basePrice*Math.pow(1+rates[1]/100,h/12),
      optimiste:basePrice*Math.pow(1+rates[2]/100,h/12)};
  });
  const last=series[series.length-1];
  return {series,basePrice,endPessimiste:last.pessimiste,endCentral:last.central,endOptimiste:last.optimiste};
}
