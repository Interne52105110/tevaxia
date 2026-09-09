import {beforeEach,describe,it,expect,vi} from 'vitest';
const {auth,log}=vi.hoisted(()=>({auth:vi.fn(),log:vi.fn()}));
vi.mock('@/lib/api-auth',()=>({authenticateApiRequestAsync:auth,logApiCall:log,corsPreflightResponse:()=>new Response(null,{status:204}),withCors:(r:Response)=>r,API_CORS_HEADERS:{}}));
import {POST} from '../route';
const body={valeurMarche:1000000,decoteConjoncturelle:5,decoteCommercialisation:3,decoteSpecifique:2};
const request=(data:unknown)=>new Request('http://localhost/api/v1/mlv',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
beforeEach(()=>{vi.clearAllMocks();auth.mockResolvedValue({ok:true,keyRecord:{name:'isolated-test',tier:'test'}})});
describe('legacy MLV API',()=>{
 it('preserves authentication before calculation',async()=>{auth.mockResolvedValue({ok:false,response:new Response(null,{status:401})});expect((await POST(request(body))).status).toBe(401);expect(log).not.toHaveBeenCalled()});
 it('marks arithmetic results as non-regulatory and removes unsupported risk weights',async()=>{const r=await POST(request(body));expect(r.status).toBe(200);const json=await r.json();expect(json.data.mlv).toBe(900000);expect(json.data.ltvBands).toEqual([]);expect(json.data.regulatoryValue).toBe(false);expect(json.meta.regulatory_value).toBe(false);expect(json.meta.method).toBe('documented_haircut_sensitivity');expect(json.meta.bases_legales).toBeUndefined()});
 it('rejects null, arrays and out-of-range values with 400 rather than 500',async()=>{for(const b of [null,[],{...body,valeurMarche:1e13},{...body,decoteConjoncturelle:96}])expect((await POST(request(b))).status).toBe(400)});
});
