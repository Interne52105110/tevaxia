import {validateTrajectory,type TrajectoryPoint} from './pathways';
/** Compare only the supplied annual series; no interpolation, extrapolation or net-zero claim. */
export function compareTrajectory(points:TrajectoryPoint[],reference:string){
 validateTrajectory(points);
 if(!reference.trim())throw new RangeError('reference');
 const rows=points.map(p=>({...p,energyGap:Math.max(0,p.assetEnergy-p.targetEnergy),carbonGap:Math.max(0,p.assetCarbon-p.targetCarbon)}));
 const firstEnergy=rows.find(p=>p.energyGap>0)?.year??null;
 const firstCarbon=rows.find(p=>p.carbonGap>0)?.year??null;
 const first=rows.find(p=>p.energyGap>0||p.carbonGap>0)?.year??null;
 return{rows,firstEnergy,firstCarbon,first,from:points[0].year,to:points[points.length-1].year};
}
export function calculateReportedIntensities(area:number,energy:number,carbon:number){
 if(![area,energy,carbon].every(n=>Number.isFinite(n)&&n>=0&&n<=1e12)||area<=0)throw new RangeError('inputs');
 return{energy:energy/area,carbon:carbon/area};
}
