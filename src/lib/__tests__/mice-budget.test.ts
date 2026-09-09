import { describe, it, expect } from "vitest";
import { calculateMiceBudget, miceBudgetCsv, type MiceBudget } from "../hotellerie/mice-budget";
const input: MiceBudget = {start:"2024-02-01",end:"2024-02-29",reference:"Signed offers and direct cost budget",groups:2.5,roomNights:10,roomRate:100,fbUnits:20,fbRate:20,meetingDays:1,meetingRate:200,roomCost:100,fbCost:50,meetingCost:20,fixedCost:100,availableNights:25,availableMeetingDays:2.5};
describe("MICE documented budget",()=>{
 it("uses explicit volumes without rounding expected groups or sharing rooms",()=>{expect(calculateMiceBudget(input)).toEqual({days:29,occupiedNights:25,usedMeetingDays:2.5,rooms:2500,fb:1000,meetings:500,revenue:4000,directCosts:425,fixedCosts:100,contribution:3475,marginPct:86.875})});
 it("keeps fixed costs and a negative contribution with no groups, with no undefined margin",()=>{const r=calculateMiceBudget({...input,groups:0});expect(r.revenue).toBe(0);expect(r.contribution).toBe(-100);expect(r.marginPct).toBeNull()});
 it("rounds half cents once for each revenue line",()=>{expect(calculateMiceBudget({...input,groups:.5,roomNights:1,roomRate:.01}).rooms).toBe(.01)});
 it("rejects excess room and meeting capacity separately",()=>{expect(()=>calculateMiceBudget({...input,availableNights:24})).toThrow();expect(()=>calculateMiceBudget({...input,availableMeetingDays:2})).toThrow()});
 it("rejects missing references, invalid dates and invalid precision or numbers",()=>{for(const patch of [{reference:""},{end:"2024-02-30"},{end:"2024-01-31"},{groups:NaN},{groups:-1},{roomRate:.001},{groups:.12345}])expect(()=>calculateMiceBudget({...input,...patch})).toThrow()});
 it("exports assumptions, units and results including zero",()=>{const csv=miceBudgetCsv({...input,groups:0});expect(csv).toContain('"groups";"0";"expected_groups_per_period"');expect(csv).toContain('"contribution";"-100";"EUR"');expect(csv).toContain('"marginPct";"";"percent"')});
});
