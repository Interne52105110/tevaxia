/** Environmental declarations and a separately documented valuation sensitivity.
 * No automatic ESG score, market premium, discount or compliance certificate.
 */
export const ESG_KEYS=['esgZoneInondable','esgRisqueSecheresse','esgRisqueGlissement','esgProximitePollue','esgIsolationRecente','esgPanneauxSolaires','esgPompeAChaleur'] as const;
export type EsgEvidence='unknown'|'yes'|'no';
export type EsgDeclarations=Record<typeof ESG_KEYS[number],EsgEvidence>;
export const EMPTY_ESG: EsgDeclarations={esgZoneInondable:'unknown',esgRisqueSecheresse:'unknown',esgRisqueGlissement:'unknown',esgProximitePollue:'unknown',esgIsolationRecente:'unknown',esgPanneauxSolaires:'unknown',esgPompeAChaleur:'unknown'};
export function summarizeEsgDeclarations(i:EsgDeclarations){
 if(!ESG_KEYS.every(k=>['unknown','yes','no'].includes(i[k])))throw new RangeError('Invalid declarations');
 const rows=ESG_KEYS.map(key=>({key,status:i[key]}));
 return{rows,documented:rows.filter(r=>r.status!=='unknown').length,unknown:rows.filter(r=>r.status==='unknown').length};
}
export function calculateEsgSensitivity(value:number,adjustmentPct:number,reference:string){
 if(!Number.isFinite(value)||value<=0||value>1e12||!Number.isFinite(adjustmentPct)||adjustmentPct< -100||adjustmentPct>100||(adjustmentPct!==0&&!reference.trim()))throw new RangeError('Invalid valuation assumptions');
 const change=value*adjustmentPct/100;
 return{change,adjustedValue:value+change};
}
