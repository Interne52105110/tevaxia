/** Rectangular plan area, or constant-thickness geometric volume. No geotechnical design. */
export function rectangularVrdQuantity(lengthM:number,widthM:number,thicknessCm:number|null){
 if(!Number.isFinite(lengthM)||!Number.isFinite(widthM)||lengthM<=0||widthM<=0||lengthM>1e6||widthM>1e6)throw new RangeError('Invalid dimensions');
 if(thicknessCm!==null&&(!Number.isFinite(thicknessCm)||thicknessCm<=0||thicknessCm>1e6))throw new RangeError('Invalid thickness');
 const raw=lengthM*widthM*(thicknessCm===null?1:thicknessCm/100),quantity=Math.round(raw*10000)/10000;
 if(!Number.isFinite(raw)||quantity<=0||quantity>1e6)throw new RangeError('Quantity out of scope');
 return {quantity,unit:thicknessCm===null?'m2' as const:'m3' as const};
}
