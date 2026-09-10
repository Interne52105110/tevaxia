import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const state=vi.hoisted(()=>({exchange:vi.fn(),adapter:null as null|{getAll:()=>unknown[];setAll:(items:{name:string;value:string;options:object}[])=>void}}));
vi.mock('next/headers',()=>({cookies:async()=>({getAll:()=>[{name:'verifier',value:'synthetic-verifier'}]})}));
vi.mock('@supabase/ssr',()=>({createServerClient:(_url:string,_key:string,config:{cookies:NonNullable<typeof state.adapter>})=>{state.adapter=config.cookies;return{auth:{exchangeCodeForSession:state.exchange}}}}));
import { GET } from '@/app/auth/callback/route';
const request=(next:string,code='synthetic-code')=>new Request('https://tevaxia.lu/auth/callback?'+new URLSearchParams({next,...(code?{code}:{})}));
beforeEach(()=>{vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL','https://synthetic.supabase.co');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','synthetic-key');state.adapter=null;state.exchange.mockReset();state.exchange.mockResolvedValue({data:{session:{access_token:'synthetic-token'},user:{id:'synthetic-user'}},error:null});});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks()});
it('never redirects a successful OAuth exchange to an external destination',async()=>{
 const response=await GET(request('//outside.example'));
 expect(response.headers.get('location')).toBe('https://tevaxia.lu/mes-evaluations');
 expect(response.headers.get('cache-control')).toContain('no-store');expect(response.headers.get('referrer-policy')).toBe('no-referrer');
});
it('preserves language and never exchanges a missing code',async()=>{
 const response=await GET(request('/pt/energy',''));expect(response.headers.get('location')).toBe('https://tevaxia.lu/pt/connexion?error=no_code');expect(state.exchange).not.toHaveBeenCalled();
});
it('does not expose a provider error message or emit staged auth cookies on failure',async()=>{
 state.exchange.mockImplementation(async()=>{state.adapter!.setAll([{name:'auth',value:'private-session',options:{}}]);return{data:{session:null,user:null},error:{message:'PRIVATE_PROVIDER_ERROR'}}});
 const response=await GET(request('/de/energy'));
 expect(response.headers.get('location')).toBe('https://tevaxia.lu/de/connexion?error=auth_failed');expect(response.headers.has('set-cookie')).toBe(false);
});
it('commits staged session cookies only with a confirmed exchange and hardened options',async()=>{
 state.exchange.mockImplementation(async()=>{expect(state.adapter!.getAll()).toHaveLength(1);state.adapter!.setAll([{name:'auth',value:'synthetic-session',options:{maxAge:600}}]);expect(state.adapter!.getAll()).toHaveLength(2);return{data:{session:{},user:{}},error:null}});
 const response=await GET(request('/en/energy'));expect(response.headers.get('location')).toBe('https://tevaxia.lu/en/energy');const cookie=response.cookies.get('auth');expect(cookie?.value).toBe('synthetic-session');expect(cookie?.secure).toBe(true);expect(cookie?.sameSite).toBe('lax');expect(cookie?.domain).toBe('.tevaxia.lu');
});
it('handles network failures and incomplete successes without a broken callback',async()=>{
 state.exchange.mockRejectedValue(new Error('PRIVATE_NETWORK_ERROR'));expect((await GET(request('/profil'))).headers.get('location')).toBe('https://tevaxia.lu/connexion?error=auth_failed');
 state.exchange.mockResolvedValue({data:{session:null,user:null},error:null});expect((await GET(request('/profil'))).headers.get('location')).toContain('error=auth_failed');
});
it('does not claim a successful login if response cookies cannot be written',async()=>{
 const redirect=NextResponse.redirect.bind(NextResponse);vi.spyOn(NextResponse,'redirect').mockImplementation((...args)=>{const response=redirect(...args);vi.spyOn(response.cookies,'set').mockImplementation(()=>{throw new Error('cookie storage failed')});return response});
 state.exchange.mockImplementation(async()=>{state.adapter!.setAll([{name:'auth',value:'synthetic',options:{}}]);return{data:{session:{},user:{}},error:null}});
 const response=await GET(request('/lb/energy'));expect(response.headers.get('location')).toBe('https://tevaxia.lu/lb/connexion?error=cookie_failed');expect(response.headers.has('set-cookie')).toBe(false);
});
