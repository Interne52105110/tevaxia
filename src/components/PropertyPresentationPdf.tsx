"use client";
import {generateEnergyAuditPdf,type EnergyAuditReport} from './energy/EnergyAuditPdf';
import {bankingMoney} from '@/lib/banking-basics';
export interface PropertyPresentationProps {
  locale: string;
  labels: Record<string,string>;
  auditLabels: Record<string,string>;
  insulationClass?: string;
  // Agency branding
  agencyName?: string;
  agencyLogo?: string;
  agentName?: string;
  agentContact?: string;
  // Property
  title: string;
  propertyType: string;
  address: string;
  commune: string;
  surface: number;
  nbRooms?: number;
  nbBedrooms?: number;
  energyClass?: string;
  parking?: boolean;
  yearBuilt?: number;
  description?: string;
  // Price & estimation
  askingPrice: number;
  estimatedValue?: number;
  estimationLow?: number;
  estimationHigh?: number;
  pricePerSqm?: number;
  // Financing
  downPayment?: number;
  loanAmount?: number;
  loanRate?: number;
  loanDuration?: number;
  monthlyPayment?: number;
  // Acquisition fees
  acquisitionFees?: number;
  registrationDuties?: number;
  notaryFees?: number;
  // Features / amenities (bullets)
  features?: string[];
}

export function buildPropertyPresentationReport(p:PropertyPresentationProps):EnergyAuditReport {
 const t=(k:string)=>p.labels[k],a=(k:string)=>p.auditLabels[k],money=(n:number)=>bankingMoney(n,p.locale);
 const num=(n:number)=>new Intl.NumberFormat(p.locale==='lb'?'de-DE':p.locale,{maximumFractionDigits:2}).format(n);
 const rows=(entries:[string,string|undefined][])=>entries.filter((e):e is [string,string]=>e[1]!==undefined).map(([label,value])=>({label,value}));
 const sections:EnergyAuditReport['sections']=[
 {title:t('sectionAgency'),rows:rows([[t('fieldAgencyName'),p.agencyName],[t('fieldAgentName'),p.agentName],[t('fieldAgentContact'),p.agentContact]])},
 {title:p.title,text:[p.address,p.commune].filter(Boolean).join(', '),rows:[{label:t('fieldAsking'),value:money(p.askingPrice)},{label:t('fieldSurface'),value:num(p.surface)+' m²'},{label:'€/m²',value:money(p.askingPrice/p.surface)}]},
 {title:t('sectionProperty'),rows:rows([[t('fieldType'),p.propertyType],[t('fieldNbRooms'),p.nbRooms===undefined?undefined:num(p.nbRooms)],[t('fieldNbBedrooms'),p.nbBedrooms===undefined?undefined:num(p.nbBedrooms)],[t('fieldYearBuilt'),p.yearBuilt===undefined?undefined:String(p.yearBuilt)],[t('fieldParking'),p.parking===undefined?undefined:a(p.parking?'yes':'no')]])},
 {title:t('fieldEnergy'),text:a('energyNote'),rows:[{label:t('fieldEnergy'),value:p.energyClass||a('unknown')},{label:a('insulation'),value:p.insulationClass||a('unknown')}]},
 ];
 if(p.description)sections.push({title:t('fieldDesc'),text:p.description});
 if(p.features?.length)sections.push({title:t('fieldFeatures'),text:p.features.join('\n')});
 if(p.estimatedValue!==undefined)sections.push({title:a('valuation'),keepTogether:true,text:a('valuationNote'),rows:rows([[a('valuation'),money(p.estimatedValue)],[a('lower'),p.estimationLow===undefined?undefined:money(p.estimationLow)],[a('upper'),p.estimationHigh===undefined?undefined:money(p.estimationHigh)]])});
 if(p.acquisitionFees!==undefined)sections.push({title:a('feesTotal'),keepTogether:true,text:a('feesScope'),rows:rows([[a('registration'),p.registrationDuties===undefined?undefined:money(p.registrationDuties)],[a('notary'),p.notaryFees===undefined?undefined:money(p.notaryFees)],[a('feesTotal'),money(p.acquisitionFees)]])});
 if(p.loanAmount!==undefined)sections.push({title:t('toggleFinancing'),keepTogether:true,text:a('financeNote'),rows:rows([[t('finDownLabel'),p.downPayment===undefined?undefined:money(p.downPayment)],[t('finLoanLabel'),money(p.loanAmount)],[t('fieldRate'),p.loanRate===undefined?undefined:num(p.loanRate)+' %'],[t('fieldDuration'),p.loanDuration===undefined?undefined:p.loanDuration+' '+t('durationSuffix')],[t('finMonthlyLabel'),p.monthlyPayment===undefined?undefined:money(p.monthlyPayment)],[a('cash'),p.downPayment===undefined||p.acquisitionFees===undefined?undefined:money(p.downPayment+p.acquisitionFees)]])});
 sections.push({title:t('usageTitle'),text:a('scope')});
 return {title:t('pageTitle'),sections,sources:['https://www.notariat.lu/notaire/reglement-revision-tarifs','https://pfi.public.lu/fr/citoyen/enregistrement/tarif.html','https://guichet.public.lu/fr/citoyens/logement/acquisition/performances-energie/demande-passeport-energetique.html']};
}
export async function generatePropertyPresentationPdfBlob(p:PropertyPresentationProps):Promise<Blob>{return generateEnergyAuditPdf(buildPropertyPresentationReport(p));}
