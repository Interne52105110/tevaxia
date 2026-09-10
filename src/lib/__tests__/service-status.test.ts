import { afterEach, expect, it, vi } from 'vitest';
import { aggregateStatus, probeService } from '../service-status';
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks()});
it('never calls incomplete or empty checks fully operational',()=>{
 expect(aggregateStatus([])).toBe('unknown');expect(aggregateStatus([{status:'ok'},{status:'unknown'}])).toBe('unknown');expect(aggregateStatus([{status:'ok'}])).toBe('ok');expect(aggregateStatus([{status:'down'},{status:'unknown'}])).toBe('down');expect(aggregateStatus([{status:'degraded'},{status:'ok'}])).toBe('degraded');
});
it.each([401,403])('treats HTTP %s as an unverified check, not a service outage',async status=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status})));expect((await probeService('Auth','Settings','https://example.com')).status).toBe('unknown');});
it('passes authentication headers without exposing them in the result and clears its timer',async()=>{
 const fetchMock=vi.fn().mockResolvedValue(new Response(null,{status:200}));vi.stubGlobal('fetch',fetchMock);const clear=vi.spyOn(globalThis,'clearTimeout');
 const result=await probeService('Auth','Settings','https://example.com',5000,{apikey:'public-test-key'});expect(fetchMock.mock.calls[0][1].headers).toEqual({apikey:'public-test-key'});expect(JSON.stringify(result)).not.toContain('public-test-key');expect(clear).toHaveBeenCalled();
});
it('clears the timeout when fetch rejects',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));const clear=vi.spyOn(globalThis,'clearTimeout');expect((await probeService('Site','HTTP','https://example.com')).status).toBe('down');expect(clear).toHaveBeenCalled();});
it('reports HTTP failures and slow responses as degraded',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status:500})));expect((await probeService('Site','HTTP','https://example.com')).status).toBe('degraded');
 vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status:200})));vi.spyOn(Date,'now').mockReturnValueOnce(0).mockReturnValueOnce(2000);expect((await probeService('Site','HTTP','https://example.com')).status).toBe('degraded');
});
