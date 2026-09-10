/** Ordinary residential cedolare secca only. Source: Agenzia delle Entrate,
 * https://infoprecompilata.agenziaentrate.gov.it/portale/semplificata-mod-fabbricati
 * https://www.agenziaentrate.gov.it/portale/documents/20143/3015794/GUIDA+AFFITTI+17+OTTOBRE+INTERNET+(1).pdf
 */
export interface ItalianRentalTaxInput {
  netRent: number;
  purchasePrice: number;
  taxRegime?: string;
  italianCedolareEligible?: boolean;
  italianAnnualContractRent?: number;
}

export function calculateItalianRentalTax(input: ItalianRentalTaxInput) {
  if ((input.taxRegime ?? 'cedolare_secca') !== 'cedolare_secca') {
    throw new RangeError('Italian IRPEF and special rental regimes require a separate assessment; no net-expense proxy is calculated');
  }
  if (input.italianCedolareEligible !== true) {
    throw new RangeError('Confirm italianCedolareEligible: an eligible individual landlord outside business/professional activity, ordinary residential free-market lease and valid cedolare option at 21%; short lets and reduced-rate contracts are outside this scenario');
  }
  const rent = input.italianAnnualContractRent;
  if (typeof rent !== 'number' || !Number.isFinite(rent) || rent < 0 || rent > 1e12) {
    throw new RangeError('italianAnnualContractRent must be the non-negative gross contractual rent attributable to the ownership share and rental period; do not deduct expenses or mechanically apply a vacancy/unpaid-rent percentage');
  }
  if (!Number.isFinite(input.netRent) || Math.abs(input.netRent) > 1e12 || !Number.isFinite(input.purchasePrice) || input.purchasePrice <= 0 || input.purchasePrice > 1e12) {
    throw new RangeError('Invalid Italian rental income or purchase price');
  }
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  // Expenses and negative economic income do not reduce the contractual tax base.
  const taxableIncome = round(rent);
  const incomeTax = round(taxableIncome * .21);
  const netAfterTax = round(input.netRent - incomeTax);
  return {
    taxableIncome, incomeTax, socialCharges: 0, totalTax: incomeTax,
    depreciation: 0, mortgageInterestDeduction: 0, netAfterTax,
    netNetYield: Math.round(netAfterTax / input.purchasePrice * 10000) / 10000,
    italianTaxAssumptions: {
      rateSnapshot: '2026-09-10', regime: 'cedolare_secca', rate: .21,
      eligibilityConfirmed: true, annualContractRent: taxableIncome,
      scope: 'Ordinary residential free-market lease with valid cedolare option by an eligible individual landlord outside business/professional activity. Gross contractual rent for the ownership share and rental period; no expense, interest or depreciation deduction. Excludes short lets, reduced-rate/concordato contracts, unpaid-rent relief, cadastral/minimum-income special cases, IRPEF, treaties and a full tax-return assessment. Vacancy affects economic receipts only; the caller supplies the contractual tax base separately.',
    },
  };
}
