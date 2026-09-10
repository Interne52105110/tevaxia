import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({getSession:vi.fn(),getUser:vi.fn()}));
vi.mock('../supabase',()=>({supabase:{auth:mocks}}));
import {loadProfileTypes,saveProfileTypes} from '../profile-type-preferences';
const timestamp='2026-09-10T08:00:00.000Z';
const row=()=>({user_id:'a',profile_types:['expert'],updated_at:timestamp});
const baseline=()=>({types:['expert'] as ['expert'],updatedAt:timestamp});
beforeEach(()=>{
 vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://qa.example.test');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','public-test-key');
 mocks.getSession.mockReset().mockResolvedValue({data:{session:{user:{id:'a'},access_token:'jwt-a'}}});mocks.getUser.mockReset().mockResolvedValue({data:{user:{id:'a'}}});
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify([row()]))));
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs()});
it('loads only the captured owner and profile columns with the verified token',async()=>{
 expect(await loadProfileTypes('a')).toEqual(baseline());const [url,options]=vi.mocked(fetch).mock.calls[0];expect(new URL(String(url)).searchParams.get('user_id')).toBe('eq.a');expect(new URL(String(url)).searchParams.get('limit')).toBe('2');expect(options?.headers).toMatchObject({Authorization:'Bearer jwt-a'});expect(mocks.getUser).toHaveBeenCalledWith('jwt-a');
});
it('distinguishes absent row from an existing null selection',async()=>{
 vi.mocked(fetch).mockResolvedValueOnce(new Response('[]')).mockResolvedValueOnce(new Response(JSON.stringify([{...row(),profile_types:null}])));
 expect(await loadProfileTypes('a')).toEqual({types:null,updatedAt:null});expect(await loadProfileTypes('a')).toEqual({types:null,updatedAt:timestamp});
});
it.each([503,403])('does not treat read error %s as no selected profiles',async status=>{vi.mocked(fetch).mockResolvedValue(new Response('{}',{status}));await expect(loadProfileTypes('a')).rejects.toThrow('read failed')});
it.each([{...row(),user_id:'b'},{...row(),profile_types:['admin']},{...row(),profile_types:['expert','expert']},{...row(),profile_types:'expert'},{...row(),updated_at:null}])('rejects foreign or malformed rows',async value=>{vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([value])));await expect(loadProfileTypes('a')).rejects.toThrow('Invalid')});
it('rejects duplicate rows',async()=>{vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([row(),row()])));await expect(loadProfileTypes('a')).rejects.toThrow('Invalid')});
it('rejects a late read after account change',async()=>{
 mocks.getSession.mockResolvedValueOnce({data:{session:{user:{id:'a'},access_token:'jwt-a'}}}).mockResolvedValueOnce({data:{session:{user:{id:'b'},access_token:'jwt-b'}}});await expect(loadProfileTypes('a')).rejects.toThrow('changed');
});
it('patches only profile_types with version and array predicates',async()=>{
 vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([{...row(),profile_types:['api']}])));await saveProfileTypes('a',baseline(),['api'],()=>true);
 const [url,options]=vi.mocked(fetch).mock.calls[0],query=new URL(String(url)).searchParams;expect(options?.method).toBe('PATCH');expect(query.get('user_id')).toBe('eq.a');expect(query.get('updated_at')).toBe('eq.'+timestamp);expect(query.get('profile_types')).toBe('eq.{expert}');expect(JSON.parse(String(options?.body))).toEqual({profile_types:['api']});expect(options?.headers).toMatchObject({Authorization:'Bearer jwt-a'});
});
it('preserves null and empty-array baseline predicates distinctly',async()=>{
 await saveProfileTypes('a',{types:null,updatedAt:timestamp},['expert'],()=>true);expect(new URL(String(vi.mocked(fetch).mock.calls[0][0])).searchParams.get('profile_types')).toBe('is.null');
 vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([row()])));await saveProfileTypes('a',{types:[],updatedAt:timestamp},['expert'],()=>true);expect(new URL(String(vi.mocked(fetch).mock.calls[1][0])).searchParams.get('profile_types')).toBe('eq.{}');
});
it('creates an absent row without upserting unrelated preferences',async()=>{
 await saveProfileTypes('a',{types:null,updatedAt:null},['expert'],()=>true);const options=vi.mocked(fetch).mock.calls[0][1];expect(options?.method).toBe('POST');expect(JSON.parse(String(options?.body))).toEqual({user_id:'a',profile_types:['expert']});expect(options?.headers).not.toMatchObject({Prefer:expect.stringContaining('merge-duplicates')});
});
it('requires an exact server-confirmed selection and a single returned row',async()=>{
 for(const rows of [[],[row(),row()],[{...row(),profile_types:['api']}]]){vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(rows)));await expect(saveProfileTypes('a',baseline(),['expert'],()=>true)).rejects.toThrow('not confirmed')}
});
it.each([403,409,503])('does not report HTTP %s as saved',async status=>{vi.mocked(fetch).mockResolvedValue(new Response('{}',{status}));await expect(saveProfileTypes('a',baseline(),['expert'],()=>true)).rejects.toThrow('not confirmed')});
it('clears only the selected profiles with explicit null',async()=>{vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([{...row(),profile_types:null}])));expect((await saveProfileTypes('a',baseline(),[],()=>true)).types).toBeNull();expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({profile_types:null})});
it('does not dispatch after unmount or a changed account',async()=>{
 await expect(saveProfileTypes('a',baseline(),['expert'],()=>false)).rejects.toThrow('changed');expect(fetch).not.toHaveBeenCalled();
 mocks.getSession.mockResolvedValue({data:{session:{user:{id:'b'},access_token:'jwt-b'}}});await expect(saveProfileTypes('a',baseline(),['expert'],()=>true)).rejects.toThrow('changed');expect(fetch).not.toHaveBeenCalled();
});
