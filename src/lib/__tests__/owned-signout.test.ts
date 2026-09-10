import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { createChunks, stringToBase64URL } from '@supabase/ssr';
const mock=vi.hoisted(()=>({getSession:vi.fn(),signOut:vi.fn()}));
vi.mock('../supabase',()=>({supabase:{auth:mock}}));
const A={owner:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',sessionId:'11111111-1111-1111-1111-111111111111'};
const B={owner:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',sessionId:'22222222-2222-2222-2222-222222222222'};
const token=(identity:typeof A)=>'e30.'+stringToBase64URL(JSON.stringify({sub:identity.owner,session_id:identity.sessionId}))+'.signature';
const key='sb-qa-auth-token';
let cookies:Map<string,string>,store:Map<string,string>,policy:typeof import('../sign-out-owned-session'),sessionPolicy:typeof import('../signed-out-session');
const setCookieSession=(identity:typeof A)=>{for(const name of cookies.keys())if(name===key||name.startsWith(key+'.'))cookies.delete(name);for(const chunk of createChunks(key,'base64-'+stringToBase64URL(JSON.stringify({access_token:token(identity)})),100))cookies.set(chunk.name,chunk.value)};
beforeEach(async()=>{
 vi.resetModules();cookies=new Map([['unrelated','preserve'],['sb-qa-auth-token-code-verifier','pending-login']]);store=new Map();
 vi.stubGlobal('window',new EventTarget());vi.stubGlobal('location',{hostname:'tevaxia.lu',protocol:'https:'});
 vi.stubGlobal('document',{get cookie(){return [...cookies].map(([k,v])=>`${k}=${v}`).join('; ')},set cookie(value:string){if(value.includes('Max-Age=0'))cookies.delete(value.split('=')[0])}});
 vi.stubGlobal('localStorage',{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)});
 vi.stubGlobal('navigator',{locks:{request:vi.fn(async(_name:string,_options:object,fn:()=>Promise<unknown>)=>fn())}});
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://qa.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','synthetic-key');
 mock.getSession.mockReset();mock.signOut.mockReset();mock.getSession.mockResolvedValue({data:{session:{access_token:token(A),user:{id:A.owner}}},error:null});
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status:204})));setCookieSession(A);
 policy=await import('../sign-out-owned-session');sessionPolicy=await import('../signed-out-session');
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
it('revokes only the captured JWT and clears its cookie chunks under the SDK lock',async()=>{
 const result=await policy.signOutOwnedSession(A,'local',()=>true);expect(result).toEqual({serverRevoked:true,localCleared:true,accountChanged:false,remembered:true});
 expect(fetch).toHaveBeenCalledWith('https://qa.supabase.co/auth/v1/logout?scope=local',expect.objectContaining({headers:{apikey:'synthetic-key',Authorization:`Bearer ${token(A)}`}}));
 expect(navigator.locks.request).toHaveBeenCalledWith('lock:sb-qa-auth-token',expect.anything(),expect.any(Function));
 expect([...cookies]).toEqual([['unrelated','preserve'],['sb-qa-auth-token-code-verifier','pending-login']]);expect(mock.signOut).not.toHaveBeenCalled();
 expect(sessionPolicy.isSignedOutSession(token(A))).toBe(true);
});
it('preserves another account that signs in while the logout response is pending',async()=>{
 vi.mocked(fetch).mockImplementation(async()=>{setCookieSession(B);return new Response(null,{status:204})});
 const result=await policy.signOutOwnedSession(A,'local',()=>true);expect(result.accountChanged).toBe(true);expect(sessionPolicy.isSignedOutSession(token(B))).toBe(false);
 expect(await policy.clearOwnedAuthCookies(key,A)).toBe('changed');expect([...cookies.keys()].some(k=>k.startsWith(key+'.'))).toBe(true);
});
it('preserves a newer login session of the same account',async()=>{
 const newA={...A,sessionId:B.sessionId};vi.mocked(fetch).mockImplementation(async()=>{setCookieSession(newA);return new Response(null,{status:204})});
 expect((await policy.signOutOwnedSession(A,'local',()=>true)).accountChanged).toBe(true);expect(sessionPolicy.isSignedOutSession(token(newA))).toBe(false);
});
it('can clear this browser offline while reporting remote revocation as unconfirmed',async()=>{
 vi.mocked(fetch).mockRejectedValue(new Error('offline'));const result=await policy.signOutOwnedSession(A,'global',()=>true);
 expect(result.localCleared).toBe(true);expect(result.serverRevoked).toBe(false);
});
it('does not call the server after an account switch before dispatch',async()=>{
 await expect(policy.signOutOwnedSession(A,'local',()=>false)).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
 mock.getSession.mockResolvedValue({data:{session:{access_token:token(B)}},error:null});await expect(policy.signOutOwnedSession(A,'local',()=>true)).rejects.toThrow();expect(fetch).not.toHaveBeenCalled();
});
it('does not claim local success when cookie writes are blocked',async()=>{
 vi.stubGlobal('document',{get cookie(){return [...cookies].map(([k,v])=>`${k}=${v}`).join('; ')},set cookie(_value:string){}});
 const result=await policy.signOutOwnedSession(A,'local',()=>true);expect(result.localCleared).toBe(false);expect(sessionPolicy.isSignedOutSession(token(A))).toBe(false);
});
it('preserves malformed browser cookies instead of deleting an unidentified session',async()=>{
 cookies=new Map([[key,'malformed']]);const result=await policy.signOutOwnedSession(A,'local',()=>true);expect(result.localCleared).toBe(false);expect(cookies.get(key)).toBe('malformed');
});
it('reports unavailable safe locking and blocked cross-tab persistence',async()=>{
 vi.stubGlobal('navigator',{});expect((await policy.signOutOwnedSession(A,'local',()=>true)).localCleared).toBe(false);
 vi.stubGlobal('navigator',{locks:{request:async(_name:string,_options:object,fn:()=>Promise<unknown>)=>fn()}});localStorage.setItem=()=>{throw new Error('blocked')};const result=await policy.signOutOwnedSession(A,'local',()=>true);expect(result.localCleared).toBe(true);expect(result.remembered).toBe(false);expect(sessionPolicy.isSignedOutSession(token(A))).toBe(true);
});
it.each(['invalid','e30.e30.signature','e30.bnVsbA.signature'])('rejects malformed session identity %s',value=>expect(sessionPolicy.sessionIdentity(value)).toBeNull());
