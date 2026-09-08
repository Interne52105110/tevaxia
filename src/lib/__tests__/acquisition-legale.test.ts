import { describe, it, expect } from 'vitest';
import { calculerFraisAcquisition, calculerEmolumentsNotaire, calculerFraisHypotheque } from '../calculations';
const base = { prixBien: 750000, estNeuf: false, residencePrincipale: true, nbAcquereurs: 2 as const };
describe('Acquisition — tarif et droits distincts', () => {
  it('applies the specific sale minimum and ordinary loan minimum', () => {
    expect(calculerEmolumentsNotaire(100)).toBe(99.16);
    expect(calculerFraisHypotheque(100).emolumentsHT).toBe(61.97);
    expect(calculerFraisHypotheque(0).total).toBe(0);
  });
  it('uses successive official tranches on either side of the first boundary', () => {
    expect(calculerEmolumentsNotaire(3718)).toBe(148.72);
    expect(calculerEmolumentsNotaire(3719)).toBe(148.75);
    expect(calculerEmolumentsNotaire(5000)).toBe(174.37);
    expect(calculerEmolumentsNotaire(750000)).toBe(1900.23);
  });
  it('separates principal obligation duty from the secured amount including accessories', () => {
    const h = calculerFraisHypotheque(400000, 480000);
    expect(h).toEqual({ emolumentsHT: 928.19, tvaEmoluments: 157.79, droitsObligation: 960, droitsInscription: 240, total: 2285.98 });
  });
  it('does not transfer unused personal credits across ownership shares', () => {
    const r = calculerFraisAcquisition({ ...base, quotePartPremier: .9, creditsRestants: [40000, 40000] });
    expect(r.creditBellegenAkt).toBe(45250);
    expect(r.droitsApresCredit).toBe(7250);
  });
  it('does not transfer a fully used credit to the other buyer', () => {
    const r = calculerFraisAcquisition({ ...base, creditsRestants: [0, 40000] });
    expect(r.creditBellegenAkt).toBe(26250);
    expect(r.droitsApresCredit).toBe(26250);
  });
  it('retains 100 euros and adds VAT on notarial fees to the total', () => {
    const r = calculerFraisAcquisition(base);
    expect(r.droitsApresCredit).toBe(100);
    expect(r.emolumentsNotaireHT).toBe(1900.23);
    expect(r.tvaEmolumentsNotaire).toBe(323.04);
    expect(r.totalFrais).toBe(2323.27);
    expect(r.coutTotalAcquisition).toBe(752323.27);
  });
  it('excludes companies from the personal credit and new-build reduced VAT', () => {
    const r = calculerFraisAcquisition({ ...base, achatSociete: true, estNeuf: true, partTerrain: 250000 });
    expect(r.creditBellegenAkt).toBe(0);
    expect(r.faveurFiscaleTva).toBe(0);
    expect(r.montantTva).toBe(85000);
  });
  it('does not infer temporary eligibility from a date alone', () => {
    expect(calculerFraisAcquisition({ ...base, dateActe: '2025-03' }).droitsTotal).toBe(52500);
  });
  it('checks the registered preliminary contract for the 2025 extension', () => {
    expect(() => calculerFraisAcquisition({ ...base, dateActe: '2025-09', reductionBaseConfirmee: true })).toThrow();
    expect(calculerFraisAcquisition({ ...base, dateActe: '2025-09', reductionBaseConfirmee: true, compromisEnregistreAvantJuillet2025: true }).droitsTotal).toBe(26250);
    expect(() => calculerFraisAcquisition({ ...base, dateActe: '2025-10', reductionBaseConfirmee: true, compromisEnregistreAvantJuillet2025: true })).toThrow();
  });
  it('reports the effective VAT rate when the 50000 benefit is exhausted', () => {
    const r = calculerFraisAcquisition({ ...base, estNeuf: true, partTerrain: 250000 });
    expect(r.montantTva).toBe(35000);
    expect(r.tauxTva).toBe(.07);
    expect(r.hypotheses.join(' ')).toContain('aucune construction déjà réalisée');
  });
  it('rejects unknown VEFA land allocation and inconsistent net prices', () => {
    expect(() => calculerFraisAcquisition({ ...base, estNeuf: true })).toThrow();
    expect(() => calculerFraisAcquisition({ ...base, estNeuf: true, partTerrain: 800000 })).toThrow();
    expect(() => calculerFraisAcquisition({ ...base, estNeuf: true, partTerrain: 250000, partConstruction: 300000 })).toThrow();
  });
  it.each([-1, NaN, Infinity])('rejects invalid principal %s', montant => {
    expect(() => calculerFraisHypotheque(montant)).toThrow();
    expect(() => calculerFraisAcquisition({ ...base, prixBien: montant })).toThrow();
  });
  it('rejects invalid shares, balances and security below principal', () => {
    expect(() => calculerFraisAcquisition({ ...base, quotePartPremier: 1 })).toThrow();
    expect(() => calculerFraisAcquisition({ ...base, creditsRestants: [40001, 0] })).toThrow();
    expect(() => calculerFraisAcquisition({ ...base, creditsRestants: [40000] })).toThrow();
    expect(() => calculerFraisHypotheque(400000, 300000)).toThrow();
  });
});
