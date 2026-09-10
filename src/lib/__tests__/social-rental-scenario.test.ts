import {describe,it,expect} from 'vitest';
import {socialRentalExemption,socialRentalScenario} from '../social-rental-scenario';
const base={year:2026,standardRent:1000,socialRent:1000,standardCosts:2000,socialCosts:2000,marginalRate:40,eligible:true};
describe('dated social rental scenario',()=>{
 it.each([[2017,50],[2022,50],[2023,75],[2024,90],[2026,90]])('uses the verified exemption for %s', (year,rate)=>expect(socialRentalExemption(year)).toBe(rate));
 it.each([2016,2027,2024.5,NaN])('refuses unverified year %s',year=>expect(()=>socialRentalExemption(year)).toThrow());
 it('applies 90 percent to net income, not gross rent',()=>{expect(socialRentalScenario(base)).toMatchObject({standardNet:10000,socialNet:10000,estimate:{standardTax:4000,socialTaxable:1000,socialTax:400,standardAfterTax:6000,socialAfterTax:9600,difference:3600}})});
 it('can show a lower after-tax result when the social rent is lower',()=>{expect(socialRentalScenario({...base,socialRent:500}).estimate?.difference).toBe(-2160)});
 it('does not apply relief without confirmed eligibility',()=>{expect(socialRentalScenario({...base,eligible:false}).estimate).toBeNull()});
 it('preserves negative net income without inventing its tax treatment',()=>{expect(socialRentalScenario({...base,socialCosts:13000})).toMatchObject({socialNet:-1000,estimate:null})});
 it('preserves zero and cents',()=>{expect(socialRentalScenario({...base,standardRent:0,socialRent:0,standardCosts:0,socialCosts:0}).estimate?.difference).toBe(0);expect(socialRentalScenario({...base,standardRent:1000.01}).standardNet).toBe(10000.12)});
 it.each([-1,NaN,Infinity,0.001])('rejects invalid monetary assumptions %s',value=>expect(()=>socialRentalScenario({...base,socialCosts:value})).toThrow());
 it('rejects rates outside the entered percentage range',()=>{expect(()=>socialRentalScenario({...base,marginalRate:101})).toThrow()});
});
