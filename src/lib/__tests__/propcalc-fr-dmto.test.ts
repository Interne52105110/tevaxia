import { describe, expect, it } from 'vitest';
import { calculateAcquisitionFees } from '../propcalc/fees';
import { getCountryData } from '../propcalc/countries';
import { POST as fees } from '@/app/api/v1/propcalc/fees/route';
import { POST as cashflow } from '@/app/api/v1/propcalc/cashflow/route';

const countryData = getCountryData('fr')!;
type FeesResult = { items: { label: string; amount: number; rate: number; details: string }[]; total: number };
function tax(regionCode = '', isPrimaryResidence = false, isFirstTimeBuyer = false) {
  return (calculateAcquisitionFees({ propertyPrice: 200000, countryCode: 'fr', regionCode, isNew: false, isPrimaryResidence, isFirstTimeBuyer, loanAmount: 0, buyerAge: 0, countryData }) as FeesResult).items[0];
}
const request = (body: object) => new Request('https://tevaxia.lu/api/v1/propcalc/fees', { method: 'POST', body: JSON.stringify(body) });
describe('French residential transfer-tax snapshot, DGFiP 1 June 2026', () => {
  it.each(['75','77','78','91','92','93','94','95','13','31','33','44','59','67','69'])('uses the voted 5%% department rate in %s, including collection charges', code => {
    // 10,000 departmental + 2,400 municipal + 237 collection; excludes CSI and notary remuneration.
    expect(tax(code).amount).toBe(12637);
    expect(tax(code).rate).toBe(6.3185);
    expect(tax(code).details).toContain('2026-06-01');
  });
  it('requires BOTH primary residence and first-property eligibility for the full share', () => {
    expect(tax('75', true, true).amount).toBe(11613.3);
    expect(tax('75', true, true).rate).toBe(5.80665);
    expect(tax('75', true, false).amount).toBe(12637);
    expect(tax('75', false, true).amount).toBe(12637);
  });
  it('identifies an unlocated scenario instead of claiming a national average', () => {
    expect(tax().amount).toBe(12637);
    expect(tax().details).toContain('hypothèse sans département');
    expect(tax().details).not.toContain('moyen');
  });
  it('does not silently replace an unknown department with a different rate', () => {
    expect(() => tax('36')).toThrow(RangeError);
    expect(() => tax('unknown')).toThrow(RangeError);
  });
  it('keeps the pre-VAT progressive sale remuneration separate from transfer tax', () => {
    const result = calculateAcquisitionFees({ propertyPrice: 200000, countryCode: 'fr', regionCode: '75', isNew: false, isPrimaryResidence: false, isFirstTimeBuyer: false, loanAmount: 0, buyerAge: 0, countryData }) as FeesResult;
    expect(result.items.find((item: {label: string}) => item.label === 'fees.notaryFees')?.amount).toBe(2394.3);
    expect(result.total).toBe(15231.3);
  });
  it('exposes scope and date in API assumptions and rejects unsupported locations', async () => {
    const response = await fees(request({ country: 'fr', price: 200000 }));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data.breakdown[0].amount).toBe(12637);
    expect(json.assumptions.frenchTransferTax.unlocatedDepartmentalRateAssumption).toBe(.05);
    expect(json.assumptions.frenchTransferTax.rateSnapshot).toBe('2026-06-01');
    expect((await fees(request({ country: 'fr', price: 200000, region: '36' }))).status).toBe(400);
  });
  it('propagates the unlocated investment assumption into cashflow', async () => {
    const response = await cashflow(request({ country: 'fr', propertyPrice: 200000, downPayment: 50000, monthlyRent: 1000, annualRate: .03, durationYears: 20 }));
    expect(response.status).toBe(200);
    expect((await response.json()).assumptions.frenchTransferTax.combinedRate).toBe(.063185);
  });
});
