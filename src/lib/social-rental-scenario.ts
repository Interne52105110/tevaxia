export function socialRentalExemption(year:number):number{
 if(!Number.isInteger(year)||year<2017||year>2026)throw new Error('Unverified social rental tax year');
 return year>=2024?90:year===2023?75:50;
}
export interface SocialRentalInput {year:number;standardRent:number;socialRent:number;standardCosts:number;socialCosts:number;marginalRate:number;eligible:boolean;}
function cents(n:number):number{
 if(!Number.isFinite(n)||n<0||n>1e8||Math.abs(n*100-Math.round(n*100))>0.0001)throw new Error('Invalid social rental amount');return Math.round(n*100);
}
export function socialRentalScenario(input:SocialRentalInput){
 const exemption=socialRentalExemption(input.year),standardNet=cents(input.standardRent)*12-cents(input.standardCosts),socialNet=cents(input.socialRent)*12-cents(input.socialCosts);
 if(typeof input.eligible!=='boolean'||!Number.isFinite(input.marginalRate)||input.marginalRate<0||input.marginalRate>100)throw new Error('Invalid social rental assumptions');
 const base={exemption,standardNet:standardNet/100,socialNet:socialNet/100};
 if(!input.eligible||standardNet<0||socialNet<0)return {...base,estimate:null};
 const standardTax=Math.round(standardNet*input.marginalRate/100),socialTaxable=Math.round(socialNet*(100-exemption)/100),socialTax=Math.round(socialTaxable*input.marginalRate/100);
 return {...base,estimate:{standardTax:standardTax/100,socialTaxable:socialTaxable/100,socialTax:socialTax/100,standardAfterTax:(standardNet-standardTax)/100,socialAfterTax:(socialNet-socialTax)/100,difference:((socialNet-socialTax)-(standardNet-standardTax))/100}};
}
