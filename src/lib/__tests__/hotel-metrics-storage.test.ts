import { beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), queries: [] as { table: string; q: Record<string, ReturnType<typeof vi.fn>> }[], pages: [] as unknown[], role: 'member' }));
vi.mock('../supabase', () => ({ isSupabaseConfigured: true, supabase: { auth: { getUser: mock.auth }, from: mock.from } }));
import { listMetrics, upsertMetrics, deleteMetric } from '../hotel-forecast';
const row = { hotel_id: 'h', metric_date: '2024-01-01', occupancy: .8, adr: 125 };
beforeEach(() => {
 vi.resetAllMocks(); mock.queries = []; mock.pages = []; mock.role = 'member';
 mock.auth.mockResolvedValue({ data: { user: { id: 'u' } } });
 mock.from.mockImplementation((table: string) => {
  const result = table === 'hotels' ? { data: { org_id: 'o' } } : table === 'org_members' ? { data: { role: mock.role } } : mock.pages.shift();
  const q: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ['select','eq','order','limit','gte','lte','gt','delete','upsert']) q[method] = vi.fn(() => q);
  q.then = vi.fn(resolve => Promise.resolve(result).then(resolve)); q.maybeSingle = vi.fn(async () => result);
  mock.queries.push({ table, q }); return q;
 });
});
it('reads short server pages completely and binds the hotel and captured account', async () => {
 mock.pages = [{ data: [row] }, { data: [{ ...row, metric_date: '2024-01-02' }] }, { data: [] }];
 expect(await listMetrics('h', undefined, undefined, 'u')).toHaveLength(2);
 const pages = mock.queries.filter(x => x.table === 'hotel_daily_metrics');
 expect(pages[1].q.gt).toHaveBeenCalledWith('metric_date','2024-01-01');
 for (const page of pages) expect(page.q.eq).toHaveBeenCalledWith('hotel_id','h');
});
it('rejects partial reads and a nonadvancing cursor', async () => {
 mock.pages = [{ data: [row] }, { error: { message: 'offline' } }];
 await expect(listMetrics('h', undefined, undefined, 'u')).rejects.toThrow('read failed');
 mock.pages = [{ data: [row] }, { data: [row] }];
 await expect(listMetrics('h', undefined, undefined, 'u')).rejects.toThrow('Invalid hotel metrics page');
});
it('does not write after an account change or with a viewer role', async () => {
 await expect(upsertMetrics('h', [row], 'v')).rejects.toThrow('account changed');
 expect(mock.from).not.toHaveBeenCalled();
 mock.role = 'viewer';
 await expect(upsertMetrics('h', [row], 'u')).rejects.toThrow('access denied');
 expect(mock.queries.some(x => x.table === 'hotel_daily_metrics')).toBe(false);
});
it('rejects incomplete observations before reading or writing', async () => {
 await expect(upsertMetrics('h', [{ metric_date: row.metric_date, adr: 125 }], 'u')).rejects.toThrow();
 expect(mock.auth).not.toHaveBeenCalled();
});
it('requires exact confirmation and preserves original creator on replacement', async () => {
 mock.pages = [{ data: [{ metric_date: row.metric_date }] }];
 expect(await upsertMetrics('h', [row], 'u')).toBe(1);
 const q = mock.queries.find(x => x.table === 'hotel_daily_metrics')!.q;
 const saved = q.upsert.mock.calls[0][0][0];
 expect(saved.revpar).toBe(100); expect(saved).not.toHaveProperty('created_by');
 mock.pages = [{ data: [] }];
 await expect(upsertMetrics('h', [row], 'u')).rejects.toThrow('could not be confirmed');
});
it('scopes deletion to the hotel and requires one returned row', async () => {
 mock.pages = [{ data: [] }];
 await expect(deleteMetric('m','h','u')).rejects.toThrow('could not be confirmed');
 const q = mock.queries.find(x => x.table === 'hotel_daily_metrics')!.q;
 expect(q.eq).toHaveBeenCalledWith('id','m'); expect(q.eq).toHaveBeenCalledWith('hotel_id','h');
 mock.pages = [{ data: [{ id: 'm' }] }];
 await expect(deleteMetric('m','h','u')).resolves.toBeUndefined();
});
it('discards reads returned after an identity change', async () => {
 mock.pages = [{ data: [row] }];
 mock.auth.mockResolvedValueOnce({ data: { user: { id: 'u' } } }).mockResolvedValueOnce({ data: { user: { id: 'u' } } }).mockResolvedValueOnce({ data: { user: { id: 'u' } } }).mockResolvedValue({ data: { user: { id: 'v' } } });
 await expect(listMetrics('h', undefined, undefined, 'u')).rejects.toThrow('account changed');
});
