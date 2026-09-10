import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({getSession:vi.fn(),getUser:vi.fn()}));
vi.mock('../supabase',()=>({supabase:{auth:mocks}}));
import { createOwnedSharedLink } from '../owned-shared-links';
import { prepareSharedLinkDraft, sharedPayloadJson, type SharedLinkDraft } from '../shared-link-draft';
const owner='00000000-0000-4000-8000-000000000001';
const input=()=>({tool_type:'estimation' as const,payload:{inputs:{surface:100},results:{value:300000}},title:' Test ',days:'30',maxViews:''});
const saved=(draft:SharedLinkDraft)=>({...draft,token:'a'.repeat(48),view_count:0,created_at:new Date().toISOString()});
beforeEach(()=>{
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://qa.example.test');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','test-public');
 mocks.getSession.mockReset().mockResolvedValue({data:{session:{user:{id:owner},access_token:'jwt-a'}}});mocks.getUser.mockReset().mockResolvedValue({data:{user:{id:owner}}});vi.stubGlobal('fetch',vi.fn(async()=>new Response('[]')));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
it('prepares a detached calculation snapshot and explicit nullable cap',()=>{
 const source=input(),draft=prepareSharedLinkDraft(owner,source);source.payload.inputs.surface=200;expect(draft.payload).toMatchObject({inputs:{surface:100}});expect(draft.title).toBe('Test');expect(draft.max_views).toBeNull();expect(draft.org_id).toBeNull();expect(draft.owner_user_id).toBe(owner);expect(Date.parse(draft.expires_at)-Date.now()).toBeGreaterThan(29*86400000);
});
it.each(['','0','-1','1.5','2days','1e2','366'])('refuses invalid day input %s without silently clamping',days=>{
 expect(()=>prepareSharedLinkDraft(owner,{...input(),days})).toThrow();
});
it.each(['0','-1','1.5','2views','1e2','1000001'])('refuses invalid view cap %s',maxViews=>{
 expect(()=>prepareSharedLinkDraft(owner,{...input(),maxViews})).toThrow();
});
it('preserves optional object fields semantics but rejects non-finite or oversized content',()=>{
 expect(sharedPayloadJson({value:0,optional:undefined})).toBe('{"value":0}');for(const value of [NaN,Infinity,()=>0])expect(()=>sharedPayloadJson({value})).toThrow();expect(()=>sharedPayloadJson({text:'é'.repeat(130000)})).toThrow();expect(()=>prepareSharedLinkDraft(owner,{...input(),title:'x'.repeat(201)})).toThrow();
});
it('checks the attempt first then confirms all published fields with the captured account token',async()=>{
 const draft=prepareSharedLinkDraft(owner,input());vi.mocked(fetch).mockImplementation(async(_url,options)=>new Response(JSON.stringify(options?.method==='POST'?[saved(draft)]:[])));
 const result=await createOwnedSharedLink(owner,draft,()=>true);expect(result.token).toBe('a'.repeat(48));expect(result).not.toHaveProperty('payload');expect(fetch).toHaveBeenCalledTimes(2);
 const [url,options]=vi.mocked(fetch).mock.calls[1];expect(options?.headers).toMatchObject({Authorization:'Bearer jwt-a'});expect(JSON.parse(String(options?.body))).toEqual(draft);expect(new URL(String(url)).searchParams.get('owner_user_id')).toBe('eq.'+owner);
});
it('recovers an uncertain successful POST with the same ID without another public copy',async()=>{
 const draft=prepareSharedLinkDraft(owner,input());let stored:ReturnType<typeof saved>|null=null;
 vi.mocked(fetch).mockImplementation(async(_url,options)=>{if(options?.method==='POST'){stored=saved(draft);throw Error('Lost response')}return new Response(JSON.stringify(stored?[stored]:[]))});
 await expect(createOwnedSharedLink(owner,draft,()=>true)).rejects.toThrow();expect((await createOwnedSharedLink(owner,draft,()=>true)).id).toBe(draft.id);expect(vi.mocked(fetch).mock.calls.filter(c=>c[1]?.method==='POST')).toHaveLength(1);
});
it('accepts JSONB object key reordering on retry but refuses a different calculation',async()=>{
 const draft=prepareSharedLinkDraft(owner,input());vi.mocked(fetch).mockImplementation(async()=>new Response(JSON.stringify([{...saved(draft),payload:{results:{value:300000},inputs:{surface:100}}}])));await createOwnedSharedLink(owner,draft,()=>true);
 vi.mocked(fetch).mockImplementation(async()=>new Response(JSON.stringify([{...saved(draft),payload:{results:{value:1},inputs:{surface:100}}}])));await expect(createOwnedSharedLink(owner,draft,()=>true)).rejects.toThrow('not confirmed');expect(vi.mocked(fetch).mock.calls.filter(c=>c[1]?.method==='POST')).toHaveLength(0);
});
it('does not publish from a stale owner or inactive component',async()=>{
 const draft=prepareSharedLinkDraft(owner,input());await expect(createOwnedSharedLink('other',draft,()=>true)).rejects.toThrow();await expect(createOwnedSharedLink(owner,draft,()=>false)).rejects.toThrow('changed');expect(fetch).not.toHaveBeenCalled();
});
it('blocks publication if the account changes after the attempt lookup',async()=>{
 const draft=prepareSharedLinkDraft(owner,input());vi.mocked(fetch).mockImplementation(async()=>{mocks.getSession.mockResolvedValue({data:{session:{user:{id:'other'},access_token:'jwt-b'}}});return new Response('[]')});await expect(createOwnedSharedLink(owner,draft,()=>true)).rejects.toThrow('changed');expect(fetch).toHaveBeenCalledTimes(1);
});
it('copies draft contents before authentication awaits',async()=>{
 const draft=prepareSharedLinkDraft(owner,input()),expected=structuredClone(draft);
 mocks.getSession.mockImplementation(async()=>{
   draft.payload={other:'mutation'};draft.title='Changed';
   return {data:{session:{user:{id:owner},access_token:'jwt-a'}}};
 });
 vi.mocked(fetch).mockImplementation(async(_url,options)=>new Response(JSON.stringify(options?.method==='POST'?[saved(expected)]:[])));
 await createOwnedSharedLink(owner,draft,()=>true);expect(JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body))).toEqual(expected);
});
it.each(['zero','other-id','other-title','other-cap','other-expiration'])('refuses %s confirmation',async mode=>{
 const draft=prepareSharedLinkDraft(owner,input()),row={...saved(draft),...(mode==='other-id'?{id:crypto.randomUUID()}:mode==='other-title'?{title:'Other'}:mode==='other-cap'?{max_views:3}:mode==='other-expiration'?{expires_at:'2030-01-01T00:00:00Z'}:{})};vi.mocked(fetch).mockImplementation(async(_url,options)=>new Response(JSON.stringify(options?.method==='POST'&&mode!=='zero'?[row]:[])));await expect(createOwnedSharedLink(owner,draft,()=>true)).rejects.toThrow('not confirmed');
});
