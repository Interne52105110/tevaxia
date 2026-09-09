import {describe,it,expect} from 'vitest';
import {parseDcfLeasesCsv,dcfLeasesCsv} from '../dcf-lease-csv';
import type {Lease} from '../dcf-leases';
const lease:Lease={id:'source',locataire:'Tenant; "A"\nsecond line',surface:100.5,loyerAnnuel:12000.5,dateDebut:'2026-01',dateFin:'2030-12',dateBreak:'',indexation:0,ervM2:120,probabiliteRenouvellement:0,franchiseMois:0,fitOutContribution:0,chargesLocataire:0,stepRents:[{annee:2,nouveauLoyer:24000}]};
describe('lease CSV contract',()=>{
 it('round-trips quoted names, multiline text, zeros and rent steps',()=>{
  const parsed=parseDcfLeasesCsv(dcfLeasesCsv([lease]));expect(parsed).toHaveLength(1);expect({...parsed[0],id:'source',dateBreak:''}).toEqual(lease);
 });
 it('keeps decimal commas within semicolon columns and does not default zero values',()=>{
  const csv=dcfLeasesCsv([lease]).replace('"100.5"','"100,5"').replace('"12000.5"','"12000,5"');
  const [parsed]=parseDcfLeasesCsv(csv);expect(parsed.surface).toBe(100.5);expect(parsed.loyerAnnuel).toBe(12000.5);expect(parsed.indexation).toBe(0);expect(parsed.probabiliteRenouvellement).toBe(0);
 });
 it('rejects malformed dates, missing required numbers, headers and rows atomically',()=>{
  const csv=dcfLeasesCsv([lease,{...lease,id:'second',locataire:'Second'}]);
  expect(()=>parseDcfLeasesCsv(csv.replace('2030-12','2030-13'))).toThrow();
  expect(()=>parseDcfLeasesCsv(csv.replace('"100.5"','""'))).toThrow();
  expect(()=>parseDcfLeasesCsv(csv.replace('loyerAnnuel','unknown'))).toThrow();
  expect(()=>parseDcfLeasesCsv(csv+'\n"unclosed')).toThrow();
 });
});
