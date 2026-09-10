import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ create: vi.fn(), eq: vi.fn(), result: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mock.create }));
import { authenticateApiRequestAsync } from '../api-auth';
let sequence = 0;
const request = (key: string) => new Request('https://tevaxia.lu/api/v1/estimation', { headers: { 'X-API-Key': key } });
const record = { id: 'db-key', name: 'test', tier: 'pro', active: true, user_id: 'u' };
beforeEach(() => {
 vi.clearAllMocks();
 vi.stubEnv('TEVAXIA_API_KEYS',''); vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://example.supabase.co'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','test-only');
 const q = { select: () => q, eq: (...args: unknown[]) => { mock.eq(...args); return q; }, maybeSingle: mock.result };
 mock.create.mockReturnValue({ from: () => q }); mock.result.mockResolvedValue({ data: record });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
it('looks up the SHA-256 digest, checks active status and retains the database owner', async () => {
 const key = 'unique-hashed-key-'+sequence++;
 const result = await authenticateApiRequestAsync(request(key));
 expect(result.ok).toBe(true);
 const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)))).map(b=>b.toString(16).padStart(2,'0')).join('');
 expect(mock.eq).toHaveBeenCalledWith('key_hash',hash); expect(mock.eq).not.toHaveBeenCalledWith('key_hash',key);
 expect(mock.eq).toHaveBeenCalledWith('active',true);
 if(result.ok) expect(result.keyRecord.userId).toBe('u');
});
it.each([{ tier: 'unknown' }, { tier: '__proto__' }, { active: false }, { user_id: null }])('fails closed on malformed key metadata %j', async change => {
 mock.result.mockResolvedValue({ data: { ...record, ...change } });
 const result = await authenticateApiRequestAsync(request('malformed-'+sequence++));
 expect(result.ok).toBe(false); if(!result.ok) expect(result.response.status).toBe(401);
});
it.each(['returned','thrown'])('reports %s database failures as unavailable without exposing details', async kind => {
 if(kind==='returned') mock.result.mockResolvedValue({ error: { message: 'private-secret-host' } });
 else mock.result.mockRejectedValue(new Error('private-secret-host'));
 const result=await authenticateApiRequestAsync(request('failure-'+sequence++));
 expect(result.ok).toBe(false); if(!result.ok){expect(result.response.status).toBe(503); expect(result.response.headers.get('cache-control')).toBe('no-store'); expect(await result.response.text()).not.toContain('private-secret-host');}
});
it('opens a new quota window exactly at the advertised boundary', async () => {
 vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-10T12:00:00Z'));
 const key='boundary-'+sequence++; vi.stubEnv('TEVAXIA_API_KEYS','test:'+key+':free');
 for(let i=0;i<10;i++) expect((await authenticateApiRequestAsync(request(key))).ok).toBe(true);
 const limited=await authenticateApiRequestAsync(request(key)); expect(limited.ok).toBe(false);
 if(!limited.ok){expect(limited.response.status).toBe(429);expect(limited.response.headers.get('Retry-After')).toBe('60');}
 vi.advanceTimersByTime(60000);expect((await authenticateApiRequestAsync(request(key))).ok).toBe(true);
 expect(mock.create).not.toHaveBeenCalled();
});
