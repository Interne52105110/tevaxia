import fs from 'node:fs';
import {createRequire} from 'node:module';
import {describe,it,expect,vi} from 'vitest';
vi.mock('@/lib/api-auth',()=>({authenticateApiRequestAsync:vi.fn(async()=>({ok:true,keyRecord:{name:'isolated',tier:'test'}})),logApiCall:vi.fn(async()=>{}),corsPreflightResponse:()=>new Response(null,{status:204}),withCors:(r:Response)=>r,API_CORS_HEADERS:{}}));
import {POST as single} from '../route';
import {POST as batch} from '../batch/route';
const request=(data:unknown)=>new Request('http://localhost/api/v1/estimation',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
describe('consistent estimation API paths',()=>{
 it('returns identical estimates with the same defaults in single and batch requests',async()=>{const i={commune:'Luxembourg',surface:85};const a=await(await single(request(i))).json(),b=await(await batch(request({items:[i]}))).json();expect(a.success).toBe(true);expect(b.succeeded).toBe(1);expect(b.results[0].data).toEqual(a.data);expect(b.meta.method).toBe(a.meta.method)});
 it('rejects wrong JSON types, unknown fields and unsupported enum values instead of silently defaulting',async()=>{const i={commune:'Luxembourg',surface:85};for(const patch of [{parking:'false'},{estNeuf:'false'},{chambres:2},{nbChambres:2.5},{etage:'entre'},{classeEnergie:'NC'},{typeBien:'maison'},{surface:1e20},{etat:null}])expect((await single(request({...i,...patch}))).status).toBe(400)});
 it('handles null roots, partial batches and missing municipal data explicitly',async()=>{expect((await single(request(null))).status).toBe(400);expect((await batch(request(null))).status).toBe(400);const b=await(await batch(request({items:[null,{commune:'Luxembourg',surface:85},{commune:'Esch',surface:85}]}))).json();expect(b.succeeded).toBe(1);expect(b.failed).toBe(2);expect(b.results.map((r:{index:number})=>r.index)).toEqual([0,1,2]);expect((await single(request({commune:'Esch',surface:85}))).status).toBe(404)});
});


it('accepts the published OpenAPI example and every documented enum, with matching defaults',async()=>{
 const yaml=createRequire(import.meta.url)('js-yaml');const spec=yaml.load(fs.readFileSync('public/openapi.yaml','utf8'));
 const input=spec.paths['/api/v1/estimation'].post.requestBody.content['application/json'].examples.luxembourg.value;
 expect((await single(request(input))).status).toBe(200);
 const props=spec.components.schemas.EstimationInput.properties;
 for(const key of ['etage','etat','exterieur','classeEnergie'])for(const value of props[key].enum)expect((await single(request({...input,[key]:value}))).status).toBe(200);
 const minimal={commune:'Luxembourg',surface:85},explicit={...minimal,...Object.fromEntries(Object.entries(props).filter(([,v])=>Object.hasOwn(v as object,'default')).map(([k,v])=>[k,(v as {default:unknown}).default]))};
 expect((await(await single(request(minimal))).json()).data).toEqual((await(await single(request(explicit))).json()).data);
});
