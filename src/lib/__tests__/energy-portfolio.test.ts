import {describe,it,expect} from "vitest";
import {energyPortfolioCsv,parseEnergyCsv,readEnergyPortfolio,summarizeEnergyPortfolio,validEnergyProperty} from "../energy-portfolio";
const p={id:"one",nom:"Villa",classe:"G",surface:100,valeur:880000,type:"Maison",annee:1990};
describe("energy portfolio declared inventory",()=>{
 it("sums entered amounts exactly, without class discount or inferred energy",()=>{
  const r=summarizeEnergyPortfolio([p,{...p,id:"two",classe:"A+",surface:200,valeur:1200000},{...p,id:"three",classe:"?",surface:100,valeur:500000}]);
  expect(r.totalValeur).toBe(2580000);expect(r.totalSurface).toBe(400);expect(r.repartition.G).toBe(100);expect(r.repartition['A+']).toBe(200);expect(r.repartition['?']).toBe(100);
  expect(Object.values(r.repartition).reduce((s,v)=>s+v,0)).toBe(400);
 });
 it("retains legacy saved properties without modifying their values",()=>{expect(readEnergyPortfolio(JSON.stringify([p]))).toEqual([p]);});
 it("rejects corrupt storage and duplicate IDs instead of silently overwriting data",()=>{
  for(const raw of ['{','null','{}',JSON.stringify([p,p]),JSON.stringify([{...p,surface:-1}]),JSON.stringify([{...p,id:null}])])expect(()=>readEnergyPortfolio(raw)).toThrow();
 });
 it("validates finite positive numbers, year and declared class",()=>{
  for(const patch of [{surface:-1},{surface:0},{valeur:Infinity},{valeur:NaN},{annee:1990.5},{annee:999},{annee:9999},{nom:" "},{classe:"Z"},{type:""}])expect(validEnergyProperty({...p,...patch})).toBe(false);
  expect(validEnergyProperty({...p,classe:"?",annee:1700})).toBe(true);
 });
 it("round trips names and types with commas, semicolons, quotes and newlines",()=>{
  const {id:_,...source}={...p,nom:'Villa; "A",\nLuxembourg',type:'Commerce; bureaux'};
  const result=parseEnergyCsv('\uFEFF'+energyPortfolioCsv([source]));expect(result.errors).toEqual([]);expect(result.properties).toEqual([source]);
 });
 it("supports semicolon CSV with decimal commas, spaces and reordered columns",()=>{
  const csv='valeur;nom;surface;classe;annee;type\r\n1 200 000,50;Villa;100,25;A+;2015;Maison';
  const result=parseEnergyCsv(csv);expect(result.errors).toEqual([]);expect(result.properties[0]).toMatchObject({valeur:1200000.5,surface:100.25,classe:'A+'});
 });
 it("rejects invalid rows without inventing defaults and retains valid rows",()=>{
  const csv=energyPortfolioCsv([p,{...p,surface:Infinity},{...p,valeur:-1},{...p,classe:'Z'},{...p,annee:1990.5}]);
  const result=parseEnergyCsv(csv);expect(result.properties).toHaveLength(1);expect(result.errors).toHaveLength(4);
 });
 it("rejects malformed quotes and duplicate headers",()=>{
  for(const csv of ['nom,classe,surface,valeur,type,annee\n"Villa,G,100,900000,Maison,1990','nom,classe,surface,valeur,type,nom\nVilla,G,100,900000,Maison,1990','nom,classe,surface,valeur,type,annee\n"Villa"oops,G,100,900000,Maison,1990'])expect(parseEnergyCsv(csv)).toEqual({properties:[],errors:['format']});
 });
});
