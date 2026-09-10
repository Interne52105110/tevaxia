import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({getSession:vi.fn(),getUser:vi.fn()}));
vi.mock('../supabase',()=>({supabase:{auth:mocks}}));
import {loadOwnedMarketAlerts,writeOwnedMarketAlert,parseMarketTarget,type OwnedMarketAlert} from '../owned-market-alerts';
const id=(n:number)=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
const row=(n=1):OwnedMarketAlert=>({id:id(n),user_id:'a',commune:'Luxembourg',target_price_m2:8000,direction:'below',active:true,created_at:'2026-09-10T08:00:00Z',updated_at:'2026-09-10T08:00:00Z'});
const choice={commune:'Luxembourg',target_price_m2:0,direction:'above' as const,active:false};
beforeEach(()=>{
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://qa.example.test');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','public-test');mocks.getSession.mockReset().mockResolvedValue({data:{session:{user:{id:'a'},access_token:'jwt-a'}}});mocks.getUser.mockReset().mockResolvedValue({data:{user:{id:'a'}}});
 vi.stubGlobal('fetch',vi.fn(async(_url,options)=>new Response(JSON.stringify(options?.method?[{...row(),...(options.body?JSON.parse(String(options.body)):{})}]:[]))));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
it('parses localized cent prices, zero and optional blank without partial parsing',()=>{expect(parseMarketTarget('8,25')).toBe(8.25);expect(parseMarketTarget('0')).toBe(0);expect(parseMarketTarget(' ')).toBeNull();for(const value of ['-1','12abc','1e3','Infinity','NaN','1.234','1,2,3','100000001'])expect(()=>parseMarketTarget(value)).toThrow()});
it('pages until an empty response even with a short server page',async()=>{
 vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify([row(1)]))).mockResolvedValueOnce(new Response(JSON.stringify([row(2)]))).mockResolvedValueOnce(new Response('[]'));
 expect(await loadOwnedMarketAlerts('a','Luxembourg')).toHaveLength(2);const calls=vi.mocked(fetch).mock.calls;expect(calls).toHaveLength(3);const query=new URL(String(calls[1][0])).searchParams;expect(query.get('id')).toBe('gt.'+id(1));expect(query.get('user_id')).toBe('eq.a');expect(query.get('commune')).toBe('eq.Luxembourg');expect(calls[0][1]?.headers).toMatchObject({Authorization:'Bearer jwt-a'});
});
it('does not turn read failure into an empty list',async()=>{vi.mocked(fetch).mockResolvedValue(new Response('{}',{status:503}));await expect(loadOwnedMarketAlerts('a')).rejects.toThrow('read failed')});
it.each([{...row(),user_id:'b'},{...row(),target_price_m2:'8000'},{...row(),active:'true'},{...row(),direction:'sideways'},{...row(),updated_at:null}])('rejects malformed or foreign rows',async value=>{vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([value])));await expect(loadOwnedMarketAlerts('a')).rejects.toThrow('Invalid')});
it('rejects repeated/out-of-order pages and another commune in a filtered response',async()=>{
 vi.mocked(fetch).mockImplementation(async()=>new Response(JSON.stringify([row()])));await expect(loadOwnedMarketAlerts('a')).rejects.toThrow('Invalid');
 vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([row()])));await expect(loadOwnedMarketAlerts('a','Mersch')).rejects.toThrow('Invalid');
});
it('does not display old-owner data after switching accounts',async()=>{mocks.getSession.mockResolvedValueOnce({data:{session:{user:{id:'a'},access_token:'jwt-a'}}}).mockResolvedValueOnce({data:{session:{user:{id:'b'},access_token:'jwt-b'}}});await expect(loadOwnedMarketAlerts('a')).rejects.toThrow('changed')});
it('patches only the captured record with old-field and timestamp predicates',async()=>{
 const result=await writeOwnedMarketAlert('a',row(),choice,()=>true);expect(result.target_price_m2).toBe(0);const [url,options]=vi.mocked(fetch).mock.calls[0],query=new URL(String(url)).searchParams;expect(options?.method).toBe('PATCH');expect(query.get('id')).toBe('eq.'+id(1));expect(query.get('user_id')).toBe('eq.a');expect(query.get('active')).toBe('eq.true');expect(query.get('target_price_m2')).toBe('eq.8000');expect(query.get('updated_at')).toBe('eq.'+row().updated_at);expect(JSON.parse(String(options?.body))).toEqual(choice);expect(options?.headers).toMatchObject({Authorization:'Bearer jwt-a'});
});
it('uses a distinct predicate for a null threshold',async()=>{await writeOwnedMarketAlert('a',{...row(),target_price_m2:null},choice,()=>true);expect(new URL(String(vi.mocked(fetch).mock.calls[0][0])).searchParams.get('target_price_m2')).toBe('is.null')});
it('creates an owned row with a generated identifier, never an upsert',async()=>{const result=await writeOwnedMarketAlert('a',null,choice,()=>true);const options=vi.mocked(fetch).mock.calls[0][1];expect(options?.method).toBe('POST');expect(JSON.parse(String(options?.body))).toEqual({...choice,id:result.id,user_id:'a'});expect(result.id).toMatch(/^[0-9a-f-]{36}$/)});
it('requires a single matching response for delete',async()=>{
 expect((await writeOwnedMarketAlert('a',row(),null,()=>true)).id).toBe(id(1));expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('DELETE');vi.mocked(fetch).mockResolvedValue(new Response('[]'));await expect(writeOwnedMarketAlert('a',row(),null,()=>true)).rejects.toThrow('not confirmed');
});
it.each([403,409,503])('rejects HTTP %s without confirmation',async status=>{vi.mocked(fetch).mockResolvedValue(new Response('{}',{status}));await expect(writeOwnedMarketAlert('a',row(),choice,()=>true)).rejects.toThrow('not confirmed')});
it('rejects a successful HTTP response with unchanged data or a different row',async()=>{for(const value of [row(),{...row(),...choice,id:id(2)}]){vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([value])));await expect(writeOwnedMarketAlert('a',row(),choice,()=>true)).rejects.toThrow('not confirmed')}});
it('does not dispatch when owner or live view changes',async()=>{await expect(writeOwnedMarketAlert('a',row(),choice,()=>false)).rejects.toThrow('changed');expect(fetch).not.toHaveBeenCalled();await expect(writeOwnedMarketAlert('b',row(),choice,()=>true)).rejects.toThrow('Invalid');expect(fetch).not.toHaveBeenCalled()});
it('rejects nonfinite targets and changing a record commune',async()=>{for(const extra of [{target_price_m2:NaN},{target_price_m2:-1},{commune:'Mersch'}])await expect(writeOwnedMarketAlert('a',row(),{...choice,...extra},()=>true)).rejects.toThrow('Invalid');expect(fetch).not.toHaveBeenCalled()});
