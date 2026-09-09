/** Arithmetic ratio of entered delivered energy to entered area. Not a CPE indicator. */
export function measuredEnergyIntensity(energyKwh:number,areaM2:number):number{
 if(!Number.isFinite(energyKwh)||!Number.isFinite(areaM2)||energyKwh<0||areaM2<=0||energyKwh>1e9||areaM2>1e7)throw new Error("Invalid measurements");
 const value=energyKwh/areaM2;if(!Number.isFinite(value))throw new Error("Invalid ratio");return value;
}
