/** Fixed-rate, monthly amortisation and constant-assumption rental scenario.
 * Tax is a marginal-rate scenario, not a household tax return or forecast of law.
 */
const money = value => Math.round((value + Number.EPSILON) * 100) / 100;
export function calculateInvestorCashFlow(params) {
  const {
    propertyPrice, acquisitionFees = 0, downPayment, annualRate, loanDurationYears,
    monthlyRent, vacancyRate = 0, monthlyCharges = 0, annualPropertyTax = 0,
    annualInsurance = 0, managementRate = 0, annualMaintenance = 0,
    marginalTaxRate = .30, socialChargesRate = 0, annualAppreciation = .02,
    countryCode = '', annualDepreciation = 0,
  } = params;
  for (const value of [propertyPrice, acquisitionFees, downPayment, annualRate,
    loanDurationYears, monthlyRent, vacancyRate, monthlyCharges, annualPropertyTax,
    annualInsurance, managementRate, annualMaintenance, marginalTaxRate,
    socialChargesRate, annualDepreciation]) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('Amounts and rates must be finite and non-negative');
  }
  if (propertyPrice <= 0 || loanDurationYears <= 0 || loanDurationYears > 50 ||
    !Number.isInteger(loanDurationYears * 12) ||
    [annualRate, vacancyRate, managementRate, marginalTaxRate, socialChargesRate].some(v => v > 1) ||
    !Number.isFinite(annualAppreciation) || annualAppreciation <= -1 || annualAppreciation > 1) {
    throw new RangeError('Invalid rate, price or whole-month loan duration');
  }
  const totalInvestment = money(propertyPrice + acquisitionFees);
  const cashInvested = money(downPayment);
  if (cashInvested > totalInvestment) throw new RangeError('Down payment exceeds total investment');
  const loanAmount = money(totalInvestment - cashInvested);
  const months = loanDurationYears * 12;
  const rate = annualRate / 12;
  const monthlyMortgage = money(rate === 0 ? loanAmount / months : loanAmount * rate / (1 - Math.pow(1 + rate, -months)));
  // No invented building/land split or automatically qualified depreciation.
  // UK: current 20% scenario; assumes adjusted income does not further limit relief.
  // No loss/finance-cost carry-forward, allowances or future statutory changes.
  function tax(noi, interest) {
    const taxableIncome = money(Math.max(0, noi - annualDepreciation - (countryCode === 'uk' ? 0 : interest)));
    const credit = countryCode === 'uk' ? Math.min(interest, taxableIncome) * .20 : 0;
    const incomeTax = money(Math.max(0, taxableIncome * marginalTaxRate - credit));
    const socialCharges = money(taxableIncome * socialChargesRate);
    return { taxableIncome, incomeTax, socialCharges, totalTax: money(incomeTax + socialCharges) };
  }
  let remainingLoan = loanAmount, cumulativeCashFlow = 0;
  const projection = [];
  for (let year = 1; year <= Math.min(20, Math.ceil(loanDurationYears) + 5); year++) {
    let annualInterest = 0, annualMortgage = 0, principalPaid = 0;
    for (let month = (year - 1) * 12 + 1; month <= Math.min(year * 12, months); month++) {
      if (remainingLoan <= 0) break;
      const interest = money(remainingLoan * rate);
      const payment = month === months ? money(remainingLoan + interest) : Math.min(monthlyMortgage, money(remainingLoan + interest));
      const principal = money(payment - interest);
      remainingLoan = money(Math.max(0, remainingLoan - principal));
      annualInterest = money(annualInterest + interest);
      annualMortgage = money(annualMortgage + payment);
      principalPaid = money(principalPaid + principal);
    }
    const growth = Math.pow(1.02, year - 1);
    const grossAnnualRent = money(monthlyRent * 12 * growth);
    const effectiveRent = money(grossAnnualRent * (1 - vacancyRate));
    const operatingExpenses = money((monthlyCharges * 12 + annualPropertyTax + annualInsurance + annualMaintenance) * growth + effectiveRent * managementRate);
    const noi = money(effectiveRent - operatingExpenses);
    const taxes = tax(noi, annualInterest);
    const cashFlowBeforeTax = money(noi - annualMortgage);
    const annualCashFlow = money(cashFlowBeforeTax - taxes.totalTax);
    cumulativeCashFlow = money(cumulativeCashFlow + annualCashFlow);
    const propertyValue = money(propertyPrice * Math.pow(1 + annualAppreciation, year));
    projection.push({ year, propertyValue, equity: money(propertyValue - remainingLoan),
      annualCashFlow, cumulativeCashFlow, remainingLoan, annualInterest, annualMortgage,
      principalPaid, grossAnnualRent, effectiveRent, operatingExpenses, noi,
      cashFlowBeforeTax, ...taxes });
  }
  const first = projection[0];
  const cashOnCash = cashInvested > 0 ? first.annualCashFlow / cashInvested : 0;
  const unleveredReturn = (first.noi - tax(first.noi, 0).totalTax) / totalInvestment;
  const ratio = value => Math.round(value * 10000) / 10000;
  return {
    monthlyMortgage, grossAnnualRent: first.grossAnnualRent, effectiveRent: first.effectiveRent,
    noi: first.noi, annualMortgage: first.annualMortgage, annualInterest: first.annualInterest,
    annualDepreciation: money(annualDepreciation), taxableIncome: first.taxableIncome,
    cashFlowBeforeTax: first.cashFlowBeforeTax, incomeTax: first.incomeTax,
    socialCharges: first.socialCharges, cashFlowAfterTax: first.annualCashFlow,
    monthlyCashFlow: money(first.annualCashFlow / 12), grossYield: ratio(first.grossAnnualRent / propertyPrice),
    netYield: ratio(first.noi / propertyPrice), cashOnCash: ratio(cashOnCash),
    leverageEffect: cashInvested > 0 ? ratio(cashOnCash - unleveredReturn) : 0,
    totalInvestment, cashInvested, loanAmount, projection,
  };
}
