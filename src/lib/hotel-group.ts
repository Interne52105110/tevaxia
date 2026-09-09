import type { Hotel } from "./hotels";
/** All hotels must have a usable figure before a complete group total is shown. */
export function hotelGroupTotals(hotels: Pick<Hotel, "nb_chambres" | "prix_acquisition">[]) {
  return {
    rooms: hotels.every(h => Number.isSafeInteger(h.nb_chambres) && h.nb_chambres > 0)
      ? hotels.reduce((sum, h) => sum + h.nb_chambres, 0) : null,
    acquisition: hotels.every(h => typeof h.prix_acquisition === "number" && Number.isFinite(h.prix_acquisition) && h.prix_acquisition >= 0 && h.prix_acquisition <= 1e12)
      ? hotels.reduce((sum, h) => sum + Math.round(h.prix_acquisition! * 100), 0) / 100 : null,
  };
}
