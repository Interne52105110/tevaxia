import {requireRentalOwner,resolveRentalCloudId} from './rental-cloud-identity';
export type CotenantStatus = "active" | "left" | "pending";

export interface Cotenant {
  id: string;
  lot_id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  share_pct: number;
  deposit_amount: number;
  bail_start: string | null;
  bail_end: string | null;
  status: CotenantStatus;
  created_at: string;
  updated_at: string;
}


function decimal(value:unknown,max:number):number {
 if((typeof value!=='number'&&typeof value!=='string')||String(value).trim()==='')throw new Error('Invalid cotenant amount');
 const n=Number(value);if(!Number.isFinite(n)||n<0||n>max||Math.abs(n*100-Math.round(n*100))>0.0001)throw new Error('Invalid cotenant amount');
 return Math.round(n*100)/100;
}
function date(value:unknown):string|null {
 if(value===null)return null;
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value)throw new Error('Invalid cotenant date');
 return value;
}
function parse(row:Record<string,unknown>,lot:string,cloud:string,owner:string):Cotenant {
 if(!row||row.user_id!==owner||row.lot_id!==cloud||typeof row.id!=='string'||!row.id||typeof row.name!=='string'||!row.name.trim()||!['active','pending','left'].includes(row.status as string))throw new Error('Invalid cotenant');
 for(const key of ['email','phone'])if(row[key]!==null&&typeof row[key]!=='string')throw new Error('Invalid cotenant contact');
 for(const key of ['created_at','updated_at'])if(typeof row[key]!=='string'||!Number.isFinite(Date.parse(row[key] as string)))throw new Error('Invalid cotenant timestamp');
 const start=date(row.bail_start),end=date(row.bail_end);if(start&&end&&end<start)throw new Error('Invalid cotenant dates');
 return {...row,lot_id:lot,share_pct:decimal(row.share_pct,100),deposit_amount:decimal(row.deposit_amount,99999999.99),bail_start:start,bail_end:end} as unknown as Cotenant;
}
export async function listCotenantsForLot(lotId:string,owner:string):Promise<Cotenant[]> {
 const cloud=await resolveRentalCloudId(lotId,owner),client=await requireRentalOwner(owner),rows:Cotenant[]=[];let cursor:string|null=null;
 for(;;){let q=client.from('rental_cotenants').select('*').eq('user_id',owner).eq('lot_id',cloud).order('id').limit(200);if(cursor)q=q.gt('id',cursor);
 const {data,error}=await q;if(error||!Array.isArray(data))throw new Error('Cotenants unavailable');await requireRentalOwner(owner);if(!data.length)break;
 const next=data[data.length-1].id;if(typeof next!=='string'||cursor!==null&&next<=cursor)throw new Error('Invalid cotenant page');cursor=next;
 rows.push(...data.map(row=>parse(row,lotId,cloud,owner)));if(rows.length>1000)throw new Error('Too many cotenants');}
 if(new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error('Duplicate cotenant');
 return rows.sort((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
}
export interface CotenantInput {id:string;lot_id:string;name:string;email?:string;phone?:string;share_pct?:number;deposit_amount?:number;bail_start?:string;bail_end?:string;status?:CotenantStatus;}
export async function createCotenant(input:CotenantInput,owner:string):Promise<Cotenant>{
 const cloud=await resolveRentalCloudId(input.lot_id,owner),client=await requireRentalOwner(owner);
 const payload={id:input.id,lot_id:cloud,user_id:owner,name:input.name.trim(),email:input.email??null,phone:input.phone??null,share_pct:input.share_pct??0,deposit_amount:input.deposit_amount??0,bail_start:input.bail_start??null,bail_end:input.bail_end??null,status:input.status??'active'};
 parse({...payload,created_at:new Date().toISOString(),updated_at:new Date().toISOString()},input.lot_id,cloud,owner);
 const {data,error}=await client.from('rental_cotenants').insert(payload).select('*').single();
 if(error||!data)throw new Error('Cotenant creation not confirmed');const saved=parse(data,input.lot_id,cloud,owner);
 if(saved.id!==input.id||saved.name!==payload.name||saved.share_pct!==payload.share_pct||saved.deposit_amount!==payload.deposit_amount)throw new Error('Cotenant creation not confirmed');
 await requireRentalOwner(owner);return saved;
}
export async function updateCotenant(cot:Cotenant,patch:{share_pct:number},owner:string):Promise<void>{
 if(cot.user_id!==owner)throw new Error('Cotenant account changed');const share=decimal(patch.share_pct,100);
 const cloud=await resolveRentalCloudId(cot.lot_id,owner),client=await requireRentalOwner(owner);
 const {data,error}=await client.from('rental_cotenants').update({share_pct:share}).eq('id',cot.id).eq('lot_id',cloud).eq('user_id',owner).eq('updated_at',cot.updated_at).select('*').single();
 if(error||!data)throw new Error('Cotenant change not confirmed');const saved=parse(data,cot.lot_id,cloud,owner);
 if(saved.id!==cot.id||saved.share_pct!==share)throw new Error('Cotenant change not confirmed');await requireRentalOwner(owner);
}
export async function deleteCotenant(cot:Cotenant,owner:string):Promise<void>{
 if(cot.user_id!==owner)throw new Error('Cotenant account changed');const cloud=await resolveRentalCloudId(cot.lot_id,owner),client=await requireRentalOwner(owner);
 const {data,error}=await client.from('rental_cotenants').delete().eq('id',cot.id).eq('lot_id',cloud).eq('user_id',owner).eq('updated_at',cot.updated_at).select('id');
 if(error||data?.length!==1||data[0].id!==cot.id)throw new Error('Cotenant deletion not confirmed');await requireRentalOwner(owner);
}
export function computeSharedRent(totalRent:number,sharePct:number):number {
 decimal(totalRent,2e9);if(!Number.isFinite(sharePct)||sharePct<0||sharePct>100)throw new Error('Invalid share');
 return Math.round(totalRent*sharePct)/100;
}
/** Keep active fixed shares; allocate integer basis points to active zero shares. */
export function autoBalanceShares(cotenants:Cotenant[]):Record<string,number>{
 const out:Record<string,number>={},active=cotenants.filter(c=>c.status==='active');
 for(const c of cotenants){if(Object.hasOwn(out,c.id))throw new Error('Duplicate cotenant');out[c.id]=decimal(c.share_pct,100);}
 const fixed=active.filter(c=>c.share_pct>0).reduce((n,c)=>n+Math.round(c.share_pct*100),0),flexible=active.filter(c=>c.share_pct===0).sort((a,b)=>a.id.localeCompare(b.id));
 if(fixed>10000||!flexible.length&&fixed!==10000)throw new Error('Shares cannot be balanced');
 const remaining=10000-fixed,base=flexible.length?Math.floor(remaining/flexible.length):0,extra=flexible.length?remaining%flexible.length:0;
 flexible.forEach((c,i)=>{out[c.id]=(base+(i<extra?1:0))/100});return out;
}

/** Largest remainders preserve the exact monthly amount in cents. */
export function allocateSharedRents(totalRent:number,cotenants:Cotenant[]):Record<string,number>|null{
 const total=Math.round(decimal(totalRent,2e9)*100),active=cotenants.filter(c=>c.status==='active');
 const shares=active.map(c=>({id:c.id,bp:Math.round(decimal(c.share_pct,100)*100)}));
 if(new Set(shares.map(c=>c.id)).size!==shares.length)throw new Error('Duplicate cotenant');
 if(shares.reduce((n,c)=>n+c.bp,0)!==10000)return null;
 const allocations=shares.map(c=>{const product=BigInt(total)*BigInt(c.bp);return {...c,cents:Number(product/10000n),rest:Number(product%10000n)}});
 let remainder=total-allocations.reduce((n,c)=>n+c.cents,0);
 allocations.sort((a,b)=>b.rest-a.rest||a.id.localeCompare(b.id));
 for(const c of allocations)if(remainder>0){c.cents++;remainder--;}
 return Object.fromEntries(allocations.map(c=>[c.id,c.cents/100]));
}
