import { describe, expect, it } from 'vitest';
import { simulerAides, calculerPrimeAccession2026, calculerTauxSubvention2026, type AidesInput } from '../aides-logement';
const base: AidesInput = {typeProjet:'acquisition',prixBien:750000,revenuMenage:80000,nbEmprunteurs:1,nbAdultes:1,nbEnfants:0,typeBien:'maison_isolee',residencePrincipale:true,estNeuf:false,montantPret:200000,revenuNet2024:20000,revenuNet2025:20000,conditionsAccessionConfirmees:true,potsCapitalRestants:[35000]};
const find = (input: Partial<AidesInput>, id: string) => simulerAides({...base,...input}).aides.find(a=>a.id===id)?.montant;
describe('Aides 2026 — official income limits and no invented awards', () => {
 it('uses the published 2026 single-person income ceiling', () => {
  expect(calculerPrimeAccession2026(52233.65,1,0,'maison_isolee')).toBe(500);
  expect(calculerPrimeAccession2026(52233.66,1,0,'maison_isolee')).toBe(0);
 });
 it('differentiates households, including single parents and fourth children', () => {
  expect(calculerPrimeAccession2026(10000,1,0,'maison_isolee')).toBe(5000);
  expect(calculerPrimeAccession2026(10000,2,0,'maison_isolee')).toBe(7000);
  expect(calculerPrimeAccession2026(10000,1,1,'appartement')).toBe(11200);
  expect(calculerPrimeAccession2026(10000,2,4,'maison_jumelee')).toBe(12650);
 });
 it('linearly decreases the award rather than granting the maximum to everybody', () => {
  expect(calculerPrimeAccession2026(((2805+5485)/2)*9.523,1,0,'maison_isolee')).toBe(2750);
 });
 it('rejects no-income prior year, no mortgage, and does not invent a missing reference year', () => {
  expect(find({revenuNet2025:0},'accession')).toBe(0);
  expect(find({montantPret:0},'accession')).toBe(0);
  expect(find({revenuNet2024:0},'accession')).toBeNull();
  expect(find({revenuNet2024:undefined},'accession')).toBeNull();
 });
 it('applies remaining personal capital pots without transferring unused shares', () => {
  expect(find({nbEmprunteurs:2,nbAdultes:2,potsCapitalRestants:[1000,35000]},'accession')).toBe(4500);
 });
 it('uses actual yearly savings and the remaining pot after accession', () => {
  expect(find({accroissementsEpargne:[[2000,3500,8000]],conditionsEpargneConfirmees:true},'epargne')).toBe(1050);
  expect(find({potsCapitalRestants:[5500],accroissementsEpargne:[[5000,5000]],conditionsEpargneConfirmees:true},'epargne')).toBe(500);
  expect(find({epargneReguliere3ans:true},'epargne')).toBeNull();
 });
 it('limits each savings beneficiary separately', () => {
  expect(find({nbAdultes:2,nbEmprunteurs:2,potsCapitalRestants:[35000,3600],accroissementsEpargne:[[5000,5000],[5000,5000]],conditionsEpargneConfirmees:true},'epargne')).toBe(1100);
 });
 it('preserves the minimum registration duty and personal credit shares', () => {
  expect(find({conditionsBellegenConfirmees:true,baseDroits:500000,creditsRestants:[40000]},'bellegen')).toBe(34900);
  expect(find({nbEmprunteurs:2,potsCapitalRestants:[35000,35000],conditionsBellegenConfirmees:true,baseDroits:500000,creditsRestants:[0,40000],quotePartPremier:.8},'bellegen')).toBe(7000);
 });
 it('counts tax relief as tax relief, not cash capital grants', () => {
  const r=simulerAides({...base,conditionsBellegenConfirmees:true,baseDroits:500000,creditsRestants:[40000]});
  expect(r.totalAidesDirectes).toBe(5000);expect(r.totalEconomies).toBe(34900);
 });
 it('uses one shared remaining VAT allowance and never the full 50k automatically', () => {
  expect(find({estNeuf:true,montantTravaux:100000},'tva')).toBeNull();
  const r=simulerAides({...base,estNeuf:true,montantTravaux:100000,conditionsTvaConfirmees:true,baseTvaEligibleHT:100000,faveurTvaRestante:4000});
  expect(r.aides.filter(a=>a.id==='tva')).toHaveLength(1);expect(r.aides.find(a=>a.id==='tva')?.montant).toBe(4000);
 });
 it('uses the eighth-point rule and the special low nominal rate adjustment', () => {
  expect(calculerTauxSubvention2026(10000,1,0,4)).toBe(3.5);
  expect(calculerTauxSubvention2026(5485*9.6017,1,0,4)).toBe(.25);
  expect(calculerTauxSubvention2026(100000,1,0,4)).toBe(0);
  expect(calculerTauxSubvention2026(10000,1,0,1.2)).toBe(1.2);
 });
 it('keeps the initial monthly subsidy separate from one-off totals and excludes payments below €10', () => {
  const r=simulerAides({...base,conditionsInteretConfirmees:true,nouveauPret:true,tauxPret:4});
  expect(r.subventionMensuelle).toBe(583.33);expect(r.totalGeneral).toBe(5000);
  expect(find({conditionsInteretConfirmees:true,nouveauPret:true,tauxPret:4,montantPret:1000},'interet')).toBe(0);
  expect(find({conditionsInteretConfirmees:true,nouveauPret:false,tauxPret:4},'interet')).toBeNull();
 });
 it('does not grant invented energy percentages, commune defaults or child bonification', () => {
  const r=simulerAides({...base,nbEnfants:2,montantTravaux:100000,commune:'Unknown'});
  for(const id of ['klima','conseil','topup','klimapret','privee','commune','garantie'])expect(r.aides.find(a=>a.id===id)?.montant).toBeNull();
  expect(r.aides.some(a=>a.nom==='Bonification d’intérêt')).toBe(false);
  expect(r.estimationComplete).toBe(false);
 });
 it('still identifies energy assistance for landlords', () => {
  const r=simulerAides({...base,residencePrincipale:false,typeProjet:'renovation',montantTravaux:100000});
  expect(r.aides.some(a=>a.id==='klima')).toBe(true);expect(r.aides.some(a=>a.id==='accession')).toBe(false);expect(r.totalGeneral).toBe(0);
 });
 it.each([{prixBien:NaN},{montantTravaux:-1},{revenuNet2025:Infinity},{nbEnfants:1.2},{potsCapitalRestants:[35001]},{creditsRestants:[40001]},{faveurTvaRestante:50001},{anneeProjet:2027},{accroissementsEpargne:[[1,2,3,4,5,6,7,8,9,10,11]]}])('rejects invalid or unsupported inputs %j', v=>expect(()=>simulerAides({...base,...v})).toThrow());
});
