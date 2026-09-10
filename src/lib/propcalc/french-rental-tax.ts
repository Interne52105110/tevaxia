/** Simplified marginal-rate scenario, not a household income-tax assessment.
 * Sources: impots.gouv.fr/particulier/location-meublee (2025 income),
 * service-public.gouv.fr/particuliers/vosdroits/F32744 (2026 income),
 * impots.gouv.fr/particulier/questions/je-donne-un-bien-en-location-dois-je-payer-des-prelevements-sociaux.
 */
export interface FrenchRentalTaxInput {
 netRent: number; purchasePrice: number; annualRent: number; taxRegime?: string; marginalRate?: number;
 annualMortgageInterest?: number; annualDepreciation?: number; taxYear?: number;
 frenchMicroEligible?: boolean; frenchNonProfessional?: boolean; frenchSocialRegime?: string;
}
export function calculateFrenchRentalTax(input: FrenchRentalTaxInput) {
 const year=input.taxYear ?? 2026;
 if(year!==2025 && year!==2026) throw new RangeError('French rental tax supports income years 2025 and 2026 only');
 const regime=input.taxRegime || 'reel_foncier';
 const furnished=['micro_bic','micro_bic_tourism','micro_bic_tourism_unclassified'].includes(regime);
 if(!furnished && !['micro_foncier','reel_foncier'].includes(regime)) throw new RangeError('Unsupported French rental tax regime');
 const micro=regime!=='reel_foncier';
 if(micro && input.frenchMicroEligible!==true) throw new RangeError('Confirm frenchMicroEligible for the whole household/activity, including prior-year thresholds, other properties and exclusions');
 if(furnished && input.frenchNonProfessional!==true) throw new RangeError('Confirm non-professional furnished rental; professional/activity contributions are outside this estimate');
 const socialRegime=input.frenchSocialRegime ?? 'standard';
 if(!['standard','solidarity_only'].includes(socialRegime)) throw new RangeError('Unsupported French social regime');
 const {netRent,purchasePrice,annualRent}=input;
 const marginalRate=input.marginalRate ?? .30;
 const interest=input.annualMortgageInterest ?? 0;
 for(const amount of [annualRent,purchasePrice,interest]) if(!Number.isFinite(amount)||amount<0||amount>1e12) throw new RangeError('Invalid French rental amount');
 if(!Number.isFinite(netRent)||Math.abs(netRent)>1e12||!Number.isFinite(marginalRate)||marginalRate<0||marginalRate>1) throw new RangeError('Invalid French rental net income or marginal rate');
 if((input.annualDepreciation ?? 0)!==0) throw new RangeError('Depreciation is outside these French rental regimes; special regimes require a separate assessment');
 if(regime==='micro_foncier' && annualRent>15000) throw new RangeError('Micro-foncier receipts exceed 15000 EUR');
 if(regime==='micro_bic_tourism' && annualRent>23000) throw new RangeError('Short-stay furnished receipts above 23000 EUR require an activity-contribution assessment');
 if(regime==='micro_bic_tourism_unclassified' && annualRent>23000) throw new RangeError('Short-stay furnished receipts above 23000 EUR require an activity-contribution assessment');
 const allowanceRate=regime==='micro_foncier'||regime==='micro_bic_tourism_unclassified'?.30:.50;
 // The allowance replaces expenses. Negative cash income does not cancel micro taxable receipts.
 const allowance=micro?Math.min(annualRent,Math.max(annualRent*allowanceRate,furnished?305:0)):0;
 const taxableIncome=micro?annualRent-allowance:Math.max(0,netRent-interest);
 const socialRate=socialRegime==='solidarity_only'?.075:furnished?.186:.172;
 const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
 const incomeTax=round(taxableIncome*marginalRate),socialCharges=round(taxableIncome*socialRate);
 const totalTax=round(incomeTax+socialCharges),netAfterTax=round(netRent-totalTax);
 return {
  taxableIncome:round(taxableIncome),depreciation:0,mortgageInterestDeduction:micro?0:round(interest),
  incomeTax,socialCharges,totalTax,netAfterTax,netNetYield:purchasePrice>0?Math.round(netAfterTax/purchasePrice*10000)/10000:0,
  frenchTaxAssumptions:{incomeYear:year,regime,socialChargesRate:socialRate,socialRegime,microEligibilityConfirmed:micro,
   allowance:round(allowance),microReferenceThreshold:micro?(regime==='micro_foncier'||regime==='micro_bic_tourism_unclassified'?15000:year===2025?77700:83600):null,
   scope:'Simplified marginal-rate scenario; aggregate household/activity receipts. Micro-BIC eligibility depends on prior years and must be confirmed, not inferred from current receipts. Excludes professional/activity contributions, deficit carryovers, deductible CSG, tax treaties, household progressive-tax calculation and special property regimes.'}
 };
}
