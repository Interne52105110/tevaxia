import { describe, expect, it } from 'vitest';
import { calculateItalianRentalTax as calculate } from '../propcalc/italian-rental-tax';
import { calculateTaxImpact } from '../propcalc/rental';
import { POST } from '@/app/api/v1/propcalc/yield/route';
const base = { netRent: 8000, purchasePrice: 200000, italianCedolareEligible: true, italianAnnualContractRent: 12000 };
const request = (body: object) => new Request('https://example.test/api/v1/propcalc/yield', { method: 'POST', body: JSON.stringify(body) });
const api = { country: 'it', purchasePrice: 200000, monthlyRent: 1000, italianCedolareEligible: true, italianAnnualContractRent: 12000 };
describe('Italian ordinary residential cedolare', () => {
  it('taxes contractual gross rent rather than net economic income', () => {
    const result = calculate(base);
    expect(result.taxableIncome).toBe(12000); expect(result.totalTax).toBe(2520); expect(result.netAfterTax).toBe(5480); expect(result.netNetYield).toBe(.0274);
  });
  it('keeps tax payable even if expenses exceed economic receipts', () => {
    const result = calculateTaxImpact({ ...base, annualRent: 12000, countryCode: 'it', taxRegime: 'cedolare_secca', marginalRate: .3, socialChargesRate: 0, countryData: {}, netRent: -3000 }) as ReturnType<typeof calculate>;
    expect(result.totalTax).toBe(2520); expect(result.netAfterTax).toBe(-5520);
  });
  it('does not deduct mortgage interest, depreciation or apply a marginal rate', () => {
    const result = calculateTaxImpact({ ...base, annualRent: 12000, countryCode: 'it', taxRegime: 'cedolare_secca', countryData: {}, annualMortgageInterest: 3000, annualDepreciation: 4000, marginalRate: .43, socialChargesRate: .2 }) as ReturnType<typeof calculate>;
    expect(result.totalTax).toBe(2520); expect(result.depreciation).toBe(0); expect(result.mortgageInterestDeduction).toBe(0); expect(result.socialCharges).toBe(0);
  });
  it('uses the explicit ownership/period base and preserves zero', () => {
    expect(calculate({ ...base, italianAnnualContractRent: 3000 }).totalTax).toBe(630);
    expect(calculate({ ...base, italianAnnualContractRent: 0 }).totalTax).toBe(0);
  });
  it('rounds tax and cash result to cents', () => {
    const result = calculate({ ...base, italianAnnualContractRent: 12000.37 });
    expect(result.totalTax).toBe(2520.08); expect(result.netAfterTax).toBe(5479.92);
  });
  it('requires explicit eligibility instead of assuming from country or profitability', () => {
    for (const italianCedolareEligible of [undefined, false]) expect(() => calculate({ ...base, italianCedolareEligible, netRent: -1000 })).toThrow(/italianCedolareEligible/);
  });
  it('rejects missing, nonfinite or invalid contractual bases', () => {
    for (const italianAnnualContractRent of [undefined, NaN, Infinity, -1, 1e13]) expect(() => calculate({ ...base, italianAnnualContractRent })).toThrow(/italianAnnualContractRent/);
  });
  it('does not silently use a net-expense IRPEF or unknown regime', () => {
    for (const taxRegime of ['irpef', 'short_let', 'concordato', 'unknown']) expect(() => calculate({ ...base, taxRegime })).toThrow(/separate assessment/);
  });
  it('keeps modeled vacancy distinct from contractual tax base through the API', async () => {
    const response = await POST(request({ ...api, vacancyRate: .5, monthlyCharges: 600 }));
    expect(response.status).toBe(200); const result = await response.json();
    expect(result.data.effectiveRent).toBe(6000); expect(result.data.netRent).toBe(-1200);
    expect(result.data.tax.taxableIncome).toBe(12000); expect(result.data.tax.totalTax).toBe(2520); expect(result.data.netAfterTax).toBe(-3720);
    expect(result.assumptions.italianTax.rate).toBe(.21); expect(result.assumptions.italianTax.scope).toContain('Excludes short lets');
  });
  it('accepts country casing and does not overwrite a zero contractual base', async () => {
    const response = await POST(request({ ...api, country: 'IT', italianAnnualContractRent: 0 }));
    expect(response.status).toBe(200); expect((await response.json()).data.tax.totalTax).toBe(0);
  });
  it('rejects absent qualification/base and unsupported IRPEF through the API', async () => {
    for (const extra of [{ italianCedolareEligible: undefined }, { italianAnnualContractRent: undefined }, { taxRegime: 'irpef' }, { italianCedolareEligible: 'true' }, { italianAnnualContractRent: null }]) expect((await POST(request({ ...api, ...extra }))).status).toBe(400);
  });
  it('rejects Italian fields for another country', async () => {
    expect((await POST(request({ ...api, country: 'pt' }))).status).toBe(400);
  });
});
