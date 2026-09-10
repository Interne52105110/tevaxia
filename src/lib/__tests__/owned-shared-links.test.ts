import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn() }));
vi.mock('../supabase', () => ({ supabase: { auth: mocks } }));
import { listOwnedSharedLinks, revokeOwnedSharedLink, loadOwnedLinkDetails, assertSharedLinkAccount } from '../owned-shared-links';
const owner = '00000000-0000-4000-8000-000000000001', id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const link = (n = 1) => ({ id: id(n), owner_user_id: owner, token: 'a'.repeat(48), org_id: null, tool_type: 'estimation' as const, title: 'Test', view_count: 0, max_views: null, created_at: '2026-09-01T12:00:00Z', expires_at: '2026-10-01T12:00:00Z' });
const timeline = () => Array.from({ length: 31 }, (_, index) => ({ day: new Date(Date.UTC(2026,7,1+index)).toISOString().slice(0,10), views: 0 }));
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://qa.example.test'); vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','test-public');
  mocks.getSession.mockReset().mockResolvedValue({ data: { session: { user: { id: owner }, access_token: 'jwt-a' } } }); mocks.getUser.mockReset().mockResolvedValue({ data: { user: { id: owner } } });
  vi.stubGlobal('fetch', vi.fn(async () => new Response('[]')));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('pages beyond short pages, verifies ownership, strips calculation payloads and captures token', async () => {
  vi.mocked(fetch).mockImplementation(async input => { const cursor = new URL(String(input)).searchParams.get('id'); return new Response(JSON.stringify(cursor === 'gt.'+id(2) ? [] : [{ ...link(cursor ? 2 : 1), payload: { confidential: 'SECRET' } }])); });
  const result = await listOwnedSharedLinks(owner); expect(result).toHaveLength(2); expect(JSON.stringify(result)).not.toContain('SECRET');
  for (const [input,options] of vi.mocked(fetch).mock.calls) { expect(options?.headers).toMatchObject({ Authorization: 'Bearer jwt-a' }); const url=new URL(String(input)); expect(url.searchParams.get('select')).not.toMatch(/payload|\*/); expect(url.searchParams.get('owner_user_id')).toBe('eq.'+owner); }
});
it('distinguishes a genuine empty list from a request failure', async () => {
  expect(await listOwnedSharedLinks(owner)).toEqual([]); vi.mocked(fetch).mockImplementation(async()=>new Response('{}',{status:403})); await expect(listOwnedSharedLinks(owner)).rejects.toThrow('unavailable');
});
it.each(['foreign','duplicate','negative','badtoken','invalid-date'])('rejects %s metadata', async mode => {
  const row = { ...link(), ...(mode==='foreign'?{owner_user_id:'other'}:mode==='negative'?{view_count:-1}:mode==='badtoken'?{token:'../route'}:mode==='invalid-date'?{expires_at:'invalid'}:{}) };
  vi.mocked(fetch).mockImplementation(async()=>new Response(JSON.stringify(mode==='duplicate'?[row,row]:[row]))); await expect(listOwnedSharedLinks(owner)).rejects.toThrow('Invalid');
});
it('rejects a stale displayed owner before any request', async () => {
  await expect(listOwnedSharedLinks('other')).rejects.toThrow('changed'); expect(fetch).not.toHaveBeenCalled();
});
it('rejects copying for an account that is no longer current', async () => {
  await expect(assertSharedLinkAccount('other')).rejects.toThrow('changed'); expect(fetch).not.toHaveBeenCalled();
});
it('does not dispatch revocation when the component becomes inactive', async () => {
  await expect(revokeOwnedSharedLink(owner,link(),()=>false)).rejects.toThrow('changed'); expect(fetch).not.toHaveBeenCalled();
});
it('confirms the exact deleted access link, without blocking concurrent view increments', async () => {
  vi.mocked(fetch).mockImplementation(async()=>new Response(JSON.stringify([{...link(),view_count:99}])));
  await revokeOwnedSharedLink(owner,link(),()=>true); const [input,options]=vi.mocked(fetch).mock.calls[0],url=new URL(String(input)); expect(options?.method).toBe('DELETE'); expect(url.searchParams.get('owner_user_id')).toBe('eq.'+owner); expect(url.searchParams.get('id')).toBe('eq.'+id(1)); expect(url.searchParams.get('token')).toBe('eq.'+'a'.repeat(48)); expect(url.searchParams.has('view_count')).toBe(false);
});
it.each([[],[link(),link()],[{...link(),token:'b'.repeat(48)}],[{...link(),owner_user_id:'other'}]].map(rows=>({rows})))('does not announce revocation from zero, duplicate or mismatched rows', async ({rows}) => {
  vi.mocked(fetch).mockImplementation(async()=>new Response(JSON.stringify(rows))); await expect(revokeOwnedSharedLink(owner,link(),()=>true)).rejects.toThrow();
});
it('rejects a response received after an account switch', async () => {
  vi.mocked(fetch).mockImplementation(async()=>{ mocks.getSession.mockResolvedValue({data:{session:{user:{id:'other'},access_token:'jwt-b'}}}); return new Response('[]'); });
  await expect(listOwnedSharedLinks(owner)).rejects.toThrow('changed');
});
it('loads timeline and comments only after confirming the owned link, without opening the public link', async () => {
  vi.mocked(fetch).mockImplementation(async input => new Response(JSON.stringify(String(input).includes('get_shared_link_timeline')?{success:true,timeline:timeline()}:String(input).includes('list_shared_link_comments')?{success:true,comments:[]}:[link()])));
  const data=await loadOwnedLinkDetails(owner,link()); expect(data.timeline).toHaveLength(31); expect(data.comments).toEqual([]); expect(fetch).toHaveBeenCalledTimes(3); expect(vi.mocked(fetch).mock.calls.map(c=>String(c[0])).some(url=>url.endsWith('/get_shared_link'))).toBe(false);
});
it.each(['refused','gap','negative','duplicate-comment'])('does not turn %s detail failures into empty statistics', async mode => {
  const days=timeline(); if(mode==='gap')days.splice(2,1); if(mode==='negative')days[0].views=-1;
  const comment={id:id(5),visitor_name:null,visitor_email:null,message:'Fixture',created_at:'2026-09-01T12:00:00Z'};
  vi.mocked(fetch).mockImplementation(async input=>new Response(JSON.stringify(String(input).includes('get_shared_link_timeline')?{success:mode!=='refused',timeline:days}:String(input).includes('list_shared_link_comments')?{success:true,comments:mode==='duplicate-comment'?[comment,comment]:[]}:[link()])));
  await expect(loadOwnedLinkDetails(owner,link())).rejects.toThrow();
});
