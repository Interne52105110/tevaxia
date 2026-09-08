import {describe,it,expect} from 'vitest';
import {computeRenovationHotel} from '../hotellerie/renovation';
import type {RenovationHotelInputs} from '../hotellerie/types';
const base:RenovationHotelInputs={surfaceChauffeeM2:2500,nbChambres:10,consoActuelleKwhM2:250,consoCibleKwhM2:150,prixKwhMoyen:.2,travauxIsolation:true,travauxCVC:true,travauxECS:false,travauxLED:false,travauxFenetres:false,adr:100,occupancy:.5,gainRevparPctViaLabel:0};
describe('Hotel renovation: grants and net contribution',()=>{
 it('only deducts entered aid and reconciles an entered budget',()=>{const r=computeRenovationHotel({...base,coutTravauxSaisi:500000,aidesConfirmees:50000});expect(r.coutNetTotal).toBe(450000);expect(r.lines.reduce((s,l)=>s+l.aide,0)).toBeCloseTo(50000);expect(r.lines.reduce((s,l)=>s+l.coutNet,0)).toBeCloseTo(450000);expect(computeRenovationHotel(base).aideKlimabonusTotal).toBe(0);});
 it('converts extra turnover into contribution after variable costs',()=>{expect(computeRenovationHotel({...base,gainRevparPctViaLabel:10,margeRecettesSupplementaires:.4}).gainRevparAnnuel).toBe(7300);expect(computeRenovationHotel({...base,gainRevparPctViaLabel:10}).gainRevparAnnuel).toBe(0);});
 it('deducts maintenance from annual cash flow and NPV',()=>{const a=computeRenovationHotel(base),b=computeRenovationHotel({...base,entretienAnnuelSupplementaire:3000});expect(a.vanDixAns-b.vanDixAns).toBeCloseTo(3000*(1-Math.pow(1.04,-10))/.04);expect(b.paybackSansLabel).toBeGreaterThan(a.paybackSansLabel);});
 it('does not manufacture savings or label gains for an empty project',()=>{const r=computeRenovationHotel({...base,travauxIsolation:false,travauxCVC:false,gainRevparPctViaLabel:10,margeRecettesSupplementaires:1});expect(r.economiesAnnuelles).toBe(0);expect(r.gainRevparAnnuel).toBe(0);expect(r.coutNetTotal).toBe(0);});
 it('retains a forecast increase in consumption as a negative saving',()=>{const r=computeRenovationHotel({...base,consoCibleKwhM2:300});expect(r.economiesAnnuelles).toBe(-25000);expect(r.paybackSansLabel).toBe(Infinity);expect(r.vanDixAns).toBeLessThan(-r.coutNetTotal);});
 it('allows zero occupancy without fabricating commercial gains',()=>{expect(computeRenovationHotel({...base,occupancy:0,gainRevparPctViaLabel:10,margeRecettesSupplementaires:1}).gainRevparAnnuel).toBe(0);});
 it.each([{aidesConfirmees:99999999},{coutTravauxSaisi:-1},{margeRecettesSupplementaires:1.1},{nbChambres:1.5},{prixKwhMoyen:NaN},{consoCibleKwhM2:-1}])('rejects invalid data %j',v=>expect(()=>computeRenovationHotel({...base,...v})).toThrow());
});
