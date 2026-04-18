"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface Props {
  agency: {
    name: string;
    address?: string | null;
    agent_name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  buyer: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    id_number?: string;
  };
  property: {
    address: string;
    commune?: string | null;
    type?: string | null;
    surface_m2?: number | null;
    reference?: string | null;
    price?: number | null;
  };
  visit: {
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    duration_minutes: number;
    notes?: string;
  };
}

const s = StyleSheet.create({
  page: { padding: 50, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.6, color: "#0B2447" },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    borderBottom: "1 solid #0B2447", paddingBottom: 10, marginBottom: 20,
  },
  agencyName: { fontSize: 13, fontWeight: "bold" },
  agencyMeta: { fontSize: 9, color: "#475569", marginTop: 2 },
  title: { fontSize: 18, fontWeight: "bold", textAlign: "center", marginVertical: 20 },
  subtitle: { fontSize: 10, textAlign: "center", color: "#475569", marginBottom: 30 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 10, fontWeight: "bold", textTransform: "uppercase",
    color: "#1B2A4A", paddingBottom: 3, marginBottom: 8,
    borderBottom: "0.5 solid #CBD5E1",
  },
  row: { flexDirection: "row", paddingVertical: 2 },
  label: { width: "40%", color: "#64748B" },
  value: { flex: 1, fontWeight: "bold" },
  box: {
    border: "0.5 solid #CBD5E1", padding: 12, borderRadius: 2,
    marginTop: 5, marginBottom: 12, backgroundColor: "#F8FAFC",
  },
  legal: {
    marginTop: 16, padding: 10, backgroundColor: "#FEF9C3",
    fontSize: 9, color: "#713F12", lineHeight: 1.5,
  },
  signatures: {
    flexDirection: "row", justifyContent: "space-between",
    marginTop: 30, gap: 40,
  },
  signatureBlock: {
    flex: 1, borderTop: "1 solid #94A3B8", paddingTop: 6,
    fontSize: 9, color: "#475569",
  },
  signatureBold: { fontSize: 11, fontWeight: "bold", color: "#0B2447", marginBottom: 4 },
  footer: {
    position: "absolute", bottom: 30, left: 50, right: 50,
    fontSize: 7, color: "#94A3B8", textAlign: "center",
  },
});

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-LU", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
};

const fmtEUR = (n: number): string =>
  Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " EUR";

export default function VisitReceiptPdf({ agency, buyer, property, visit }: Props) {
  return (
    <Document title={`Bon de visite — ${property.address} — ${buyer.last_name}`}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.agencyName}>{agency.name}</Text>
            {agency.address && <Text style={s.agencyMeta}>{agency.address}</Text>}
            {(agency.email || agency.phone) && (
              <Text style={s.agencyMeta}>
                {agency.email}{agency.email && agency.phone ? " · " : ""}{agency.phone}
              </Text>
            )}
          </View>
          <View>
            <Text style={{ fontSize: 9, color: "#64748B", textAlign: "right" }}>
              {fmtDate(visit.date)}
            </Text>
            {property.reference && (
              <Text style={{ fontSize: 9, color: "#64748B", textAlign: "right", marginTop: 2 }}>
                Réf. {property.reference}
              </Text>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>BON DE VISITE</Text>
        <Text style={s.subtitle}>
          Loi du 28 décembre 1988 réglementant l&apos;accès aux professions immobilières
        </Text>

        {/* Acquéreur */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Visiteur (acquéreur potentiel)</Text>
          <View style={s.box}>
            <View style={s.row}>
              <Text style={s.label}>Nom, prénom</Text>
              <Text style={s.value}>{buyer.last_name.toUpperCase()}, {buyer.first_name}</Text>
            </View>
            {buyer.email && (
              <View style={s.row}>
                <Text style={s.label}>Email</Text>
                <Text style={s.value}>{buyer.email}</Text>
              </View>
            )}
            {buyer.phone && (
              <View style={s.row}>
                <Text style={s.label}>Téléphone</Text>
                <Text style={s.value}>{buyer.phone}</Text>
              </View>
            )}
            {buyer.id_number && (
              <View style={s.row}>
                <Text style={s.label}>Pièce d&apos;identité</Text>
                <Text style={s.value}>{buyer.id_number}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bien visité */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Bien visité</Text>
          <View style={s.box}>
            <View style={s.row}>
              <Text style={s.label}>Adresse</Text>
              <Text style={s.value}>{property.address}</Text>
            </View>
            {property.commune && (
              <View style={s.row}>
                <Text style={s.label}>Commune</Text>
                <Text style={s.value}>{property.commune}</Text>
              </View>
            )}
            {property.type && (
              <View style={s.row}>
                <Text style={s.label}>Type de bien</Text>
                <Text style={s.value}>{property.type}</Text>
              </View>
            )}
            {property.surface_m2 != null && (
              <View style={s.row}>
                <Text style={s.label}>Surface habitable</Text>
                <Text style={s.value}>{property.surface_m2} m²</Text>
              </View>
            )}
            {property.price != null && (
              <View style={s.row}>
                <Text style={s.label}>Prix de présentation</Text>
                <Text style={s.value}>{fmtEUR(property.price)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Visite */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Visite effectuée</Text>
          <View style={s.box}>
            <View style={s.row}>
              <Text style={s.label}>Date</Text>
              <Text style={s.value}>{fmtDate(visit.date)}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Heure</Text>
              <Text style={s.value}>{visit.time} ({visit.duration_minutes} minutes)</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Agent accompagnateur</Text>
              <Text style={s.value}>{agency.agent_name ?? agency.name}</Text>
            </View>
            {visit.notes && (
              <View style={[s.row, { marginTop: 4 }]}>
                <Text style={s.label}>Observations</Text>
                <Text style={s.value}>{visit.notes}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Mention légale */}
        <View style={s.legal}>
          <Text>
            Le visiteur reconnaît avoir été mis en présence du bien par l&apos;intermédiaire
            de l&apos;agence susnommée. En cas d&apos;acquisition de ce bien — directement
            auprès du propriétaire ou par l&apos;intermédiaire d&apos;un tiers — dans les
            12 mois suivant la présente visite, la commission d&apos;agence reste due
            conformément au règlement grand-ducal du 4 juillet 2000.
          </Text>
        </View>

        {/* Signatures */}
        <View style={s.signatures}>
          <View style={s.signatureBlock}>
            <Text style={s.signatureBold}>Le visiteur</Text>
            <Text>Lu et approuvé</Text>
            <Text style={{ marginTop: 30, fontStyle: "italic" }}>
              Signature :
            </Text>
          </View>
          <View style={s.signatureBlock}>
            <Text style={s.signatureBold}>L&apos;agent</Text>
            <Text>{agency.agent_name ?? agency.name}</Text>
            <Text style={{ marginTop: 30, fontStyle: "italic" }}>
              Signature :
            </Text>
          </View>
        </View>

        <Text style={s.footer}>
          {agency.name} · Bon de visite généré le {new Date().toLocaleString("fr-LU")}
          · Durée validité commerciale 12 mois
        </Text>
      </Page>
    </Document>
  );
}
