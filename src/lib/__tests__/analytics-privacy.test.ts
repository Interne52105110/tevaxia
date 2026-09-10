import { expect, it } from 'vitest';
import { publicAnalyticsPath, sanitizeAudienceEvent, PUBLIC_AUDIENCE_CONFIG } from '../analytics-privacy';
const event={uuid:'qa-id',event:'$pageview',timestamp:new Date(),properties:{token:'qa-key',distinct_id:'random-page-id',$current_url:'https://tevaxia.lu/profil?email=private@example.com',email:'private@example.com',$referrer:'https://tevaxia.lu/locataire/tnt_SECRET',$set:{name:'secret'},$initial_person_info:{url:'secret'},$elements:[{text:'secret'}]},$set:{email:'secret'},$set_once:{name:'secret'}};
it.each(['/profil','/en/profil','/locataire/tnt_SECRET','/syndic/coproprietes/123','/propcalc?token=secret','/propcalc%2fsecret','//propcalc','/fr/profil','/en/propcalc/unknown'])('excludes unknown, private or encoded paths %s',path=>expect(publicAnalyticsPath(path)).toBeNull());
it.each(['/','/en','/de/propcalc','/pt/propcalc/developers','/lb/propcalc/countries/uk'])('allows only exact public routes %s',path=>expect(publicAnalyticsPath(path)).toBe(path));
it('rebuilds the event without arbitrary SDK enrichment, titles, referrers or person traits',()=>{
 const result=sanitizeAudienceEvent(event,'/en/propcalc',true)!;
 expect(result.properties).toEqual({token:'qa-key',distinct_id:'random-page-id',$process_person_profile:false,$current_url:'https://tevaxia.lu/en/propcalc',$pathname:'/en/propcalc',$host:'tevaxia.lu'});
 expect(JSON.stringify(result)).not.toMatch(/secret|private|email|\$set|\$referrer|\$elements/i);
});
it('drops all events without consent, on private pages, and all non-pageview events',()=>{
 expect(sanitizeAudienceEvent(event,'/',false)).toBeNull();expect(sanitizeAudienceEvent(event,'/profil',true)).toBeNull();
 for(const name of ['$identify','$autocapture','letter_exported','client_error','$exception'])expect(sanitizeAudienceEvent({...event,event:name},'/',true)).toBeNull();
});
it('disables automatic capture and persistent identities independently of remote defaults',()=>{
 expect(PUBLIC_AUDIENCE_CONFIG.autocapture).toBe(false);expect(PUBLIC_AUDIENCE_CONFIG.capture_pageview).toBe(false);
 expect(PUBLIC_AUDIENCE_CONFIG.disable_persistence).toBe(true);expect(PUBLIC_AUDIENCE_CONFIG.person_profiles).toBe('never');
 expect(PUBLIC_AUDIENCE_CONFIG.advanced_disable_decide).toBe(true);expect(PUBLIC_AUDIENCE_CONFIG.disable_external_dependency_loading).toBe(true);
});
