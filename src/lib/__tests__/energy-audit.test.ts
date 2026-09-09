import {describe,it,expect} from 'vitest';
import {summarizeAuditAnswers,AUDIT_QUESTIONS} from '../energy-audit';
describe('declarative energy preparation',()=>{
 it('distinguishes missing answers from explicit unknowns',()=>{
  const empty=summarizeAuditAnswers({});expect(empty.answered).toBe(0);expect(empty.complete).toBe(false);expect(empty.rows.every(r=>r.valueKey==='unanswered')).toBe(true);
  const partial=summarizeAuditAnswers({construction_year:'unknown',humidite:'hum_yes'});expect(partial.answered).toBe(2);expect(partial.documented).toBe(1);expect(partial.unknown).toBe(1);expect(partial.complete).toBe(false);
 });
 it('allows an entirely unknown dossier without inferring performance',()=>{
  const r=summarizeAuditAnswers(Object.fromEntries(AUDIT_QUESTIONS.map(q=>[q.id,'unknown'])));expect(r.complete).toBe(true);expect(r.documented).toBe(0);expect(r.unknown).toBe(20);expect(r).not.toHaveProperty('classeEstimee');expect(r).not.toHaveProperty('klimabonusTotal');
 });
 it('rejects forged question IDs and options',()=>{
  expect(()=>summarizeAuditAnswers({bad:'unknown'})).toThrow();expect(()=>summarizeAuditAnswers({humidite:'y_post2015'})).toThrow();
 });
 it('preserves the entered option without mutating answers',()=>{
  const answers={construction_year:'y_pre1960',budget:'b_gt100k'};const r=summarizeAuditAnswers(answers);expect(r.rows.find(r=>r.id==='budget')?.valueKey).toBe('b_gt100k');expect(answers).toEqual({construction_year:'y_pre1960',budget:'b_gt100k'});
 });
});
