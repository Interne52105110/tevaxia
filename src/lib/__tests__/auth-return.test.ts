import { expect, it } from 'vitest';
import { safeAuthReturnPath, authErrorPath } from '../auth-return';
it.each(['https://outside.example','//outside.example','/\\outside.example','/%2f%2foutside.example','/%252f%252foutside.example','/%5coutside.example','/%255coutside.example','/\n/outside.example','javascript:alert(1)','/%','/api/redirect','/auth/callback','/de/auth/callback','/a/../api/redirect'])('rejects external, ambiguous or handler destinations %s',path=>expect(safeAuthReturnPath(path)).toBe('/mes-evaluations'));
it.each(['/mes-evaluations','/de/energy','/en/syndic/lettres-types','/profil','/lb/energy/portfolio'])('keeps internal page destinations %s',path=>expect(safeAuthReturnPath(path)).toBe(path));
it('strips return parameters and fragments instead of propagating secrets or redirect chains',()=>{
 expect(safeAuthReturnPath('/de/energy?token=SECRET#SECRET')).toBe('/de/energy');
 expect(authErrorPath('/de/energy','auth_failed')).toBe('/de/connexion?error=auth_failed');
 expect(safeAuthReturnPath(null)).toBe('/mes-evaluations');
});
