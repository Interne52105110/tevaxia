import {beforeEach,afterEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({getSession:vi.fn(),getUser:vi.fn()}));
vi.mock('../supabase',()=>({supabase:{auth:mocks}}));
import {loadAccountDashboard,exactDashboardCount} from '../account-dashboard';
const plan=()=>({user_id:'a',tier:'pro',items_cap:10000,expires_at:null});
beforeEach(()=>{
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://qa.example.test');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','public-test');mocks.getSession.mockReset().mockResolvedValue({data:{session:{user:{id:'a'},access_token:'jwt-a'}}});mocks.getUser.mockReset().mockResolvedValue({data:{user:{id:'a'}}});
 vi.stubGlobal('fetch',vi.fn(async(_url,options)=>options?.method==='HEAD'?new Response(null,{headers:{'content-range':'0-0/42'}}):new Response(JSON.stringify([plan()]))));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
it('distinguishes exact zero from unavailable/estimated/malformed counts',()=>{
 expect(exactDashboardCount('*/0')).toBe(0);expect(exactDashboardCount('0-0/3000')).toBe(3000);for(const value of [null,'0-0/*','0-0/-1','count=42','0-0/1.5','0-0/999999999999999999999'])expect(()=>exactDashboardCount(value)).toThrow();
});
it('loads real account counts with a captured verified token and correct schema fields',async()=>{
 const result=await loadAccountDashboard('a');expect(result).toEqual({plan:{tier:'pro',itemsCap:10000},valuations:42,thresholds:42,sharedLinks:42,apiKeys:42,incomplete:false});
 for(const [url,options] of vi.mocked(fetch).mock.calls){expect(options?.headers).toMatchObject({Authorization:'Bearer jwt-a',Prefer:'count=exact'});const query=new URL(String(url)).searchParams;if(String(url).includes('shared_links'))expect(query.get('owner_user_id')).toBe('eq.a');else expect(query.get('user_id')).toBe('eq.a');if(String(url).includes('api_keys')){expect(query.get('revoked_at')).toBe('is.null');expect(query.has('active')).toBe(false)}if(options?.method==='HEAD')expect(query.get('select')).toBe('id')}
 expect(mocks.getUser).toHaveBeenCalledWith('jwt-a');expect(JSON.stringify(vi.mocked(fetch).mock.calls)).not.toMatch(/user_ai_settings|api_key_encrypted|key_hash|payload/);
});
it('does not turn request failure into free plan or zero counts',async()=>{
 vi.mocked(fetch).mockResolvedValue(new Response('{}',{status:503}));expect(await loadAccountDashboard('a')).toEqual({plan:null,valuations:null,thresholds:null,sharedLinks:null,apiKeys:null,incomplete:true});
});
it('does not turn missing content-range into zero',async()=>{
 vi.mocked(fetch).mockImplementation(async(_url,options)=>options?.method==='HEAD'?new Response(null):new Response(JSON.stringify([plan()])));expect((await loadAccountDashboard('a')).apiKeys).toBeNull();
});
it.each([[],[plan(),plan()],[{...plan(),user_id:'b'}],[{...plan(),tier:'admin'}],[{...plan(),items_cap:-1}],[{...plan(),expires_at:'2000-01-01T00:00:00Z'}],[{...plan(),expires_at:'invalid'}]].map(rows=>({rows})))('does not infer a plan from absent, foreign, malformed or expired metadata',async ({rows})=>{
 vi.mocked(fetch).mockImplementation(async(_url,options)=>options?.method==='HEAD'?new Response(null,{headers:{'content-range':'*/0'}}):new Response(JSON.stringify(rows)));const result=await loadAccountDashboard('a');expect(result.plan).toBeNull();expect(result.incomplete).toBe(true);expect(result.valuations).toBe(0);
});
it('keeps confirmed values when only one count is unavailable',async()=>{
 vi.mocked(fetch).mockImplementation(async(url,options)=>String(url).includes('api_keys')?new Response(null,{status:403}):options?.method==='HEAD'?new Response(null,{headers:{'content-range':'*/0'}}):new Response(JSON.stringify([plan()])));const result=await loadAccountDashboard('a');expect(result.apiKeys).toBeNull();expect(result.sharedLinks).toBe(0);expect(result.plan?.tier).toBe('pro');expect(result.incomplete).toBe(true);
});
it('rejects the entire late response after an account switch',async()=>{
 mocks.getSession.mockResolvedValueOnce({data:{session:{user:{id:'a'},access_token:'jwt-a'}}}).mockResolvedValueOnce({data:{session:{user:{id:'b'},access_token:'jwt-b'}}});await expect(loadAccountDashboard('a')).rejects.toThrow('changed');
});
it('does not query account data if the displayed owner is no longer current',async()=>{
 await expect(loadAccountDashboard('b')).rejects.toThrow('changed');expect(fetch).not.toHaveBeenCalled();
});
