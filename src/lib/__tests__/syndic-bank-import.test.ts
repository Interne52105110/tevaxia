import { describe, it, expect } from "vitest";
import {
  parseBankStatement, matchTransactions,
  type UnpaidChargeForMatch,
} from "../syndic-bank-import";

describe("parseBankStatement", () => {
  it("parse un CSV générique LU", () => {
    const csv = `Date;Montant;Libellé;Référence;Contrepartie
15/03/2026;850,00;Virement COPRO-A12-2026-03;COPRO-A12-2026-03;DUPONT Jean
15/03/2026;-1200,00;Paiement fournisseur XYZ;;
20/03/2026;850,00;COPRO-B05-2026-03;;SCHMITZ Anna`;
    const r = parseBankStatement(csv);
    expect(r.total).toBe(3);
    expect(r.credits).toBeCloseTo(1700, 2);
    expect(r.debits).toBeCloseTo(1200, 2);
  });
  it("détecte BOM UTF-8 et parse malgré tout", () => {
    const r = parseBankStatement("\uFEFFDate;Montant\n15/03/2026;100,00");
    expect(r.total).toBe(1);
  });
  it("convertit date DD/MM/YYYY en ISO YYYY-MM-DD", () => {
    const r = parseBankStatement("Date;Montant\n15/03/2026;100,00");
    expect(r.transactions[0].date).toBe("2026-03-15");
  });
  it("parse montant avec espace et virgule décimale", () => {
    const r = parseBankStatement("Date;Montant\n15/03/2026;1 250,50");
    expect(r.transactions[0].amount).toBe(1250.5);
  });
});

describe("matchTransactions", () => {
  const charges: UnpaidChargeForMatch[] = [
    {
      charge_id: "c1", unit_id: "u1", lot_number: "A12",
      owner_name: "Jean Dupont",
      amount_due: 850, amount_paid: 0, outstanding: 850,
      payment_reference: "COPRO-A12-2026-03",
      call_label: "T1 2026",
    },
    {
      charge_id: "c2", unit_id: "u2", lot_number: "B05",
      owner_name: "Anna Schmitz",
      amount_due: 850, amount_paid: 0, outstanding: 850,
      payment_reference: "COPRO-B05-2026-03",
      call_label: "T1 2026",
    },
  ];

  it("match par référence exacte + montant exact → score élevé", () => {
    const txs = [{
      date: "2026-03-15", amount: 850,
      label: "Virement reçu", reference: "COPRO-A12-2026-03",
      counterparty: "Jean Dupont", raw: {},
    }];
    const r = matchTransactions(txs, charges);
    expect(r[0].matched_charge?.charge_id).toBe("c1");
    expect(r[0].match_score).toBeGreaterThanOrEqual(90);
  });

  it("match par montant + nom dans libellé", () => {
    const txs = [{
      date: "2026-03-15", amount: 850,
      label: "virement dupont jean",
      reference: null, counterparty: null, raw: {},
    }];
    const r = matchTransactions(txs, charges);
    expect(r[0].matched_charge?.charge_id).toBe("c1");
    expect(r[0].match_score).toBeGreaterThanOrEqual(30);
  });

  it("débit sortant ignoré", () => {
    const txs = [{
      date: "2026-03-15", amount: -500,
      label: "Achat fournisseur", reference: null, counterparty: null, raw: {},
    }];
    const r = matchTransactions(txs, charges);
    expect(r).toHaveLength(0);
  });

  it("pas de match si référence bidon et montant différent", () => {
    const txs = [{
      date: "2026-03-15", amount: 123,
      label: "random", reference: "UNKNOWN-REF", counterparty: null, raw: {},
    }];
    const r = matchTransactions(txs, charges);
    expect(r[0].matched_charge).toBeNull();
  });

  it("1 charge ne peut être matchée qu'à 1 transaction", () => {
    const txs = [
      { date: "2026-03-15", amount: 850, label: "", reference: "COPRO-A12-2026-03", counterparty: null, raw: {} },
      { date: "2026-03-16", amount: 850, label: "", reference: "COPRO-A12-2026-03", counterparty: null, raw: {} },
    ];
    const r = matchTransactions(txs, charges);
    expect(r.filter((x) => x.matched_charge?.charge_id === "c1")).toHaveLength(1);
  });
});
