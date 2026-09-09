import snapshot from './data/house-price-index-eurostat.json';
/** Published annual national observations; no current-year forecast or monthly interpolation. */
export const HOUSE_PRICE_INDEX=snapshot.rows;
export const HOUSE_PRICE_INDEX_SOURCE=snapshot;
