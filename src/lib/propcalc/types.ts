export interface AcquisitionFeesResult {
  coverage?: { status: string; excludedCosts: string[]; priceBasis?: string; reducedRate?: boolean; saleVatRate?: number | null };
  items: Array<{ label: string; amount: number; rate?: number }>;
  total: number;
  totalPercent: number;
}

export interface CashFlowProjectionYear {
  annualCashFlow: number;
  annualInterest: number;
  annualMortgage: number;
  principalPaid: number;
  year: number;
  propertyValue: number;
  cumulativeCashFlow: number;
  equity: number;
  remainingLoan: number;
}

export interface CashFlowResult {
  monthlyMortgage: number;
  grossAnnualRent: number;
  effectiveRent: number;
  noi: number;
  annualMortgage: number;
  annualDepreciation: number;
  taxableIncome: number;
  cashFlowBeforeTax: number;
  incomeTax: number;
  socialCharges: number;
  cashFlowAfterTax: number;
  monthlyCashFlow: number;
  grossYield: number;
  netYield: number;
  cashOnCash: number;
  leverageEffect: number;
  totalInvestment: number;
  cashInvested: number;
  loanAmount: number;
  projection: CashFlowProjectionYear[];
}
