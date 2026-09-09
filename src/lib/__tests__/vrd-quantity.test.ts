import {describe,it,expect} from 'vitest';
import {rectangularVrdQuantity} from '../vrd-quantity';
import {calculateConstructionBudget} from '../construction-budget';
describe('explicit VRD quantities',()=>{
 it('converts centimetres to metres exactly once',()=>{expect(rectangularVrdQuantity(100,6,null)).toEqual({quantity:600,unit:'m2'});expect(rectangularVrdQuantity(100,6,20)).toEqual({quantity:120,unit:'m3'});expect(rectangularVrdQuantity(400,.6,80)).toEqual({quantity:192,unit:'m3'})});
 it('multiplies the resulting quantity by a declared TTC price without an automatic multiplier',()=>{const q=rectangularVrdQuantity(100,6,20);const r=calculateConstructionBudget({surfaceM2:null,contingencyPct:0,contingencyReason:'',lines:[{id:'a',label:'Foundation 100 m × 6 m × 20 cm',kind:'works',...q,unitPriceTtc:22,reference:'Quote F'}]});expect(r.totalTtc).toBe(2640)});
 it('rejects empty-equivalent, invalid, negligible and excessive geometry',()=>{for(const args of [[0,6,null],[100,NaN,20],[100,6,0],[100,6,-1],[Infinity,6,20],[1e6,1e6,null],[.000001,.000001,1]] as const)expect(()=>rectangularVrdQuantity(args[0],args[1],args[2])).toThrow()});
});
