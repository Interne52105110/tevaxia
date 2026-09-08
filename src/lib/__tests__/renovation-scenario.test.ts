import {describe,it,expect} from 'vitest';
import {calculerScenarioRenovation,type RenovationScenarioInput} from '../renovation-scenario';
const input:RenovationScenarioInput={travauxTTC:100,honorairesTTC:0,aidesConfirmees:0,anneeVersementAides:0,factureAvant:60,factureApres:0,entretienSupplementaire:0,hausseEnergiePct:0,actualisationPct:0,horizonAns:2,montantPret:0,tauxPretPct:0,dureePretAns:1};
describe('Renovation scenario: investment cash flows without automatic grants',()=>{
 it('reconciles the two-year cash flows and computes the unique IRR',()=>{
  const r=calculerScenarioRenovation(input);expect(r.van).toBe(20);expect(r.anneeRetour).toBe(2);expect(r.triPct).toBeCloseTo(13.07,2);expect(r.coutNetAides).toBe(100);
 });
 it('retains negative IRRs rather than flooring them at zero',()=>{const r=calculerScenarioRenovation({...input,horizonAns:1,factureAvant:50});expect(r.triPct).toBe(-50);expect(r.anneeRetour).toBeNull();});
 it('does not return an invented payback or IRR when there are no savings',()=>{const r=calculerScenarioRenovation({...input,factureAvant:0});expect(r.triPct).toBeNull();expect(r.anneeRetour).toBeNull();expect(r.van).toBe(-100);});
 it('does not invent an IRR for a zero initial investment',()=>{expect(calculerScenarioRenovation({...input,aidesConfirmees:100}).triPct).toBeNull();});
 it('accounts for grant timing in both cash needs and discounting',()=>{
  const immediate=calculerScenarioRenovation({...input,aidesConfirmees:20,factureAvant:10,horizonAns:1,actualisationPct:10});
  const delayed=calculerScenarioRenovation({...input,aidesConfirmees:20,anneeVersementAides:1,factureAvant:10,horizonAns:1,actualisationPct:10});
  expect(immediate.besoinInitial).toBe(80);expect(delayed.besoinInitial).toBe(100);expect(immediate.van).toBe(-70.91);expect(delayed.van).toBe(-72.73);
  expect(delayed.flux[0].aides).toBe(20);expect(delayed.coutNetAides).toBe(80);
 });
 it('starts price escalation in year two and deducts maintenance',()=>{const r=calculerScenarioRenovation({...input,factureAvant:100,entretienSupplementaire:5,hausseEnergiePct:10});expect(r.flux.map(f=>f.flux)).toEqual([95,105]);});
 it('allows a project to increase costs without converting that into positive savings',()=>{const r=calculerScenarioRenovation({...input,factureAvant:10,factureApres:20});expect(r.economieNetteAn1).toBe(-10);expect(r.van).toBe(-120);expect(r.triPct).toBeNull();});
 it('supports zero-rate loans and separates financing from project returns',()=>{const r=calculerScenarioRenovation({...input,montantPret:100});expect(r.mensualite).toBe(8.33);expect(r.interetsPret).toBe(0);expect(r.apportInitial).toBe(0);expect(r.soldeAnnuelApresCredit).toBe(-40);expect(r.van).toBe(calculerScenarioRenovation(input).van);expect(r.triPct).toBe(calculerScenarioRenovation(input).triPct);});
 it('calculates a standard amortising payment without a subsidised rate assumption',()=>{const r=calculerScenarioRenovation({...input,travauxTTC:100000,montantPret:100000,tauxPretPct:3,dureePretAns:20});expect(r.mensualite).toBe(554.60);expect(r.interetsPret).toBeCloseTo(33103.42,2);});
 it.each([{travauxTTC:-1},{aidesConfirmees:101},{montantPret:101},{anneeVersementAides:3},{horizonAns:1.5},{actualisationPct:-100},{hausseEnergiePct:-100},{factureAvant:NaN},{tauxPretPct:Infinity},{dureePretAns:0},{travauxTTC:undefined},{travauxTTC:1e308,honorairesTTC:1e308}])('rejects invalid scenario %j',v=>expect(()=>calculerScenarioRenovation({...input,...v} as RenovationScenarioInput)).toThrow());
});
