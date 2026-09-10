import {beforeEach,describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({owner:'owner-a',answers:[] as Array<unknown>,queries:[] as Array<{table:string;ops:Array<[string,...unknown[]]>}>}));
vi.mock('../supabase',()=>({isSupabaseConfigured:true,supabase:{auth:{getUser:vi.fn(async()=>({data:{user:{id:state.owner}},error:null}))},from:(table:string)=>{
 const q={table,ops:[] as Array<[string,...unknown[]]>};state.queries.push(q);
 const done=()=>{const a=state.answers.shift();if(a===undefined)throw Error('Missing mock response '+table);return typeof a==='function'?a(q):a};
 const b:Record<string,unknown>={};for(const method of ['select','eq','is','gt','order','limit','insert','upsert','update','delete'])b[method]=(...args:unknown[])=>{q.ops.push([method,...args]);return b};
 b.single=b.maybeSingle=()=>Promise.resolve(done());b.then=(resolve:(v:unknown)=>void,reject:(e:unknown)=>void)=>Promise.resolve().then(done).then(resolve,reject);return b;
}}}));

import {listCotenantsForLot,createCotenant,updateCotenant,deleteCotenant,type Cotenant} from '../cotenants';
const base={id:'c-a',lot_id:'cloud',user_id:'owner-a',name:'Synthetic',email:null,phone:null,share_pct:50,deposit_amount:100,bail_start:null,bail_end:null,status:'active',created_at:'2026-01-01T00:00:00Z',updated_at:'2026-01-01T00:00:00Z'};
const domain=()=>({...base,lot_id:'local'}) as Cotenant;
const ok=(data:unknown)=>({data,error:null});
const lot=()=>state.answers.push(ok({id:'cloud',local_id:'local',user_id:'owner-a'}));
beforeEach(()=>{state.owner='owner-a';state.answers=[];state.queries=[]});
describe('cotenant cloud integrity',()=>{
 it('resolves owned cloud lot and reads through short pages',async()=>{lot();state.answers.push(ok([base]),ok([{...base,id:'c-b'}]),ok([]));const rows=await listCotenantsForLot('local','owner-a');expect(rows).toHaveLength(2);expect(rows[0].lot_id).toBe('local');for(const q of state.queries.filter(q=>q.table==='rental_cotenants'))expect(q.ops).toContainEqual(['eq','user_id','owner-a'])});
 it('rejects an incomplete later page',async()=>{lot();state.answers.push(ok([base]),{data:null,error:{message:'offline'}});await expect(listCotenantsForLot('local','owner-a')).rejects.toThrow()});
 it('rejects cross-owner data',async()=>{lot();state.answers.push(ok([{...base,user_id:'other'}]));await expect(listCotenantsForLot('local','owner-a')).rejects.toThrow()});
 it('creates using a stable supplied ID and owned cloud lot',async()=>{lot();state.answers.push(ok(base));await createCotenant({id:base.id,lot_id:'local',name:base.name,share_pct:50,deposit_amount:100},'owner-a');const q=state.queries.find(q=>q.table==='rental_cotenants');expect(q?.ops.find(o=>o[0]==='insert')?.[1]).toMatchObject({id:base.id,lot_id:'cloud',user_id:'owner-a'})});
 it('refuses an invalid amount before insert',async()=>{lot();await expect(createCotenant({id:'a',lot_id:'local',name:'Name',share_pct:101},'owner-a')).rejects.toThrow();expect(state.queries.filter(q=>q.table==='rental_cotenants')).toHaveLength(0)});
 it('limits share update to amount and captured version',async()=>{lot();state.answers.push(ok({...base,share_pct:75}));await updateCotenant(domain(),{share_pct:75},'owner-a');const q=state.queries.find(q=>q.table==='rental_cotenants')!;expect(q.ops).toContainEqual(['update',{share_pct:75}]);expect(q.ops).toContainEqual(['eq','updated_at',base.updated_at]);expect(q.ops).toContainEqual(['eq','lot_id','cloud'])});
 it('refuses an unconfirmed or stale update',async()=>{lot();state.answers.push(ok(null));await expect(updateCotenant(domain(),{share_pct:75},'owner-a')).rejects.toThrow()});
 it('requires confirmation for deletion',async()=>{lot();state.answers.push(ok([]));await expect(deleteCotenant(domain(),'owner-a')).rejects.toThrow()});
 it('rejects a changed account before any query',async()=>{state.owner='other';await expect(deleteCotenant(domain(),'owner-a')).rejects.toThrow();expect(state.queries).toHaveLength(0)});
 it('never reports success after account changes in flight',async()=>{lot();state.answers.push(()=>{state.owner='other';return ok({...base,share_pct:75})});await expect(updateCotenant(domain(),{share_pct:75},'owner-a')).rejects.toThrow()});
});
