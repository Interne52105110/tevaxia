// Account-specific saved calculations and local recovery bin.
import { supabase } from './supabase';
export interface SavedValuation {
  id: string;
  nom: string;
  date: string;
  type: "estimation" | "valorisation" | "capitalisation" | "dcf" | "dcf-multi" | "frais" | "plus-values" | "loyer" | "aides" | "achat-location" | "bilan-promoteur" | "str-rentabilite" | "str-arbitrage";
  commune?: string;
  assetType?: string;
  valeurPrincipale?: number;
  data: Record<string, unknown>;
}

export interface TrashedValuation extends SavedValuation {
  deletedAt: string;
}


const LOCAL_CAP=500,TRASH_RETENTION_DAYS=7;
const pendingSaves=new Map<string,{id:string;date:string}>();
type Snapshot={items:SavedValuation[];trash:TrashedValuation[]};
export function valuationStorageKey(userId:string|null):string {return `tevaxia_valuations:v2:${userId ? `user:${encodeURIComponent(userId)}` : 'guest'}`;}
export function legacyValuationSnapshot():string|null {
 if(typeof window==='undefined')return null;
 const items=localStorage.getItem('tevaxia_valuations'),trash=localStorage.getItem('tevaxia_trash');
 return items===null&&trash===null ? null : JSON.stringify({valuations:items,trash});
}
function validateItems(value:unknown):asserts value is SavedValuation[] {
 if(!Array.isArray(value))throw new Error('Invalid saved calculations');
 const ids=new Set<string>();
 for(const v of value){
  if(!v||typeof v!=='object'||typeof v.id!=='string'||!v.id||ids.has(v.id)||typeof v.nom!=='string'||!v.nom.trim()||typeof v.date!=='string'||!Number.isFinite(Date.parse(v.date)))throw new Error('Invalid saved calculation');
  ids.add(v.id);
  if(!['estimation','valorisation','capitalisation','dcf','dcf-multi','frais','plus-values','loyer','aides','achat-location','bilan-promoteur','str-rentabilite','str-arbitrage'].includes(v.type))throw new Error('Invalid calculation type');
  if(v.valeurPrincipale!==undefined&&(typeof v.valeurPrincipale!=='number'||!Number.isFinite(v.valeurPrincipale)))throw new Error('Invalid saved amount');
  for(const key of ['commune','assetType'])if(v[key]!==undefined&&typeof v[key]!=='string')throw new Error('Invalid calculation label');
  if(!v.data||typeof v.data!=='object'||Array.isArray(v.data))throw new Error('Invalid calculation inputs');
  JSON.stringify(v.data,(_key,x)=>{if(typeof x==='number'&&!Number.isFinite(x))throw new Error('Invalid calculation number');return x;});
 }
}
function read(userId:string|null):Snapshot {
 if(typeof window==='undefined')return {items:[],trash:[]};
 const raw=localStorage.getItem(valuationStorageKey(userId));
 if(!raw)return {items:[],trash:[]};
 const value=JSON.parse(raw);
 if(!value||typeof value!=='object')throw new Error('Invalid calculation archive');
 validateItems(value.items);validateItems(value.trash);
 for(const item of value.trash)if(typeof item.deletedAt!=='string'||!Number.isFinite(Date.parse(item.deletedAt)))throw new Error('Invalid recovery date');
 return value;
}
function write(value:Snapshot,userId:string|null):void {
 validateItems(value.items);validateItems(value.trash);
 if(value.items.length>LOCAL_CAP)throw new Error('Calculation capacity exceeded');
 if(typeof window!=='undefined')localStorage.setItem(valuationStorageKey(userId),JSON.stringify(value));
}
async function requireOwner(userId:string){
 if(!supabase)throw new Error('Calculation service unavailable');
 const {data,error}=await supabase.auth.getUser();
 if(error||data.user?.id!==userId)throw new Error('Calculation account changed');
}
async function cloudUpsert(v:SavedValuation,userId:string):Promise<void>{
 await requireOwner(userId);
 const {data,error}=await supabase!.from('valuations').upsert({user_id:userId,local_id:v.id,nom:v.nom,type:v.type,commune:v.commune??null,asset_type:v.assetType??null,valeur_principale:v.valeurPrincipale??null,data:v.data,created_at:v.date},{onConflict:'user_id,local_id'}).select('local_id');
 if(error||data?.length!==1||data[0].local_id!==v.id)throw new Error('Calculation save not confirmed');
 await requireOwner(userId);
}
async function cloudDelete(id:string,userId:string):Promise<void>{
 await requireOwner(userId);
 const {data,error}=await supabase!.from('valuations').delete().eq('user_id',userId).eq('local_id',id).select('local_id');
 if(error||data?.length!==1||data[0].local_id!==id)throw new Error('Calculation deletion not confirmed');
 await requireOwner(userId);
}
async function cloudList(userId:string):Promise<SavedValuation[]>{
 await requireOwner(userId);
 const rows:Record<string,unknown>[]=[];let cursor:string|null=null;
 for(;;){
  let query=supabase!.from('valuations').select('*').eq('user_id',userId).gt('expires_at',new Date().toISOString()).order('id').limit(200);
  if(cursor)query=query.gt('id',cursor);
  const {data,error}=await query;
  if(error||!Array.isArray(data))throw new Error('Calculations unavailable');
  await requireOwner(userId);
  if(!data.length)break;
  const next=data[data.length-1].id;
  if(typeof next!=='string'||(cursor!==null&&next<=cursor))throw new Error('Invalid calculation page');
  rows.push(...data);if(rows.length>LOCAL_CAP)throw new Error('Calculation capacity exceeded');cursor=next;
 }
 const items=rows.map(d=>{
  if(d.user_id!==userId)throw new Error('Invalid calculation owner');
  const raw=d.valeur_principale;
  if(raw!==null&&raw!==undefined&&(typeof raw!=='number'&&typeof raw!=='string'||String(raw).trim()===''||!Number.isFinite(Number(raw))))throw new Error('Invalid saved amount');
  return {id:(d.local_id as string)||(d.id as string),nom:d.nom as string,date:d.created_at as string,type:d.type as SavedValuation['type'],commune:(d.commune as string|null)??undefined,assetType:(d.asset_type as string|null)??undefined,valeurPrincipale:raw===null||raw===undefined?undefined:Number(raw),data:d.data as Record<string,unknown>};
 });
 validateItems(items);return items;
}
export async function sauvegarderEvaluation(valuation:Omit<SavedValuation,'id'|'date'>,userId:string|null):Promise<SavedValuation>{
 const before=read(userId);if(before.items.length>=LOCAL_CAP)throw new Error('Calculation capacity exceeded');
 const fingerprint=JSON.stringify([userId,valuation]);
 const previous=pendingSaves.get(fingerprint),identity=previous??{id:crypto.randomUUID(),date:new Date().toISOString()};
 const saved={...valuation,...identity};validateItems([saved]);
 if(!previous&&pendingSaves.size>=256)throw new Error('Too many pending calculation saves');
 pendingSaves.set(fingerprint,identity);
 if(userId)await cloudUpsert(saved,userId);
 const state=read(userId);state.items=[saved,...state.items.filter(v=>v.id!==saved.id)];write(state,userId);pendingSaves.delete(fingerprint);return saved;
}
export function listerEvaluations(userId:string|null):SavedValuation[]{return read(userId).items;}
export function chargerEvaluation(id:string,userId:string|null):SavedValuation|null{return read(userId).items.find(v=>v.id===id)??null;}
export async function listerEvaluationsAsync(userId:string|null):Promise<{items:SavedValuation[];cloud:boolean;cloudError:boolean}>{
 const initial=read(userId),snapshot=JSON.stringify(initial);
 if(!userId)return {items:initial.items,cloud:false,cloudError:false};
 try{
  const items=await cloudList(userId),current=read(userId);
  if(JSON.stringify(current)!==snapshot)throw new Error('Calculation archive changed during read');
  const active=new Set(items.map(v=>v.id)),trash=new Map(current.trash.map(v=>[v.id,v]));
  // Retain recoverable copies of records removed remotely or after a failed cache write.
  for(const v of current.items)if(!active.has(v.id)&&!trash.has(v.id))trash.set(v.id,{...v,deletedAt:new Date().toISOString()});
  for(const id of active)trash.delete(id);
  write({items:items.sort((a,b)=>b.date.localeCompare(a.date)),trash:[...trash.values()]},userId);
  return {items,cloud:true,cloudError:false};
 }catch{return {items:read(userId).items,cloud:false,cloudError:true};}
}
export async function supprimerEvaluation(id:string,userId:string|null):Promise<void>{
 const item=read(userId).items.find(v=>v.id===id);if(!item)throw new Error('Calculation not found');
 if(userId)await cloudDelete(id,userId);
 const current=read(userId);
 write({items:current.items.filter(v=>v.id!==id),trash:[{...item,deletedAt:new Date().toISOString()},...current.trash.filter(v=>v.id!==id)]},userId);
}
export async function supprimerTout(userId:string|null):Promise<void>{for(const item of read(userId).items)await supprimerEvaluation(item.id,userId);}
export function listerCorbeille(userId:string|null):TrashedValuation[]{
 const state=read(userId),cutoff=Date.now()-TRASH_RETENTION_DAYS*86400000;
 const trash=state.trash.filter(v=>Date.parse(v.deletedAt)>cutoff);
 if(trash.length!==state.trash.length)write({...state,trash},userId);
 return trash;
}
export async function restaurerEvaluation(id:string,userId:string|null):Promise<void>{
 const state=read(userId),item=state.trash.find(v=>v.id===id);if(!item)throw new Error('Recovery item not found');
 if(state.items.length>=LOCAL_CAP&&!state.items.some(v=>v.id===id))throw new Error('Calculation capacity exceeded');
 const {deletedAt:_deletedAt,...valuation}=item;
 if(userId)await cloudUpsert(valuation,userId);
 const current=read(userId);write({items:[valuation,...current.items.filter(v=>v.id!==id)],trash:current.trash.filter(v=>v.id!==id)},userId);
}
export function supprimerDefinitivement(id:string,userId:string|null):void{const state=read(userId);write({...state,trash:state.trash.filter(v=>v.id!==id)},userId);}
export function viderCorbeille(userId:string|null):void{const state=read(userId);write({...state,trash:[]},userId);}
export function compterCorbeille(userId:string|null):number{return listerCorbeille(userId).length;}
