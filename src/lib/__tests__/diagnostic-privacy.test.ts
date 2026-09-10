import { expect, it } from 'vitest';
import type { ErrorEvent, EventHint } from '@sentry/nextjs';
import { diagnosticCodeFile, sanitizeDiagnosticEvent, DIAGNOSTIC_PRIVACY_OPTIONS } from '../diagnostic-privacy';
it('keeps a generated code location while removing the host, query and fragment',()=>{
 expect(diagnosticCodeFile('https://private.example/_next/static/chunks/app-abcd1234.js?token=SECRET#SECRET')).toBe('https://tevaxia.lu/_next/static/chunks/app-abcd1234.js');
 expect(diagnosticCodeFile('/app/.next/server/chunks/1234abcd.js')).toBe('app:///.next/server/chunks/1234abcd.js');
});
it.each(['/locataire/tnt_SECRET','https://tevaxia.lu/profil?email=SECRET','file:///Users/SECRET/document.js','data:text/plain,SECRET','webpack:///SECRET.tsx'])('drops private/noncompiled source %s',file=>expect(diagnosticCodeFile(file)).toBeUndefined());
it('removes private data from every event level and from attachment hints',()=>{
 const event:ErrorEvent={type:undefined,event_id:'a'.repeat(32),timestamp:1234,release:'abcd1234',environment:'production',message:'SECRET',user:{id:'SECRET',email:'SECRET'},request:{url:'https://tevaxia.lu/locataire/tnt_SECRET',headers:{authorization:'Bearer SECRET'},data:{name:'SECRET'}},extra:{tenant:'SECRET'},tags:{copro:'SECRET'},contexts:{trace:{trace_id:'SECRET',span_id:'SECRET'},private:{data:'SECRET'}},breadcrumbs:[{message:'SECRET'}],transaction:'SECRET',exception:{values:[{type:'TypeError',value:'SECRET',stacktrace:{frames:[{filename:'https://tevaxia.lu/_next/static/chunks/app-abcd1234.js?token=SECRET',lineno:15,colno:2,function:'SECRET',vars:{a:'SECRET'},context_line:'SECRET'}]},mechanism:{type:'SECRET',data:{tenant:'SECRET'}}}]}};
 const hint:EventHint={attachments:[{filename:'SECRET.txt',data:'SECRET'}]};const result=sanitizeDiagnosticEvent(event,hint);
 expect(JSON.stringify(result)).not.toContain('SECRET');expect(hint.attachments).toEqual([]);
 expect(result.exception?.values?.[0].stacktrace?.frames?.[0]).toMatchObject({lineno:15,colno:2,filename:'https://tevaxia.lu/_next/static/chunks/app-abcd1234.js'});
 expect(result.exception?.values?.[0].type).toBe('TypeError');expect(result.release).toBe('abcd1234');expect(result.request).toBeUndefined();expect(result.contexts).toBeUndefined();
});
it('does not accept custom exception names, arbitrary release metadata or invalid line numbers',()=>{
 const result=sanitizeDiagnosticEvent({type:undefined,event_id:'SECRET',release:'SECRET',environment:'SECRET',exception:{values:[{type:'SECRET',stacktrace:{frames:[{lineno:NaN,colno:-1}]}}]}},{});
 expect(JSON.stringify(result)).not.toContain('SECRET');expect(result.exception?.values?.[0].type).toBe('Error');
});
it('disables transaction/log/replay capture and automatic request data',()=>{
 expect(DIAGNOSTIC_PRIVACY_OPTIONS.tracesSampleRate).toBe(0);expect(DIAGNOSTIC_PRIVACY_OPTIONS.beforeSendTransaction()).toBeNull();expect(DIAGNOSTIC_PRIVACY_OPTIONS.beforeSendLog()).toBeNull();
 expect(DIAGNOSTIC_PRIVACY_OPTIONS.dataCollection.httpBodies).toEqual([]);expect(DIAGNOSTIC_PRIVACY_OPTIONS.maxBreadcrumbs).toBe(0);
});
