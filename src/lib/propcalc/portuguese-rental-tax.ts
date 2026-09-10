/** Category F scenario: CIRS articles 41 and 72; EBF article 45-C (2026).
 * Official consolidated texts: info.portaldasfinancas.gov.pt, retrieved 2026-09-10.
 * Tax receipts and eligible paid expenses are separate from economic cash flow.
 */
export interface PortugueseRentalTaxInput {
  netRent: number; purchasePrice: number; taxRegime?: string; taxYear?: number; marginalRate?: number;
  portugueseCategoryFConfirmed?: boolean; portugueseRentalUse?: string;
  portugueseAnnualTaxReceipts?: number; portugueseDeductibleExpenses?: number;
  portugueseModerateRentEligible?: boolean;
  annualMortgageInterest?: number; annualDepreciation?: number;
}
export function calculatePortugueseRentalTax(input: PortugueseRentalTaxInput) {
  const year = input.taxYear ?? 2026;
  if (year !== 2025 && year !== 2026) throw new RangeError('Portuguese rental tax supports income years 2025 and 2026 only');
  const regime = input.taxRegime ?? 'flat_resident';
  if (!['flat_resident', 'flat_nonresident', 'progressive_resident'].includes(regime)) throw new RangeError('Unsupported Portuguese rental regime');
  if (input.portugueseCategoryFConfirmed !== true) throw new RangeError('Confirm portugueseCategoryFConfirmed: ordinary category F property rental, documented eligible paid expenses, no subletting, category B/business, regional adjustment, exemption, legacy or long-duration reduced rate; those cases require a separate assessment');
  const use = input.portugueseRentalUse;
  if (use !== 'housing' && use !== 'other') throw new RangeError('portugueseRentalUse must be housing or other');
  const receipts = input.portugueseAnnualTaxReceipts;
  const expenses = input.portugueseDeductibleExpenses;
  for (const [name, amount] of [['portugueseAnnualTaxReceipts', receipts], ['portugueseDeductibleExpenses', expenses]] as const) {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 1e12) throw new RangeError(`${name} must explicitly specify a non-negative finite amount`);
  }
  if ((input.annualMortgageInterest ?? 0) !== 0 || (input.annualDepreciation ?? 0) !== 0) throw new RangeError('Portuguese category F does not deduct financing costs or depreciation');
  const marginalRate = input.marginalRate ?? .3;
  if (!Number.isFinite(input.netRent) || Math.abs(input.netRent) > 1e12 || !Number.isFinite(input.purchasePrice) || input.purchasePrice <= 0 || input.purchasePrice > 1e12 || !Number.isFinite(marginalRate) || marginalRate < 0 || marginalRate > 1) throw new RangeError('Invalid Portuguese rental amount or marginal rate');
  const moderate = input.portugueseModerateRentEligible;
  if (year === 2026 && use === 'housing' && typeof moderate !== 'boolean') throw new RangeError('Explicitly confirm or exclude portugueseModerateRentEligible under EBF article 45-C and DL 97/2026 article 2 monthly-rent limits; do not infer eligibility from the modeled cash receipts');
  if (moderate === true && (year !== 2026 || use !== 'housing')) throw new RangeError('Moderate-rent relief is supported only for eligible housing income in 2026');
  const rate = regime === 'progressive_resident' ? marginalRate : moderate === true ? .1 : use === 'housing' ? .25 : .28;
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const taxableIncome = round(Math.max(0, receipts! - expenses!));
  const incomeTax = round(taxableIncome * rate);
  const netAfterTax = round(input.netRent - incomeTax);
  return {
    taxableIncome, incomeTax, socialCharges: 0, totalTax: incomeTax, depreciation: 0, mortgageInterestDeduction: 0,
    netAfterTax, netNetYield: Math.round(netAfterTax / input.purchasePrice * 10000) / 10000,
    portugueseTaxAssumptions: {
      incomeYear: year, regime, rentalUse: use, rate, annualTaxReceipts: round(receipts!), deductibleExpenses: round(expenses!),
      moderateRentEligibilityConfirmed: moderate === true, moderateRentReliefApplied: moderate === true && regime !== 'progressive_resident',
      rateSnapshot: '2026-09-10',
      scope: 'Ordinary category F, explicit fiscal receipts and documented paid expenses under CIRS article 41. Excludes financing, depreciation, furniture/appliances/decor and AIMI deductions. Housing autonomous base rate 25%, other property rental 28%; qualified EBF article 45-C housing 10% from 2026, subject to statutory monthly-rent limits confirmed by caller. More favourable long-duration/legacy rates, exemptions, regional adjustments, subletting, category B/business, deficit carryovers and treaties are outside this scenario. Englobamento uses an explicit marginal-rate scenario, not a household tax calculation or an automatic best-regime comparison. Economic vacancy/charges do not determine the fiscal base.',
    },
  };
}
