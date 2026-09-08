import { describe, it, expect } from 'vitest';
import { calculerCapitalInvesti, type CapitalInvestiInput } from '../calculations';
const base: CapitalInvestiInput={prixAcquisition:380000,fraisAcquisition:28000,terrainMontant:81600,anneeAcquisition:2000,anneeConstruction:1970,travauxMontant:15000,travauxAnnee:2000,anneeBail:2020,surfaceHabitable:100,appliquerVetuste:true,tauxVetusteAnnuel:.02};
describe('Loyer article 3, acquisition de logement achevé',()=>{
 it('reproduit le cas 2 du ministère, acquisition 2000 et référence 2020',()=>{
  const r=calculerCapitalInvesti(base);
  expect(r.erreurSaisie).toBeUndefined();expect(r.donneesCompletes).toBe(true);
  expect(r.terrainReevalue).toBeCloseTo(114240,2);
  expect(r.decoteVetuste).toBeCloseTo(95592,2);
  expect(r.capitalInvesti).toBeCloseTo(496608,2);
  expect(r.loyerMensuelMax).toBeCloseTo(2069.2,2);
 });
 it.each([[2015,0],[2016,0],[2017,.02],[2018,.02],[2019,.04]])('décompte les périodes révolues au millésime %i',(anneeBail,pct)=>{
  const r=calculerCapitalInvesti({...base,anneeConstruction:2000,anneeBail});
  expect(r.decoteVetustePct).toBe(pct);
 });
 it('ne redéprécie pas les années précédant un achat récent',()=>{
  const r=calculerCapitalInvesti({...base,anneeAcquisition:2018,travauxMontant:0});
  expect(r.decoteVetustePct).toBe(.02);
 });
 it('ne remet pas à zéro la vétusté après amélioration',()=>{
  expect(calculerCapitalInvesti({...base,travauxAnnee:2020}).decoteVetustePct).toBe(.2);
 });
 it('impute uniquement les frais justifiés disponibles et reporte le surplus',()=>{
  const r=calculerCapitalInvesti({...base,entretienReevalue:100000});
  expect(r.entretienImpute).toBeCloseTo(95592,2);expect(r.reportEntretien).toBeCloseTo(4408,2);
  expect(r.decoteVetuste).toBe(0);expect(r.capitalInvesti).toBeCloseTo(592200,2);
 });
 it('isole les factures de mobilier, sans majoration forfaitaire du capital',()=>{
  const nu=calculerCapitalInvesti({...base,anneeBail:2026});
  const meuble=calculerCapitalInvesti({...base,anneeBail:2026,estMeuble:true,mobilierEligible:10000});
  expect(meuble.capitalInvesti).toBe(nu.capitalInvesti);expect(meuble.supplementMobilierMensuel).toBe(150);
  expect(meuble.loyerMensuelMax-nu.loyerMensuelMax).toBeCloseTo(150,2);
 });
 it('exclut les travaux futurs et réévalue séparément les tranches réalisées',()=>{
  const r=calculerCapitalInvesti({...base,travauxMontant:0,tranchesSupplementaires:[{montant:2000,annee:2020},{montant:999999,annee:2021}]});
  expect(r.travauxReevalues).toBe(2000);
 });
 it('ignore le taux annuel libre historique',()=>{
  expect(calculerCapitalInvesti({...base,tauxVetusteAnnuel:50})).toEqual(calculerCapitalInvesti(base));
 });
 it.each([{prixAcquisition:-1},{terrainMontant:999999},{anneeConstruction:2021},{anneeBail:2030},{surfaceHabitable:NaN},{nbColocataires:1.5},{travauxAnnee:1999},{estMeuble:true}])('refuse les saisies ou régimes non pris en charge %j',(patch)=>{
  expect(calculerCapitalInvesti({...base,...patch}).erreurSaisie).toBeTruthy();
 });
});
