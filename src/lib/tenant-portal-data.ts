import type {TenantPortalData} from './tenant-portal';

const statuses=['due','partial','paid','late','cancelled'];
function record(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid tenant portal response');
 return value as Record<string,unknown>;
}
function label(value:unknown,nullable=false):string|null{
 if(nullable&&value===null)return null;
 if(typeof value!=='string')throw new Error('Invalid tenant portal text');
 return value;
}
function amount(value:unknown):number{
 if((typeof value!=='number'&&typeof value!=='string')||String(value).trim()==='')throw new Error('Invalid tenant amount');
 const n=Number(value);
 if(!Number.isFinite(n)||n<0||n>2e9||Math.abs(n*100-Math.round(n*100))>0.0001)throw new Error('Invalid tenant amount');
 return Math.round(n*100)/100;
}
function date(value:unknown):string|null{
 if(value===null)return null;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw new Error('Invalid tenant payment date');
 return value;
}
export function parseTenantPortalData(value:unknown):TenantPortalData{
 const raw=record(value);
 if(raw.error==='invalid_token')return {lot:null,tenant_name:null,payments:[],error:'invalid_token'};
 if(raw.error)throw new Error('Tenant portal unavailable');
 const lot=record(raw.lot);
 const surface=Number(lot.surface),rooms=lot.nb_chambres===null?null:Number(lot.nb_chambres);
 if(lot.surface===null||String(lot.surface).trim()===''||!Number.isFinite(surface)||surface<0||rooms!==null&&(!Number.isInteger(rooms)||rooms<0)||typeof lot.est_meuble!=='boolean')throw new Error('Invalid tenant lot');
 const energy=label(lot.classe_energie)!;
 if(!['A+','A','B','C','D','E','F','G','H','I','NC'].includes(energy))throw new Error('Invalid tenant energy class');
 if(!Array.isArray(raw.payments)||raw.payments.length>5000)throw new Error('Invalid tenant payments');
 const ids=new Set(),periods=new Set();
 const payments=raw.payments.map(value=>{
  const p=record(value),id=label(p.id)!,period=label(p.period)!;
  if(!id||ids.has(id)||periods.has(period)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)||!statuses.includes(p.status as string))throw new Error('Invalid tenant payment period');
  ids.add(id);periods.add(period);
  const rent=amount(p.amount_rent),charges=amount(p.amount_charges),total=amount(p.amount_total);
  if(Math.round(rent*100)+Math.round(charges*100)!==Math.round(total*100))throw new Error('Invalid tenant total');
  const paid=date(p.paid_at),receipt=label(p.receipt_issued_at,true);
  if(p.status==='paid'&&!paid||receipt!==null&&!Number.isFinite(Date.parse(receipt)))throw new Error('Invalid tenant payment date');
  return {id,period,amount_rent:rent,amount_charges:charges,amount_total:total,status:p.status as TenantPortalData['payments'][number]['status'],paid_at:paid,receipt_issued_at:receipt};
 }).sort((a,b)=>b.period.localeCompare(a.period));
 return {lot:{name:label(lot.name)!,address:label(lot.address,true),commune:label(lot.commune,true),surface,nb_chambres:rooms,classe_energie:energy,est_meuble:lot.est_meuble},tenant_name:label(raw.tenant_name,true),payments};
}
/** Only summarizes displayed entries; the RPC may return a bounded history. */
export function summarizeTenantPayments(payments:TenantPortalData['payments']){
 const unpaid=payments.filter(p=>['due','late','partial'].includes(p.status));
 return {unpaid:unpaid.length,remaining:unpaid.some(p=>p.status==='partial')?null:unpaid.reduce((sum,p)=>sum+Math.round(p.amount_total*100),0)/100,paid:payments.filter(p=>p.status==='paid').length};
}
