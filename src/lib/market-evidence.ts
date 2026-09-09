import type {MarketDataCommune} from './market-data';
export const MARKET_OBSERVATIONS=[
 ['prixM2Existant','existing','money'],['prixM2VEFA','vefa','money'],['prixM2Annonces','asking','money'],['loyerM2Annonces','rent','money'],
 ['nbTransactions','salesCount','count'],['nbVEFA','vefaCount','count'],['nbAnnonces','askingCount','count'],['nbLocations','rentCount','count'],
] as const;
export const MARKET_EVIDENCE_LABELS=['title','scope','ratioScope','existing','vefa','asking','rent','salesCount','vefaCount','askingCount','rentCount','unpublished','period','publication','sources','sourceSales','sourceAsking','sourceRent','sourceAdjusted','ratioTitle','pdfTitle'] as const;
export type MarketEvidenceLabels=Record<typeof MARKET_EVIDENCE_LABELS[number],string>;
export function marketObservationRows(market:MarketDataCommune){
 return MARKET_OBSERVATIONS.map(([field,label,unit])=>({field,label,unit,value:market[field]}));
}
