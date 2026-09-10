import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock=vi.hoisted(()=>({user:vi.fn(),session:vi.fn(),fetch:vi.fn(),from:vi.fn(),pages:[] as unknown[],queries:[] as Record<string,ReturnType<typeof vi.fn>>[]}));
vi.mock('../supabase',()=>({isSupabaseConfigured:true,supabase:{from:mock.from,auth:{getUser:mock.user,getSession:mock.session}}}));
import {triggerTestWebhook,validateWebhookUrl,createWebhook,listMyWebhooks,deleteWebhook,toggleWebhookActive} from '../api-webhooks';
beforeEach(()=>{vi.resetAllMocks();vi.stubGlobal('fetch',mock.fetch);mock.user.mockResolvedValue({data:{user:{id:'u'}}});mock.session.mockResolvedValue({data:{session:{user:{id:'u'},access_token:'test-token'}}});});
afterEach(()=>vi.unstubAllGlobals());
it.each([{ok:false,error:'timeout'}, {ok:false,status:500,durationMs:20}, {ok:true,status:500}, {ok:true}, null])('never reports an unsuccessful delivery as success %j',async body=>{mock.fetch.mockResolvedValue(new Response(JSON.stringify(body),{status:200}));expect((await triggerTestWebhook('w','u')).ok).toBe(false);});
it('accepts only an explicitly successful 2xx delivery',async()=>{mock.fetch.mockResolvedValue(new Response(JSON.stringify({ok:true,status:204,durationMs:12}),{status:200}));expect(await triggerTestWebhook('w','u')).toEqual({ok:true,status:204,durationMs:12});expect(mock.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');});
it('does not send using a different account session',async()=>{mock.session.mockResolvedValue({data:{session:{user:{id:'v'},access_token:'other'}}});await expect(triggerTestWebhook('w','u')).rejects.toThrow('account changed');expect(mock.fetch).not.toHaveBeenCalled();});
it('discards the result after an account change',async()=>{mock.fetch.mockResolvedValue(new Response(JSON.stringify({ok:true,status:200}),{status:200}));mock.user.mockResolvedValueOnce({data:{user:{id:'u'}}}).mockResolvedValue({data:{user:{id:'v'}}});await expect(triggerTestWebhook('w','u')).rejects.toThrow('account changed');});
it('preserves an HTTP endpoint failure even if the body says ok',async()=>{mock.fetch.mockResolvedValue(new Response(JSON.stringify({ok:true,status:200}),{status:503}));expect((await triggerTestWebhook('w','u')).ok).toBe(false);});

it('accepts the same HTTPS transport restrictions as the sender',()=>{
 expect(validateWebhookUrl('https://example.com/hook')).toBe('https://example.com/hook');
 for(const url of ['http://example.com/hook','https://user:pass@example.com','https://example.com:8080/hook','bad'])expect(()=>validateWebhookUrl(url)).toThrow();
});

function database(pages: unknown[]) {
 mock.pages=pages;mock.queries=[];mock.from.mockImplementation(()=>{
  const result=mock.pages.shift(),q:Record<string,ReturnType<typeof vi.fn>>={};
  for(const method of ['select','eq','order','limit','gt','insert','update','delete'])q[method]=vi.fn(()=>q);
  q.then=vi.fn(resolve=>Promise.resolve(result).then(resolve));q.single=vi.fn(async()=>result);
  mock.queries.push(q);return q;
 });
}
it('reads all owned webhook pages without selecting signing secrets',async()=>{
 database([{data:[{id:'a',user_id:'u',created_at:'2026-09-01'}]},{data:[{id:'b',user_id:'u',created_at:'2026-09-02'}]},{data:[]}]);
 expect((await listMyWebhooks('u')).map(row=>row.id)).toEqual(['b','a']);
 for(const q of mock.queries){expect(q.eq).toHaveBeenCalledWith('user_id','u');expect(q.select.mock.calls[0][0]).not.toContain('secret')}
 expect(mock.queries[1].gt).toHaveBeenCalledWith('id','a');
});
it('rejects creation for another account and unsupported automatic events',async()=>{
 database([]);await expect(createWebhook({event_type:'health.check',url:'https://example.com'},'v')).rejects.toThrow('account changed');
 await expect(createWebhook({event_type:'estimation.new',url:'https://example.com'},'u')).rejects.toThrow('Only manual');expect(mock.from).not.toHaveBeenCalled();
});
it('requires confirmed owned mutation results',async()=>{
 database([{data:[]}]);await expect(deleteWebhook('w','u')).rejects.toThrow('could not be confirmed');expect(mock.queries[0].eq).toHaveBeenCalledWith('user_id','u');
 database([{data:[{id:'w',active:true}]}]);await expect(toggleWebhookActive('w',false,'u')).rejects.toThrow('could not be confirmed');
 database([{data:[{id:'w',active:false}]}]);await expect(toggleWebhookActive('w',false,'u')).resolves.toBeUndefined();
});
it('does not return a partial webhook list after a query failure',async()=>{
 database([{data:[{id:'a',user_id:'u',created_at:'2026-09-01'}]},{error:{message:'offline'}}]);await expect(listMyWebhooks('u')).rejects.toThrow('read failed');
});
