import { describe,it,expect } from 'vitest';
import { calculerPlusValue,calculerImpotBareme,type PlusValueInput } from '../calculations';
const base:PlusValueInput={prixAcquisition:100000,anneeAcquisition:2010,dateAcquisition:'2010-01-15',prixCession:276000,anneeCession:2025,dateCession:'2025-12-15',revenuImposable:50000,estCouple:false,estResidencePrincipale:false};
describe('Fiscalité immobilière LU 2025–2026',()=>{
 it('reproduit les montants ACD du demi-taux global en classe 1',()=>{
  expect(Math.floor(calculerImpotBareme(150000))).toBe(46590);
  expect(Math.floor(calculerImpotBareme(50000))).toBe(7341);
  const r=calculerPlusValue(base);expect(r.erreurSaisie).toBeUndefined();expect(r.gainImposable).toBe(100000);expect(r.estimationImpot).toBe(15530);
 });
 it('le revenu nul est une valeur connue, sans fallback à 20/40 %',()=>{
  const r=calculerPlusValue({...base,revenuImposable:0});expect(r.estimationImpot).toBeLessThan(20000);
  expect(calculerPlusValue({...base,revenuImposable:undefined}).erreurSaisie).toBeTruthy();
 });
 it.each([['2021-09-08','2026-09-08','speculation'],['2021-09-08','2026-09-09','cession'],['2021-09-09','2026-09-08','speculation']])('respecte les anniversaires %s → %s',(a,v,type)=>{
  const r=calculerPlusValue({...base,dateAcquisition:a,anneeAcquisition:Number(a.slice(0,4)),dateCession:v,anneeCession:Number(v.slice(0,4))});expect(r.typeGain).toBe(type);
 });
 it.each([['2025-06-30',false,'cession',.25],['2025-07-01',false,'speculation',1],['2025-07-01',true,'cession',.25],['2025-09-30',true,'cession',.25],['2025-10-01',true,'speculation',1]])('applique le transitoire %s, compromis %s',(date,compromis,type,fraction)=>{
  const r=calculerPlusValue({...base,anneeAcquisition:2022,dateAcquisition:'2022-01-01',dateCession:date,compromisEnregistreAvantJuillet2025:compromis});expect(r.typeGain).toBe(type);expect(r.fractionTaux).toBe(fraction);
 });
 it('conserve prix et date du dernier achat dans les transmissions gratuites',()=>{
  expect(calculerPlusValue({...base,modeAcquisition:'succession'})).toEqual(calculerPlusValue(base));
  expect(calculerPlusValue({...base,modeAcquisition:'donation'})).toEqual(calculerPlusValue(base));
 });
 it('applique le solde du décennal et le successoral avant le décennal',()=>{
  const r=calculerPlusValue({...base,modeAcquisition:'succession',abattementSuccessionDisponible:75000,abattementsAnterieurs:40000});expect(r.abattementSuccession).toBe(75000);expect(r.abattement).toBe(10000);expect(r.gainImposable).toBe(65000);
  expect(calculerPlusValue({...base,abattementsAnterieurs:90000}).abattement).toBe(0);
 });
 it('réévalue les dépenses selon leur année et déduit les frais de vente',()=>{
  const r=calculerPlusValue({...base,fraisAcquisition:10000,travauxDeductibles:20000,travauxAnnee:2020,fraisCession:5000});
  expect(r.fraisForfaitaires).toBe(12600+21800+5000);expect(r.gainBrut).toBe(110600);
 });
 it('ne soumet pas une résidence principale exonérée aux contributions',()=>{
  const r=calculerPlusValue({...base,estResidencePrincipale:true,soumisDependance:true});expect(r.impotTotalMax).toBe(0);expect(r.produitNetMin).toBe(276000);
 });
 it('distingue produit de vente et gain économique, et donne une provision explicite',()=>{
  const r=calculerPlusValue({...base,fraisCession:1000,soumisDependance:true});expect(r.dependance).toBe(99000*.014);expect(r.produitNetMin).toBe(275000-r.impotTotalMax);expect(r.netApresImpot).toBe(175000-r.estimationImpot);
  expect(calculerPlusValue({...base,prixCession:500000}).emploiMax).toBeGreaterThan(calculerPlusValue({...base,prixCession:500000}).emploiMin);
 });
 it('calcule la contribution emploi ordinaire avec le raccordement ACD',()=>{
  const r=calculerPlusValue({...base,anneeAcquisition:2025,dateAcquisition:'2025-01-01',prixAcquisition:100000,prixCession:200000,revenuImposable:150000});
  const iTotal=Math.floor(calculerImpotBareme(250000)),iSans=46590;
  expect(r.estimationImpot+r.emploiMin).toBe(Math.floor(iTotal*1.09-931.8)-Math.floor(iSans*1.07));expect(r.emploiMin).toBe(r.emploiMax);
 });
 it('applique le seuil annuel de dépendance à l’ensemble des bases patrimoniales',()=>{
  const low={...base,prixCession:176100,soumisDependance:true};
  expect(calculerPlusValue(low).dependance).toBe(0);
  expect(calculerPlusValue({...low,autresBasesDependance:2000}).dependance).toBeCloseTo(1.4,2);
 });
 it('exonère le bénéfice spéculatif annuel strictement inférieur à 500 €',()=>{
  const small={...base,anneeAcquisition:2025,dateAcquisition:'2025-01-01'};
  expect(calculerPlusValue({...small,prixCession:100499}).gainImposable).toBe(0);
  expect(calculerPlusValue({...small,prixCession:100500}).gainImposable).toBe(500);
 });
 it.each([{dateCession:'2025-02-30'},{dateAcquisition:'1900-01-01',anneeAcquisition:1900},{prixCession:-1},{travauxDeductibles:100,travauxAnnee:2030},{dateCession:undefined},{abattementSuccessionDisponible:75000},{anneeCession:2026}])('ne présente pas de taxe pour une saisie invalide %j',patch=>{expect(calculerPlusValue({...base,...patch}).erreurSaisie).toBeTruthy()});
});
