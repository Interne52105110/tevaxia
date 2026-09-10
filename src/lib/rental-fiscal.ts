import {listLotsAsync,type RentalLot} from './gestion-locative';
import {listPaymentsForLot,type RentalPayment} from './rental-payments';
import {requireRentalOwner} from './rental-cloud-identity';

export const fiscalExpenseKeys=['interest','insurance','maintenance','ownerCharges','propertyTax','depreciation','other'] as const;
export type FiscalExpenseKey=typeof fiscalExpenseKeys[number];
export type RentalFiscalDraft=Partial<Record<FiscalExpenseKey|'receipts',string>>;
export interface RentalFiscalSnapshot {lot:RentalLot;payments:RentalPayment[];}

export async function loadRentalFiscalSnapshot(owner:string):Promise<RentalFiscalSnapshot[]>{
 await requireRentalOwner(owner);
 const result=await listLotsAsync(owner);
 if(result.cloudError||!result.cloud)throw new Error('Rental fiscal source unavailable');
 const rows:RentalFiscalSnapshot[]=new Array(result.items.length);let cursor=0;
 // Bounded reads; no partial snapshot is published when one request fails.
 await Promise.all(Array.from({length:Math.min(3,result.items.length)},async()=>{
  for(;;){const i=cursor++;if(i>=result.items.length)return;const lot=result.items[i];rows[i]={lot,payments:await listPaymentsForLot(lot.id,owner)};}
 }));
 await requireRentalOwner(owner);return rows;
}
function cents(value:number):number{
 if(!Number.isFinite(value)||value<0||value>1e8||Math.abs(value*100-Math.round(value*100))>0.0001)throw new Error('Invalid fiscal amount');
 return Math.round(value*100);
}
export function fiscalPaymentSummary(payments:RentalPayment[],year:number){
 if(!Number.isInteger(year)||year<1900||year>2200)throw new Error('Invalid fiscal year');
 let rent=0,charges=0,paid=0,crossYear=0;const partial=payments.filter(p=>p.status==='partial').length;
 for(const p of payments){
  if(p.status!=='paid')continue;
  const date=p.paid_at;
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw new Error('Invalid fiscal receipt date');
  const paidYear=Number(date.slice(0,4));
  if(p.period_year!==paidYear&&(p.period_year===year||paidYear===year))crossYear++;
  if(paidYear!==year)continue;
  rent+=cents(p.amount_rent);charges+=cents(p.amount_charges);paid++;
 }
 return {rent:rent/100,charges:charges/100,paid,partial,crossYear};
}
/** Arithmetic worksheet only: the user must establish the tax treatment of each input. */
export function calculateRentalFiscalDraft(draft:RentalFiscalDraft){
 let incomplete=false;const values:Partial<Record<FiscalExpenseKey|'receipts',number>>={};
 for(const key of ['receipts',...fiscalExpenseKeys] as const){const raw=draft[key];if(raw===undefined||!raw.trim()){incomplete=true;continue;}values[key]=cents(Number(raw));}
 if(incomplete)return null;
 const expenses=fiscalExpenseKeys.reduce((sum,key)=>sum+values[key]!,0),receipts=values.receipts!;
 return {receipts:receipts/100,expenses:expenses/100,net:(receipts-expenses)/100};
}
