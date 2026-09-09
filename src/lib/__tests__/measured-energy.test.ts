import {describe,it,expect} from "vitest";
import {measuredEnergyIntensity as ratio} from "../measured-energy";
describe("Measured energy ratio",()=>{
 it("only divides the entered delivered energy by the entered area",()=>expect(ratio(12000,100)).toBe(120));
 it("preserves zero and fractional measurements",()=>{expect(ratio(0,100)).toBe(0);expect(ratio(1234.5,75.5)).toBeCloseTo(16.3509933775);});
 it("rejects missing, negative or zero-area inputs",()=>{for(const [energy,area] of [[NaN,100],[100,NaN],[-1,100],[100,0],[100,-1],[Infinity,100]])expect(()=>ratio(energy,area)).toThrow();});
});
