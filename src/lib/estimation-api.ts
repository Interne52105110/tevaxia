import type {EstimationInput} from './estimation';
import {AJUST_ETAGE,AJUST_ETAT,AJUST_EXTERIEUR} from './adjustments';
export const ESTIMATION_API_DEFAULTS={nbChambres:0,typeBien:'appartement',estNeuf:false,parking:false,etage:'adjEtage2e3eRef',etat:'adjEtatBonRef',exterieur:'adjExtBalconRef',classeEnergie:'D'} as const;
export const ESTIMATION_API_METHOD='municipal_mean_with_unvalidated_assumptions';
export const ESTIMATION_API_LIMITS='Indicative freehold apartment estimate. Conventional range, not a statistical confidence interval. No individual sale comparables. See /transparence.';
export function parseEstimationApiInput(raw:unknown):EstimationInput{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new RangeError('JSON object required');
 const body=raw as Record<string,unknown>,allowed=['commune','quartier','surface',...Object.keys(ESTIMATION_API_DEFAULTS)];
 if(Object.keys(body).some(k=>!allowed.includes(k)))throw new RangeError('Unknown fields: use the documented EstimationInput field names');
 const i:Record<string,unknown>={...ESTIMATION_API_DEFAULTS,...body};
 if(typeof i.commune!=='string'||!i.commune.trim()||i.commune.length>200)throw new RangeError('commune must be a non-empty string');
 if(typeof i.surface!=='number'||!Number.isFinite(i.surface)||i.surface<=0||i.surface>10000)throw new RangeError('surface must be a positive number <= 10000');
 if(i.quartier!==undefined&&(typeof i.quartier!=='string'||i.quartier.length>200))throw new RangeError('quartier must be a string');
 if(typeof i.nbChambres!=='number'||!Number.isInteger(i.nbChambres)||i.nbChambres<0||i.nbChambres>20)throw new RangeError('nbChambres must be an integer from 0 to 20');
 if(typeof i.parking!=='boolean'||typeof i.estNeuf!=='boolean')throw new RangeError('parking and estNeuf must be JSON booleans');
 if(i.typeBien!=='appartement')throw new RangeError('Only freehold apartments are supported');
 if(typeof i.classeEnergie!=='string'||!['A','B','C','D','E','F','G'].includes(i.classeEnergie))throw new RangeError('classeEnergie must be A to G; other classes have no adjustment in this model');
 if(!AJUST_ETAGE.some(a=>a.labelKey===i.etage)||!AJUST_ETAT.some(a=>a.labelKey===i.etat)||!AJUST_EXTERIEUR.some(a=>a.labelKey===i.exterieur))throw new RangeError('Use documented etage, etat and exterieur adjustment keys');
 return {...i,commune:i.commune.trim()} as EstimationInput;
}
