import {describe,it,expect} from 'vitest';
import {rentalInsuranceBudget} from '../rental-insurance-budget';
const base={monthlyRent:1800,monthlyCharges:200,lotCount:1,annualPremium:600};
describe('user-supplied rental insurance quote budgets',()=>{
 it('compares an actual annual quote with the declared annual base',()=>{expect(rentalInsuranceBudget(base)).toEqual({annualBase:24000,annualPremium:600,monthlyEquivalent:50,premiumRate:2.5})});
 it('applies lot count to rental base, never multiplying the whole-portfolio quote',()=>{expect(rentalInsuranceBudget({...base,lotCount:2})).toEqual({annualBase:48000,annualPremium:600,monthlyEquivalent:50,premiumRate:1.25})});
 it('leaves an absent quote unknown rather than inventing a zero premium',()=>{expect(rentalInsuranceBudget({...base,annualPremium:null})).toMatchObject({annualPremium:null,monthlyEquivalent:null,premiumRate:null})});
 it('preserves a declared zero quote',()=>{expect(rentalInsuranceBudget({...base,annualPremium:0})).toMatchObject({annualPremium:0,monthlyEquivalent:0,premiumRate:0})});
 it('does not divide by zero rental base',()=>{expect(rentalInsuranceBudget({...base,monthlyRent:0,monthlyCharges:0})).toMatchObject({annualPremium:600,premiumRate:null})});
 it('does not round a monthly equivalent before determining annual cost',()=>{const r=rentalInsuranceBudget({...base,annualPremium:1200.01});expect(r.annualPremium).toBe(1200.01);expect(r.monthlyEquivalent!*12).toBeCloseTo(1200.01,8)});
 it.each([NaN,Infinity,-1,1.001])('rejects invalid monetary inputs %s',value=>{expect(()=>rentalInsuranceBudget({...base,annualPremium:value})).toThrow()});
 it.each([0,1.5,501,NaN])('rejects invalid lot counts %s',value=>{expect(()=>rentalInsuranceBudget({...base,lotCount:value})).toThrow()});
});
