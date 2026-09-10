import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), create: vi.fn(), log: vi.fn(), upsert: vi.fn(), filters: vi.fn(), results: {} as Record<string, unknown> }));
vi.mock('@/lib/api-auth', () => ({ authenticateApiRequestAsync: mocks.auth, API_CORS_HEADERS: {}, corsPreflightResponse: () => new Response(null, { status: 204 }), logApiCall: mocks.log }));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.create }));
import { POST } from '@/app/api/v1/pms/webhook/route';
const date = '2026-01-01';
const body = { hotel_id: '11111111-1111-1111-1111-111111111111', metrics: [{ date, occupancy: .8, adr: 125 }] };
const key = { id: 'key-id', userId: 'owner-id', source: 'supabase', tier: 'pro' };
const request = (value: unknown = body) => new Request('https://tevaxia.lu/api/v1/pms/webhook', { method: 'POST', body: JSON.stringify(value) });
beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only';
  mocks.auth.mockResolvedValue({ ok: true, keyRecord: key });
  mocks.log.mockResolvedValue(undefined);
  mocks.results = { api_keys: { data: { org_id: 'org-id' } }, org_members: { data: { role: 'member' } }, hotels: { data: { id: body.hotel_id } }, hotel_daily_metrics: { data: [{ metric_date: date }] } };
  mocks.create.mockReturnValue({ from: (table: string) => {
    const query = { select: () => table === 'hotel_daily_metrics' ? Promise.resolve(mocks.results[table]) : query, eq: (...args: unknown[]) => { mocks.filters(table, ...args); return query; }, maybeSingle: () => Promise.resolve(mocks.results[table]), upsert: (...args: unknown[]) => { mocks.upsert(...args); return query; } };
    return query;
  } });
});
describe('PMS organization write boundary', () => {
  it.each([401, 429])('preserves authentication rejection %s', async status => {
    mocks.auth.mockResolvedValue({ ok: false, response: new Response('{}', { status }) });
    expect((await POST(request())).status).toBe(status);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each([{ source: 'env' }, { tier: 'free' }, { userId: undefined }])('rejects keys without organization write credentials %j', async change => {
    mocks.auth.mockResolvedValue({ ok: true, keyRecord: { ...key, ...change } });
    expect((await POST(request())).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('rejects an entire invalid batch before contacting the database', async () => {
    expect((await POST(request({ ...body, metrics: [...body.metrics, { date: 'bad' }] }))).status).toBe(422);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each([['api_keys', null, 403], ['org_members', null, 403], ['org_members', { role: 'viewer' }, 403], ['hotels', null, 404]])('rejects missing authorization %s %j', async (table, data, status) => {
    mocks.results[table as string] = { data };
    expect((await POST(request())).status).toBe(status);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it('binds the key, current member and hotel to one organization', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.filters).toHaveBeenCalledWith('api_keys', 'active', true);
    expect(mocks.filters).toHaveBeenCalledWith('api_keys', 'user_id', key.userId);
    expect(mocks.filters).toHaveBeenCalledWith('org_members', 'org_id', 'org-id');
    expect(mocks.filters).toHaveBeenCalledWith('org_members', 'user_id', key.userId);
    expect(mocks.filters).toHaveBeenCalledWith('hotels', 'org_id', 'org-id');
    expect(mocks.upsert).toHaveBeenCalledExactlyOnceWith([expect.objectContaining({ occupancy: .8, adr: 125, revpar: 100 })], { onConflict: 'hotel_id,metric_date' });
  });
  it.each([null, [], [{ metric_date: '2025-01-01' }]])('does not claim an unconfirmed import succeeded %j', async data => {
    mocks.results.hotel_daily_metrics = { data };
    expect((await POST(request())).status).toBe(500);
  });
  it('does not expose database errors or retry a confirmed write for a logging error', async () => {
    mocks.results.org_members = { error: { message: 'private-db-details' } };
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private-db-details');
    mocks.results.org_members = { data: { role: 'admin' } };
    mocks.log.mockRejectedValue(new Error('log unavailable'));
    expect((await POST(request())).status).toBe(200);
  });
});
