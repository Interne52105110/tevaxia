import {describe,it,expect} from 'vitest';
import {compareTrajectory,calculateReportedIntensities,parseTrajectory,type TrajectoryPoint} from '../crrem';
const series:TrajectoryPoint[]=[{year:2026,targetEnergy:100,targetCarbon:20,assetEnergy:100,assetCarbon:10},{year:2027,targetEnergy:90,targetCarbon:9,assetEnergy:100,assetCarbon:10},{year:2028,targetEnergy:80,targetCarbon:8,assetEnergy:70,assetCarbon:7}];
describe('Documented annual trajectory comparison',()=>{
 it('compares boundaries without rounding and preserves first exceedance after recovery',()=>{const r=compareTrajectory(series,'study v1');expect(r.first).toBe(2027);expect(r.firstEnergy).toBe(2027);expect(r.firstCarbon).toBe(2027);expect(r.rows[0].energyGap).toBe(0);expect(r.rows[1].energyGap).toBe(10);expect(r.rows[1].carbonGap).toBe(1);expect(r.rows[2].energyGap).toBe(0);expect(compareTrajectory([{...series[0],assetEnergy:100.00001},series[1]],'study').firstEnergy).toBe(2026)});
 it('returns null for no exceedance only within supplied years, not a net-zero year',()=>{const r=compareTrajectory(series.map(p=>({...p,assetEnergy:0,assetCarbon:0})),'study');expect(r.first).toBeNull();expect(r.to).toBe(2028);expect(r).not.toHaveProperty('netZeroYear')});
 it('rejects gaps, unordered years, duplicates, missing references and invalid numbers',()=>{for(const points of [[],[series[0]],[series[0],series[2]],[series[1],series[0]],[series[0],series[0]]])expect(()=>compareTrajectory(points,'study')).toThrow();expect(()=>compareTrajectory(series,'  ')).toThrow();for(const n of [NaN,Infinity,-1])for(const key of ['targetEnergy','targetCarbon','assetEnergy','assetCarbon'])expect(()=>compareTrajectory([{...series[0],[key]:n},series[1]],'study')).toThrow()});
 it('computes reported intensities without fabricated emission factors or heat-pump COP',()=>{expect(calculateReportedIntensities(150,23500,4200)).toEqual({energy:23500/150,carbon:28});for(const n of [0,-1,NaN,Infinity])expect(()=>calculateReportedIntensities(n,23500,4200)).toThrow();expect(()=>calculateReportedIntensities(150,-1,4200)).toThrow();expect(calculateReportedIntensities(150,0,0)).toEqual({energy:0,carbon:0})});
});

it('reads decimal comma and tabular imports without treating blank values as zero',()=>{
 expect(parseTrajectory('2026;100;20;100;10\n2027;90,5;9;99,5;10')[1].targetEnergy).toBe(90.5);
 expect(parseTrajectory('year\ttargetEnergy\ttargetCarbon\tassetEnergy\tassetCarbon\n2026\t100\t20\t100\t10\n2027\t90\t9\t100\t10')).toHaveLength(2);
 expect(()=>parseTrajectory('2026;100;;100;10\n2027;90;9;100;10')).toThrow();
 expect(()=>parseTrajectory('2026;1e2;20;100;10\n2027;90;9;100;10')).toThrow();
});
