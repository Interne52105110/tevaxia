"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { RentalLot } from "@/lib/gestion-locative";
import type { RentalPayment } from "@/lib/rental-payments";

interface Props {
  lot: RentalLot;
  landlord: {
    name: string;
    address?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  payment: RentalPayment;
}

const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 65, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4, color: "#0B2447" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, paddingBottom: 10, borderBottom: "1 solid #0B2447" },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  h2: { fontSize: 11, fontWeight: "bold", marginTop: 10, marginBottom: 4, color: "#1B2A4A", textTransform: "uppercase" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  label: { color: "#334155", width: "40%" },
  value: { fontWeight: "bold", color: "#0B2447", width: "60%" },
  highlight: { backgroundColor: "#ECFDF5", padding: 10, borderRadius: 4, marginVertical: 10 },
  highlightAmount: { fontSize: 18, fontWeight: "bold", color: "#047857", textAlign: "center" },
  sig: { marginTop: 30, textAlign: "right" },
});

const MONTHS_FR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];

const fmtEUR = (n: number) => n.toFixed(2).replace(".", ",") + " EUR";

export default function RentReceiptPdf({ lot, landlord, payment }: Props) {
  if(payment.lot_id!==lot.id||payment.status!=="paid"||!payment.paid_at||!landlord.name.trim()||!lot.tenantName?.trim())throw new Error("Receipt requires a settled payment and named parties");
  if(![payment.amount_rent,payment.amount_charges,payment.amount_total].every(n=>typeof n==="number"&&Number.isFinite(n)&&n>=0)||Math.round(payment.amount_total*100)!==Math.round(payment.amount_rent*100)+Math.round(payment.amount_charges*100))throw new Error("Invalid receipt amounts");
  if(!Number.isInteger(payment.period_month)||payment.period_month<1||payment.period_month>12||!Number.isInteger(payment.period_year)||!Number.isFinite(Date.parse(payment.paid_at)))throw new Error("Invalid receipt period");
  const issuedDate=new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Luxembourg"}).format(new Date());
  const paidDate=new Intl.DateTimeFormat("fr-FR",{timeZone:"Europe/Luxembourg"}).format(new Date(payment.paid_at+"T12:00:00Z"));
  const periodLabel = `${MONTHS_FR[payment.period_month - 1]} ${payment.period_year}`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={{width:"62%"}}>
            <Text style={{ fontSize: 11, fontWeight: "bold" }}>{landlord.name}</Text>
            {landlord.address && <Text style={{ fontSize: 9, color: "#334155" }}>{landlord.address}</Text>}
            {landlord.email && <Text style={{ fontSize: 9, color: "#334155" }}>{landlord.email}</Text>}
            {landlord.phone && <Text style={{ fontSize: 9, color: "#334155" }}>{landlord.phone}</Text>}
          </View>
          <View style={{ width:"34%", textAlign: "right" }}>
            <Text style={{ fontSize: 9, color: "#6B7280" }}>Émis le {issuedDate}</Text>
            {payment.paid_at && (
              <Text style={{ fontSize: 9, color: "#6B7280" }}>
                Paiement reçu le {paidDate}
              </Text>
            )}
          </View>
        </View>

        <Text style={s.title}>Quittance de loyer — {periodLabel}</Text>

        <View>
          <Text style={s.h2} minPresenceAhead={30}>Locataire</Text>
          <Text style={{ fontWeight: "bold" }}>{lot.tenantName || "—"}</Text>
          {lot.address && <Text style={{ fontSize: 9 }}>{lot.address}</Text>}
        </View>

        <View>
          <Text style={s.h2} minPresenceAhead={30}>Bien loué</Text>
          <View style={s.row}><Text style={s.label}>Désignation</Text><Text style={s.value}>{lot.name}</Text></View>
          {lot.address && <View style={s.row}><Text style={s.label}>Adresse</Text><Text style={s.value}>{lot.address}</Text></View>}
          {lot.commune && <View style={s.row}><Text style={s.label}>Commune</Text><Text style={s.value}>{lot.commune}</Text></View>}
          <View style={s.row}><Text style={s.label}>Surface</Text><Text style={s.value}>{lot.surface} m²</Text></View>
        </View>

        <View>
          <Text style={s.h2} minPresenceAhead={30}>Période et montants</Text>
          <View style={s.row}><Text style={s.label}>Période</Text><Text style={s.value}>{periodLabel}</Text></View>
          <View style={s.row}><Text style={s.label}>Loyer (hors charges)</Text><Text style={s.value}>{fmtEUR(payment.amount_rent)}</Text></View>
          <View style={s.row}><Text style={s.label}>Provisions sur charges</Text><Text style={s.value}>{fmtEUR(payment.amount_charges)}</Text></View>
          {payment.payment_method && <View style={s.row}><Text style={s.label}>Mode de règlement</Text><Text style={s.value}>{payment.payment_method}</Text></View>}
          {payment.payment_reference && <View style={s.row}><Text style={s.label}>Référence</Text><Text style={s.value}>{payment.payment_reference}</Text></View>}
        </View>

        <View style={s.highlight} wrap={false}>
          <Text style={{ fontSize: 9, color: "#047857", textAlign: "center", marginBottom: 4 }}>
            Reçu, pour valoir quittance du mois de {periodLabel}
          </Text>
          <Text style={s.highlightAmount}>{fmtEUR(payment.amount_total)}</Text>
        </View>

        <Text style={{ fontSize: 9, color: "#334155", marginTop: 10, lineHeight: 1.4 }}>
          Je soussigné(e) <Text style={{ fontWeight: "bold" }}>{landlord.name}</Text>, bailleur du bien désigné ci-dessus,
          reconnais avoir reçu de <Text style={{ fontWeight: "bold" }}>{lot.tenantName || "—"}</Text>,
          locataire, la somme de <Text style={{ fontWeight: "bold" }}>{fmtEUR(payment.amount_total)}</Text> au titre du loyer
          et provisions sur charges du mois de {periodLabel}. La présente quittance libère le locataire pour la période indiquée,
          sous réserve de régularisation annuelle des charges le cas échéant.
        </Text>

        <View style={s.sig} wrap={false}>
          <Text style={{ fontSize: 10, marginBottom: 4 }}>Fait à {lot.commune ?? "Luxembourg"}, le {issuedDate}</Text>
          <Text style={{ fontSize: 10, marginTop: 20 }}>Signature du bailleur</Text>
          <Text style={{ fontSize: 10, color: "#6B7280", marginTop: 20 }}>{landlord.name}</Text>
        </View>

        <Text style={{ position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 7, color: "#6B7280", textAlign: "center" }}>
          Document préparé avec tevaxia.lu à partir des déclarations du bailleur, à vérifier et signer.
          Ce document ne constitue pas une confirmation bancaire du paiement.
        </Text>
      </Page>
    </Document>
  );
}
