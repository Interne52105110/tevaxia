import { describe, expect, it } from "vitest";
import { hotelGroupTotals } from "./hotel-group";
describe("hotel group totals", () => {
  it("does not present incomplete purchase prices as zero CAPEX", () => {
    expect(hotelGroupTotals([{ nb_chambres: 20, prix_acquisition: null }, { nb_chambres: 10, prix_acquisition: 200 }])).toEqual({ rooms: 30, acquisition: null });
  });
  it("retains a real zero purchase price and sums cents", () => {
    expect(hotelGroupTotals([{ nb_chambres: 20, prix_acquisition: 0 }, { nb_chambres: 10, prix_acquisition: .1 }, { nb_chambres: 1, prix_acquisition: .2 }])).toEqual({ rooms: 31, acquisition: .3 });
  });
  it("treats legacy unspecified rooms and invalid amounts as unknown", () => {
    for (const price of [-1, NaN, Infinity]) expect(hotelGroupTotals([{ nb_chambres: 0, prix_acquisition: price }])).toEqual({ rooms: null, acquisition: null });
    expect(hotelGroupTotals([{ nb_chambres: 1.5, prix_acquisition: 10 }]).rooms).toBeNull();
  });
});
