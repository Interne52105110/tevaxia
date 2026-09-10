// Rental ledger. Domain lot IDs are resolved to owned cloud IDs for every operation.
import {requireRentalOwner,resolveRentalCloudId} from './rental-cloud-identity';
export type PaymentStatus = "due" | "partial" | "paid" | "late" | "cancelled";
export type PaymentMethod = "virement" | "cheque" | "prelevement" | "espece" | "autre";

export interface RentalPayment {
  id: string;
  lot_id: string;
  user_id: string;
  period_year: number;
  period_month: number;
  amount_rent: number;
  amount_charges: number;
  amount_total: number;
  paid_at: string | null;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  status: PaymentStatus;
  receipt_issued_at: string | null;
  receipt_sha256: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}


const statuses:PaymentStatus[]=['due','partial','paid','late','cancelled'];
const methods:PaymentMethod[]=['virement','cheque','prelevement','espece','autre'];
function cents(raw:unknown):number{
 if((typeof raw!=='number'&&typeof raw!=='string')||String(raw).trim()==='')throw new Error('Invalid rental amount');
 const n=Number(raw),c=Math.round(n*100);
 if(!Number.isFinite(n)||n<0||n>2e9||Math.abs(n*100-c)>0.0001)throw new Error('Invalid rental amount');
 return c;
}
function period(year:number,month:number){if(!Number.isInteger(year)||year<1900||year>2200||!Number.isInteger(month)||month<1||month>12)throw new Error('Invalid rental period');}
function parsePayment(row:Record<string,unknown>,localId:string,cloudId:string,owner:string):RentalPayment{
 if(!row||row.user_id!==owner||row.lot_id!==cloudId||typeof row.id!=='string'||!row.id||!statuses.includes(row.status as PaymentStatus))throw new Error('Invalid rental payment');
 period(row.period_year as number,row.period_month as number);
 const rent=cents(row.amount_rent),charges=cents(row.amount_charges),total=cents(row.amount_total);
 if(rent+charges!==total)throw new Error('Invalid rental total');
 for(const key of ['created_at','updated_at'])if(typeof row[key]!=='string'||!Number.isFinite(Date.parse(row[key] as string)))throw new Error('Invalid rental timestamp');
 for(const key of ['paid_at','payment_reference','notes','receipt_issued_at','receipt_sha256'])if(row[key]!==null&&typeof row[key]!=='string')throw new Error('Invalid rental field');
 if(row.paid_at!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(row.paid_at as string)||!Number.isFinite(Date.parse(row.paid_at as string))))throw new Error('Invalid payment date');
 if(row.status==='paid'&&!row.paid_at)throw new Error('Missing payment date');
 if(row.payment_method!==null&&!methods.includes(row.payment_method as PaymentMethod))throw new Error('Invalid payment method');
 return {...row,lot_id:localId,amount_rent:rent/100,amount_charges:charges/100,amount_total:total/100} as unknown as RentalPayment;
}
export async function listPaymentsForLot(lotId:string,owner:string):Promise<RentalPayment[]>{
 const cloudId=await resolveRentalCloudId(lotId,owner),client=await requireRentalOwner(owner);
 const rows:RentalPayment[]=[];let cursor:string|null=null;
 for(;;){
  let query=client.from('rental_payments').select('*').eq('user_id',owner).eq('lot_id',cloudId).order('id').limit(200);
  if(cursor)query=query.gt('id',cursor);
  const {data,error}=await query;
  if(error||!Array.isArray(data))throw new Error('Rental payments unavailable');
  await requireRentalOwner(owner);
  if(data.length===0)break;
  const next=data[data.length-1].id;
  if(typeof next!=='string'||(cursor!==null&&next<=cursor))throw new Error('Invalid rental page');
  rows.push(...data.map(row=>parsePayment(row,lotId,cloudId,owner)));cursor=next;
  if(rows.length>5000)throw new Error('Rental ledger too large');
 }
 const periods=new Set<string>();for(const row of rows){const key=row.period_year+'-'+row.period_month;if(periods.has(key))throw new Error('Duplicate rental period');periods.add(key);}
 return rows.sort((a,b)=>b.period_year-a.period_year||b.period_month-a.period_month);
}
export interface RentalPaymentInput {id?:string;updated_at?:string;lot_id:string;period_year:number;period_month:number;amount_rent:number;amount_charges:number;}
function editable(p:RentalPayment){if(p.status==='paid'||p.status==='cancelled'||p.receipt_issued_at||p.receipt_sha256)throw new Error('Settled rental entry cannot be changed');}
async function currentPayment(p:RentalPayment,owner:string){
 const cloudId=await resolveRentalCloudId(p.lot_id,owner),client=await requireRentalOwner(owner);
 const {data,error}=await client.from('rental_payments').select('*').eq('user_id',owner).eq('lot_id',cloudId).eq('id',p.id).single();
 if(error||!data)throw new Error('Rental payment unavailable');
 const current=parsePayment(data,p.lot_id,cloudId,owner);
 if(p.user_id!==owner||current.updated_at!==p.updated_at)throw new Error('Rental payment changed');
 await requireRentalOwner(owner);
 return {current,cloudId,client};
}
export async function upsertPayment(input:RentalPaymentInput,owner:string):Promise<RentalPayment>{
 period(input.period_year,input.period_month);const rent=cents(input.amount_rent)/100,charges=cents(input.amount_charges)/100;
 const cloudId=await resolveRentalCloudId(input.lot_id,owner),client=await requireRentalOwner(owner);
 let query;
 if(input.id){
  const {data,error}=await client.from('rental_payments').select('*').eq('user_id',owner).eq('lot_id',cloudId).eq('id',input.id).single();
  if(error||!data)throw new Error('Rental payment unavailable');
  const current=parsePayment(data,input.lot_id,cloudId,owner);editable(current);
  if(current.updated_at!==input.updated_at||current.period_year!==input.period_year||current.period_month!==input.period_month)throw new Error('Rental payment changed');
  await requireRentalOwner(owner);
  query=client.from('rental_payments').update({amount_rent:rent,amount_charges:charges}).eq('user_id',owner).eq('lot_id',cloudId).eq('id',input.id).eq('updated_at',input.updated_at!);
 }else{
  // A concurrent existing month must never be overwritten or reset to due.
  query=client.from('rental_payments').insert({lot_id:cloudId,user_id:owner,period_year:input.period_year,period_month:input.period_month,amount_rent:rent,amount_charges:charges,status:'due'});
 }
 const {data,error}=await query.select('*').single();
 if(error||!data)throw new Error('Rental save not confirmed');
 const saved=parsePayment(data,input.lot_id,cloudId,owner);
 if(saved.amount_rent!==rent||saved.amount_charges!==charges||saved.period_year!==input.period_year||saved.period_month!==input.period_month||(input.id&&saved.id!==input.id))throw new Error('Rental save not confirmed');
 await requireRentalOwner(owner);return saved;
}
export async function deletePayment(payment:RentalPayment,owner:string):Promise<void>{
 const {current,cloudId,client}=await currentPayment(payment,owner);editable(current);
 const {data,error}=await client.from('rental_payments').delete().eq('user_id',owner).eq('lot_id',cloudId).eq('id',current.id).eq('updated_at',current.updated_at).select('id');
 if(error||data?.length!==1||data[0].id!==current.id)throw new Error('Rental deletion not confirmed');
 await requireRentalOwner(owner);
}
export async function markPaid(payment:RentalPayment,owner:string,method:PaymentMethod|null=null):Promise<void>{
 if(method!==null&&!methods.includes(method))throw new Error('Invalid payment method');
 const {current,cloudId,client}=await currentPayment(payment,owner);editable(current);
 const paidAt=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Luxembourg',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const {data,error}=await client.from('rental_payments').update({status:'paid',paid_at:paidAt,payment_method:method}).eq('user_id',owner).eq('lot_id',cloudId).eq('id',current.id).eq('updated_at',current.updated_at).select('*').single();
 if(error||!data)throw new Error('Payment not confirmed');
 const saved=parsePayment(data,payment.lot_id,cloudId,owner);
 if(saved.id!==current.id||saved.status!=='paid'||saved.paid_at!==paidAt||saved.amount_total!==current.amount_total)throw new Error('Payment not confirmed');
 await requireRentalOwner(owner);
}
export async function seedYear(lotId:string,year:number,monthlyRent:number,monthlyCharges:number,owner:string):Promise<number>{
 period(year,1);const rent=cents(monthlyRent)/100,charges=cents(monthlyCharges)/100;
 const cloudId=await resolveRentalCloudId(lotId,owner),client=await requireRentalOwner(owner);
 const rows=Array.from({length:12},(_,i)=>({lot_id:cloudId,user_id:owner,period_year:year,period_month:i+1,amount_rent:rent,amount_charges:charges,status:'due'}));
 const {data,error}=await client.from('rental_payments').upsert(rows,{onConflict:'lot_id,period_year,period_month',ignoreDuplicates:true}).select('*');
 if(error||!Array.isArray(data))throw new Error('Rental year creation not confirmed');
 const months=new Set<number>();
 for(const row of data){const p=parsePayment(row,lotId,cloudId,owner);if(p.period_year!==year||p.amount_rent!==rent||p.amount_charges!==charges||p.status!=='due'||months.has(p.period_month))throw new Error('Invalid rental year response');months.add(p.period_month);}
 await requireRentalOwner(owner);return months.size;
}
export function summarizeRentalPayments(payments:RentalPayment[]){
 const active=payments.filter(p=>p.status!=='cancelled');
 const expected=active.reduce((sum,p)=>sum+cents(p.amount_total),0),paid=active.filter(p=>p.status==='paid').reduce((sum,p)=>sum+cents(p.amount_total),0);
 const partial=active.some(p=>p.status==='partial');
 return {expected:expected/100,paid:paid/100,remaining:partial?null:(expected-paid)/100,partial,pending:active.filter(p=>p.status!=='paid').length,registered:active.length};
}

export async function confirmRentalPayment(payment:RentalPayment,owner:string):Promise<RentalPayment>{return (await currentPayment(payment,owner)).current;}
