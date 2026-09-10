import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({createClient:vi.fn()}));
vi.mock('@supabase/supabase-js',()=>mocks);
import { GET, POST } from '@/app/api/cron/daily/route';
type Row=Record<string,unknown>;
let tables:Record<string,Row[]>,readError:string,writeError:string,eventError:boolean,beforeWrite:((table:string)=>void)|null;
const id=(n:number)=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
const logs:Array<{table:string;method:string;filters:Array<[string,string,unknown]>}>=[];
function query(table:string){
 let method='read',payload:Row|Row[]={},limit=Infinity;const filters:Array<[string,string,unknown]>=[];
 const q={
  select:()=>q,in:(column:string,value:string[])=>{filters.push(['in',column,value]);return q},lt:(column:string,value:string)=>{filters.push(['lt',column,value]);return q},order:()=>q,limit:(value:number)=>{limit=value;return q},
  update:(value:Row)=>{method='update';payload=value;return q},insert:(value:Row[])=>{method='insert';payload=value;return q},
  then:(resolve:(value:unknown)=>unknown,reject:(reason:unknown)=>unknown)=>Promise.resolve().then(()=>{
   logs.push({table,method,filters});
   if(method==='read'&&readError===table)return{data:null,error:{message:'PRIVATE_DATABASE_DETAIL'},count:null};
   if(method==='update'){
    beforeWrite?.(table);
    if(writeError===table)return{data:null,error:{message:'PRIVATE_DATABASE_DETAIL'}};
   }
   if(method==='insert'){
    if(eventError)return{data:null,error:{message:'PRIVATE_EMAIL_DETAIL'}};
    tables[table].push(...payload as Row[]);return{data:payload,error:null};
   }
   const all=tables[table].filter(row=>filters.every(([op,col,val])=>op==='in'?(val as string[]).includes(String(row[col])):typeof row[col]==='string'&&row[col]<String(val)));
   const selected=all.slice(0,limit);
   if(method==='update')for(const row of selected)Object.assign(row,payload);
   return{data:selected.map(row=>({...row})),count:all.length,error:null};
  }).then(resolve,reject),
 };return q;
}
const req=(headers:Record<string,string>={authorization:'Bearer test-cron'})=>new Request('https://example.test/api/cron/daily',{headers});
beforeEach(()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-10T08:00:00Z'));vi.stubEnv('CRON_SECRET','test-cron');vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://qa.example.test');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','synthetic-service-key');
 logs.length=0;readError='';writeError='';eventError=false;beforeWrite=null;
 tables={pms_reservations:[{id:id(1),status:'confirmed',check_in:'2026-09-08'}],coownership_calls:[{id:id(2),status:'issued',due_date:'2026-08-20'}],agency_mandates:[{id:id(3),status:'mandat_signe',end_date:'2026-09-09'}],agency_signature_requests:[{id:id(4),status:'sent',expires_at:'2026-09-09T08:00:00Z'}],agency_signature_events:[]};
 mocks.createClient.mockReset().mockReturnValue({from:query});
});
afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs();vi.unstubAllGlobals()});
it('rejects unauthenticated requests before creating a privileged client',async()=>{const response=await GET(req({}));expect(response.status).toBe(401);expect(mocks.createClient).not.toHaveBeenCalled();expect(response.headers.get('cache-control')).toBe('no-store')});
it('does not execute when configuration is absent',async()=>{vi.stubEnv('CRON_SECRET','');expect((await GET(req())).status).toBe(501);expect(mocks.createClient).not.toHaveBeenCalled()});
it('accepts authorized external POST and reports actual updated and event rows',async()=>{
 const response=await POST(req({'x-cron-secret':'test-cron'}));expect(response.status).toBe(200);expect(await response.json()).toMatchObject({complete:true,pms_no_shows_marked:1,syndic_calls_overdue:1,agency_mandates_expired:1,signature_requests_expired:1,signature_events_recorded:1,errors:[]});
});
it.each([['pms_reservations','checked_in','pms_no_shows_marked'],['coownership_calls','paid','syndic_calls_overdue'],['agency_mandates','vendu','agency_mandates_expired'],['agency_signature_requests','signed','signature_requests_expired']])('does not overwrite a concurrently completed %s',async(table,status,counter)=>{
 beforeWrite=name=>{if(name===table)tables[name][0].status=status};const result=await(await GET(req())).json();expect(tables[table][0].status).toBe(status);expect(result[counter]).toBe(0);if(table==='agency_signature_requests')expect(tables.agency_signature_events).toEqual([]);
});
it.each([['pms_reservations','check_in','2026-09-11'],['coownership_calls','due_date','2026-10-01'],['agency_mandates','end_date','2026-10-01'],['agency_signature_requests','expires_at','2026-10-01T00:00:00Z']])('does not overwrite an extended %s date',async(table,column,value)=>{
 beforeWrite=name=>{if(name===table)tables[name][0][column]=value};await GET(req());expect(tables[table][0].status).not.toMatch(/^(no_show|overdue|expire|expired)$/);
});
it('keeps strict UTC boundary dates unchanged',async()=>{
 tables.pms_reservations[0].check_in='2026-09-09';tables.coownership_calls[0].due_date='2026-08-26';tables.agency_mandates[0].end_date='2026-09-10';tables.agency_signature_requests[0].expires_at='2026-09-10T08:00:00.000Z';const result=await(await GET(req())).json();expect(result.pms_no_shows_marked+result.syndic_calls_overdue+result.agency_mandates_expired+result.signature_requests_expired).toBe(0);
});
it('reports read errors instead of an empty successful run, with no database details',async()=>{
 readError='coownership_calls';const response=await GET(req()),result=await response.json();expect(response.status).toBe(500);expect(result.complete).toBe(false);expect(result.errors).toContain('coownership_calls:read_failed');expect(JSON.stringify(result)).not.toContain('PRIVATE_DATABASE_DETAIL');expect(logs.some(log=>log.table===readError&&log.method==='update')).toBe(false);
});
it('does not count selected rows when their update fails',async()=>{writeError='pms_reservations';const response=await GET(req()),result=await response.json();expect(response.status).toBe(500);expect(result.pms_no_shows_marked).toBe(0);expect(result.errors).toContain('pms_reservations:update_not_confirmed')});
it('reports separately a successful expiry with unconfirmed audit event',async()=>{eventError=true;const response=await GET(req()),result=await response.json();expect(response.status).toBe(500);expect(result.signature_requests_expired).toBe(1);expect(result.signature_events_recorded).toBe(0);expect(result.errors).toContain('agency_signature_requests:events_not_confirmed');expect(JSON.stringify(result)).not.toContain('PRIVATE_EMAIL_DETAIL')});
it('bounds a large batch and explicitly reports remaining work',async()=>{
 tables.pms_reservations=Array.from({length:502},(_,index)=>({id:id(index+10),status:'confirmed',check_in:'2026-09-08'}));const result=await(await GET(req())).json();expect(result.pms_no_shows_marked).toBe(500);expect(result.limited_steps).toContain('pms_reservations');expect(result.complete).toBe(false);expect(tables.pms_reservations.filter(row=>row.status==='confirmed')).toHaveLength(2);
});
it('rejects malformed candidate identifiers without writing',async()=>{tables.pms_reservations[0].id='invalid';const response=await GET(req());expect(response.status).toBe(500);expect(logs.some(log=>log.table==='pms_reservations'&&log.method==='update')).toBe(false)});
it('records events only for signature rows actually expired',async()=>{
 tables.agency_signature_requests.push({id:id(5),status:'sent',expires_at:'2026-09-09T08:00:00Z'});beforeWrite=name=>{if(name==='agency_signature_requests')tables[name][0].status='signed'};const result=await(await GET(req())).json();expect(result.signature_requests_expired).toBe(1);expect(tables.agency_signature_events).toEqual([{request_id:id(5),event_type:'expired'}]);
});
it('does not repeat an expiry or its event on a subsequent run',async()=>{
 await GET(req());const result=await(await GET(req())).json();expect(result.signature_requests_expired).toBe(0);expect(result.signature_events_recorded).toBe(0);expect(tables.agency_signature_events).toHaveLength(1);
});
it('bounds the aggregate transport budget before the route duration limit',async()=>{
 await GET(req());const options=mocks.createClient.mock.calls[0][2];const fetchMock=vi.fn().mockResolvedValue(new Response('{}'));vi.stubGlobal('fetch',fetchMock);
 vi.setSystemTime(new Date('2026-09-10T08:00:46Z'));await expect(options.global.fetch('https://qa.example.test',{})).rejects.toThrow('budget exhausted');expect(fetchMock).not.toHaveBeenCalled();
});
