/** User-supplied annual trajectory. No CRREM dataset is embedded or inferred. */
export interface TrajectoryPoint {year:number;targetEnergy:number;targetCarbon:number;assetEnergy:number;assetCarbon:number}
export const TRAJECTORY_KEYS=['targetEnergy','targetCarbon','assetEnergy','assetCarbon'] as const;
export function validateTrajectory(points:TrajectoryPoint[]){
 if(points.length<2||points.length>151)throw new RangeError('rows');
 points.forEach((p,k)=>{
  if(!Number.isInteger(p.year)||p.year<2000||p.year>2150||(k>0&&p.year!==points[k-1].year+1))throw new RangeError('years');
  if(!TRAJECTORY_KEYS.every(key=>Number.isFinite(p[key])&&p[key]>=0&&p[key]<=1e12))throw new RangeError('values');
 });
}

export function parseTrajectory(text:string):TrajectoryPoint[]{
 const lines=text.trim().split(/\r?\n/).filter(line=>line.trim());
 if(lines[0]?.trim()==='year;targetEnergy;targetCarbon;assetEnergy;assetCarbon'||lines[0]?.trim()==='year\ttargetEnergy\ttargetCarbon\tassetEnergy\tassetCarbon')lines.shift();
 const points=lines.map(line=>{
  const cells=line.split(line.includes('\t')?'\t':';').map(cell=>cell.trim());
  if(cells.length!==5||cells.some(cell=>!/^\d+(?:[.,]\d+)?$/.test(cell)))throw new RangeError('format');
  const [year,targetEnergy,targetCarbon,assetEnergy,assetCarbon]=cells.map(cell=>Number(cell.replace(',','.')));
  return{year,targetEnergy,targetCarbon,assetEnergy,assetCarbon};
 });
 validateTrajectory(points);return points;
}
