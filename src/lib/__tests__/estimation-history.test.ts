import {describe,it,expect} from 'vitest';
import {parseEstimationHistory,resolveSharedCommune} from '../estimation-history';
const row={id:'one',date:'2026-09-09T10:00:00.000Z',commune:'Luxembourg',surface:80,estimationCentrale:700000,prixM2Ajuste:8750,classeEnergie:'D'};
describe('estimation persisted data',()=>{
 it('retains valid legacy records without mutating their source',()=>{const raw=JSON.stringify([row]);expect(parseEstimationHistory(raw)).toEqual({entries:[row],invalid:false});expect(raw).toBe(JSON.stringify([row]));expect(parseEstimationHistory(null).invalid).toBe(false)});
 it('reports malformed roots, corrupt JSON and unsafe row values',()=>{for(const raw of ['null','{}','[null]','broken',JSON.stringify([{...row,adresse:42}]),JSON.stringify([{...row,date:'not-a-date'}]),JSON.stringify([{...row,estimationCentrale:0}])])expect(parseEstimationHistory(raw).invalid).toBe(true)});
 it('keeps valid records but flags partial corruption, duplicates and oversized history',()=>{expect(parseEstimationHistory(JSON.stringify([row,null,row]))).toEqual({entries:[row],invalid:true});const result=parseEstimationHistory(JSON.stringify(Array.from({length:51},(_,i)=>({...row,id:String(i)}))));expect(result.invalid).toBe(true);expect(result.entries).toHaveLength(50)});
 it('does not select the first partial or ambiguous commune',()=>{expect(resolveSharedCommune('Luxembourg')?.commune.commune).toBe('Luxembourg');expect(resolveSharedCommune('  Luxembourg ')?.commune.commune).toBe('Luxembourg');expect(resolveSharedCommune('Esch')).toBeNull();expect(resolveSharedCommune('not-a-place')).toBeNull();expect(resolveSharedCommune('Belair')?.commune.commune).toBe('Luxembourg')});
});
