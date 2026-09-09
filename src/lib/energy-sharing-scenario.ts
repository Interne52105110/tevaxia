export interface EnergySharingInput {
  production: number; consumption: number; shared: number; participants: number;
  avoidedPrice: number; sharingPrice: number; residualCharges: number; exportPrice: number;
  investment: number; confirmedAid: number; annualCosts: number;
}
export function calculateEnergySharing(i: EnergySharingInput) {
  for (const key of Object.keys(ENERGY_SHARING_EXAMPLE) as (keyof EnergySharingInput)[]) {
    const value = i[key];
    if (!Number.isFinite(value) || (key !== "exportPrice" && value < 0)) throw new Error("Invalid input");
  }
  if (!Number.isInteger(i.participants) || i.participants < 1 || i.participants > 10000) throw new Error("Invalid participants");
  if ([i.production,i.consumption,i.shared,i.investment,i.confirmedAid,i.annualCosts].some(n=>n>1e9)) throw new Error("Input too large");
  if ([i.avoidedPrice,i.sharingPrice,i.residualCharges].some(n=>n>10) || Math.abs(i.exportPrice)>10) throw new Error("Invalid tariff");
  if (i.shared > Math.min(i.production,i.consumption) || i.confirmedAid > i.investment) throw new Error("Inconsistent totals");
  const surplus = i.production-i.shared;
  const consumerSavings = i.shared*(i.avoidedPrice-i.sharingPrice-i.residualCharges);
  const internalPayment = i.shared*i.sharingPrice;
  const exportRevenue = surplus*i.exportPrice;
  const producerCash = internalPayment+exportRevenue-i.annualCosts;
  const collectiveBenefit = consumerSavings+producerCash;
  const netInvestment = i.investment-i.confirmedAid;
  const payback = (flow:number) => netInvestment === 0 ? 0 : flow > 0 ? netInvestment/flow : null;
  return {surplus,consumerSavings,internalPayment,exportRevenue,producerCash,collectiveBenefit,netInvestment,
    selfConsumptionPct:i.production>0?100*i.shared/i.production:0,
    demandCoveredPct:i.consumption>0?100*i.shared/i.consumption:0,
    averageConsumerSavings:consumerSavings/i.participants,
    producerPayback:payback(producerCash),collectivePayback:payback(collectiveBenefit)};
}
export const ENERGY_SHARING_EXAMPLE:EnergySharingInput={production:28500,consumption:27000,shared:14000,participants:6,
  avoidedPrice:.28,sharingPrice:.15,residualCharges:.02,exportPrice:.07,investment:42120,confirmedAid:0,annualCosts:500};
