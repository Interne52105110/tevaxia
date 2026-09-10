import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InspectionMeta, InspectionState, RoomSection } from "@/lib/rental-inspection";

const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingHorizontal: 36, paddingBottom: 72, fontSize: 10, fontFamily: "Helvetica", color: "#0B2447" },
  title: { fontSize: 17, fontWeight: "bold", marginBottom: 8 },
  meta: { marginBottom: 5 },
  notice: { fontSize: 9, backgroundColor: "#f1f5f9", padding: 8, marginVertical: 8 },
  heading: { fontSize: 12, fontWeight: "bold", marginTop: 12, marginBottom: 5 },
  item: { borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", paddingVertical: 4 },
  itemTitle: { fontSize: 9, fontWeight: "bold" },
  notes: { fontSize: 9, color: "#475569", marginTop: 3 },
  signatures: { marginTop: 20, flexDirection: "row", justifyContent: "space-between" },
  signature: { width: "46%", borderTopWidth: 1, borderTopColor: "#334155", paddingTop: 5, paddingBottom: 44, fontSize: 9 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#64748b", textAlign: "center" },
});

export interface RentalInspectionPdfProps {
  meta: InspectionMeta;
  locale: string;
  sections: RoomSection[];
  notesGeneral: string;
  stateLabels: Record<InspectionState, string>;
  labels: { title: string; landlord: string; tenant: string; keysMeters: string; obsGeneral: string; signLandlord: string; signTenant: string; footer: string; draft: string; progress: string; scope: string };
}

function splitNotes(notes: string): [string, string] {
  if (notes.length <= 180) return [notes, ""];
  const boundary = notes.indexOf(" ", 160);
  const end = boundary >= 0 && boundary <= 220 ? boundary : 180;
  return [notes.slice(0, end), notes.slice(end)];
}

export default function RentalInspectionPdf({ meta, locale, sections, notesGeneral, stateLabels, labels }: RentalInspectionPdfProps) {
  const [generalStart, generalRest] = splitNotes(notesGeneral);
  return <Document title={labels.title} language={locale} author="Tevaxia">
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{labels.title}</Text>
      <Text style={styles.meta}>{[meta.lotName, meta.address, meta.date].filter(Boolean).join(" - ")}</Text>
      <Text style={styles.meta}>{labels.landlord}</Text>
      <Text style={styles.meta}>{labels.tenant}</Text>
      <Text style={styles.notice}>{labels.draft}{"\n"}{labels.progress}{"\n"}{labels.scope}</Text>
      <Text style={styles.meta}>{labels.keysMeters}</Text>
      {sections.flatMap(section => section.items.flatMap((item, index) => {
          const [start, rest] = splitNotes(item.notes);
          return [
            <View key={`${section.id}-${item.id}-header`} style={styles.item} wrap={false}>
              {index === 0 && <Text style={styles.heading}>{section.name}</Text>}
              <Text style={styles.itemTitle}>{item.label} : {stateLabels[item.state]}</Text>
              {start.trim() && <Text style={styles.notes}>{start}</Text>}
            </View>,
            rest.trim() ? <Text key={`${section.id}-${item.id}-notes`} style={styles.notes} orphans={2} widows={2}>{rest}</Text> : null,
          ];
        }))}
      {notesGeneral.trim() && <View wrap={false}><Text style={styles.heading}>{labels.obsGeneral}</Text><Text style={styles.notes}>{generalStart}</Text></View>}
      {generalRest.trim() && <Text style={styles.notes} orphans={2} widows={2}>{generalRest}</Text>}
      <View style={styles.signatures} wrap={false}>
        <View style={styles.signature}><Text>{labels.signLandlord}</Text><Text>{meta.bailleur}</Text></View>
        <View style={styles.signature}><Text>{labels.signTenant}</Text><Text>{meta.locataire}</Text></View>
      </View>
      <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => `${labels.footer}\n${pageNumber} / ${totalPages}`} />
    </Page>
  </Document>;
}
