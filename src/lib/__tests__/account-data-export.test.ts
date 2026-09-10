import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn() }));
vi.mock('../supabase', () => ({ supabase: { auth: mocks } }));
import { buildDataExport } from '../data-export';
const owner = '00000000-0000-4000-8000-000000000001';
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
let cache: Map<string,string>;
function row(url: URL, n = 1) {
  const value: Record<string, unknown> = Object.fromEntries(url.searchParams.get('select')!.split(',').map(key => [key, null]));
  return { ...value, id: id(n), user_id: owner, owner_user_id: owner };
}
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://qa.example.test'); vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-public');
  mocks.getSession.mockReset().mockResolvedValue({ data: { session: { user: { id: owner }, access_token: 'jwt-a' } } });
  mocks.getUser.mockReset().mockResolvedValue({ data: { user: { id: owner, email: 'fixture@example.test', user_metadata: { profile: { nomComplet: 'Fixture' } } } } });
  cache = new Map(); vi.stubGlobal('window', {}); vi.stubGlobal('localStorage', { getItem: (key: string) => cache.get(key) ?? null, setItem: vi.fn(), removeItem: vi.fn() });
  vi.stubGlobal('fetch', vi.fn(async () => new Response('[]')));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('exports explicit limited coverage, separate local copies and no invented plan', async () => {
  const key = `tevaxia_valuations:v2:user:${owner}`; cache.set(key, JSON.stringify({ items: [], trash: [{ nom: 'Recovered' }] }));
  cache.set('tevaxia_valuations', 'UNASSIGNED'); cache.set('tevaxia_profile:v2:user:other', 'OTHER');
  const before = [...cache], result = await buildDataExport(owner);
  expect(result.tier).toBeNull(); expect(result.coverage).toMatchObject({ complete_account_archive: false, transactional_snapshot: false });
  expect(result.local_copies.valuations).toEqual({ items: [], trash: [{ nom: 'Recovered' }] }); expect(result.profile_cloud).toEqual({ nomComplet: 'Fixture' });
  expect(JSON.stringify(result)).not.toMatch(/UNASSIGNED|OTHER|jwt-a/); expect([...cache]).toEqual(before);
  expect(localStorage.setItem).not.toHaveBeenCalled(); expect(localStorage.removeItem).not.toHaveBeenCalled();
});
it('reads only selected owned fields with captured credentials and does not exclude expired rows', async () => {
  await buildDataExport(owner); expect(mocks.getUser).toHaveBeenCalledWith('jwt-a'); expect(fetch).toHaveBeenCalledTimes(6);
  for (const [input, options] of vi.mocked(fetch).mock.calls) {
    const url = new URL(String(input)); expect(options?.headers).toMatchObject({ Authorization: 'Bearer jwt-a' }); expect(options?.cache).toBe('no-store');
    expect(url.searchParams.get(url.pathname.endsWith('shared_links') ? 'owner_user_id' : 'user_id')).toBe('eq.' + owner);
    expect(url.searchParams.has('expires_at')).toBe(false); expect(url.searchParams.get('select')).not.toMatch(/\*|token|key_hash|payload|encrypted/);
  }
});
it('paginates past short server-capped pages until empty and strips unexpected secrets', async () => {
  vi.mocked(fetch).mockImplementation(async input => {
    const url = new URL(String(input)); if (!url.pathname.endsWith('api_keys')) return new Response('[]');
    const cursor = url.searchParams.get('id');
    return new Response(JSON.stringify(cursor === 'gt.' + id(2) ? [] : [{ ...row(url, cursor ? 2 : 1), key_hash: 'SECRET', token: 'SECRET' }]));
  });
  const result = await buildDataExport(owner); expect(result.cloud.api_keys.map(r => r.id)).toEqual([id(1), id(2)]); expect(JSON.stringify(result)).not.toContain('SECRET');
});
it.each(['valuations','rental_lots','market_alerts','shared_links','api_keys','user_tiers'])('refuses a file when %s cannot be read', async table => {
  vi.mocked(fetch).mockImplementation(async input => new URL(String(input)).pathname.endsWith(table) ? new Response('{}', { status: 403 }) : new Response('[]'));
  await expect(buildDataExport(owner)).rejects.toThrow('read failed');
});
it.each(['foreign','duplicate','missing-column','invalid-id','non-array'])('rejects %s responses rather than a misleading archive', async mode => {
  vi.mocked(fetch).mockImplementation(async input => {
    const url = new URL(String(input)); if (!url.pathname.endsWith('api_keys')) return new Response('[]');
    const value: Record<string,unknown> = row(url);
    if (mode === 'foreign') value.user_id = 'other'; if (mode === 'missing-column') delete value.name; if (mode === 'invalid-id') value.id = 'no-id';
    return new Response(JSON.stringify(mode === 'non-array' ? {} : mode === 'duplicate' ? [value, value] : [value]));
  });
  await expect(buildDataExport(owner)).rejects.toThrow(/Invalid export|Incomplete export/);
});
it('rejects a pre-existing account switch without fetching data', async () => {
  await expect(buildDataExport('other')).rejects.toThrow('changed'); expect(fetch).not.toHaveBeenCalled();
});
it('rejects an account switch during reads', async () => {
  vi.mocked(fetch).mockImplementation(async () => { mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'other' }, access_token: 'jwt-b' } } }); return new Response('[]'); });
  await expect(buildDataExport(owner)).rejects.toThrow('changed');
});
it('rejects malformed local JSON without overwriting it', async () => {
  cache.set(`tevaxia_profile:v2:user:${owner}`, '{'); await expect(buildDataExport(owner)).rejects.toThrow(); expect(localStorage.setItem).not.toHaveBeenCalled();
});
it('rejects a changed local snapshot while preserving new data', async () => {
  vi.mocked(fetch).mockImplementation(async () => { cache.set(`tevaxia_profile:v2:user:${owner}`, '{"nomComplet":"New"}'); return new Response('[]'); });
  await expect(buildDataExport(owner)).rejects.toThrow('Local export data changed'); expect(localStorage.setItem).not.toHaveBeenCalled();
});
it('refuses more than 10000 rows without silently truncating', async () => {
  vi.mocked(fetch).mockImplementation(async input => {
    const url = new URL(String(input)); if (!url.pathname.endsWith('api_keys')) return new Response('[]');
    const last = Number((url.searchParams.get('id') ?? '0').split('-').at(-1));
    return new Response(JSON.stringify(Array.from({ length: 100 }, (_, i) => row(url, last + i + 1))));
  });
  await expect(buildDataExport(owner)).rejects.toThrow('capacity');
});
