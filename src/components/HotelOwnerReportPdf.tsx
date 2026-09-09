"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Hotel, HotelPeriod } from "@/lib/hotels";
import { periodFields, type PeriodField } from "@/lib/hotel-period";

const s = StyleSheet.create({
  page: { padding: 40, paddingBottom: 70, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4, color: "#0B2447" },
  title: { fontSize: 19, fontWeight: "bold", lineHeight: 1.4, marginTop: 10, marginBottom: 8 },
  scope: { fontSize: 9, marginVertical: 10, padding: 8, backgroundColor: "#F3F4F6" },
  row: { flexDirection: "row", borderBottom: "1 solid #E5E7EB", paddingVertical: 5 },
  label: { width: "65%", paddingRight: 10 },
  value: { width: "35%", textAlign: "right", fontWeight: "bold" },
  footer: { position: "absolute", bottom: 22, left: 40, right: 40, fontSize: 7, color: "#6B7280" },
});

export default function HotelOwnerReportPdf({ hotel, period, groupName, locale, labels }: {
  hotel: Hotel; period: HotelPeriod; groupName: string; locale: string; labels: Record<string, string>;
}) {
  const language = locale === "lb" ? "de-DE" : locale;
  const format = (key: string, n: number | null | undefined) => {
    if (typeof n !== "number" || !Number.isFinite(n) || (key === "occupancy" && (n < 0 || n > 1))) return labels.unknown;
    return new Intl.NumberFormat(language, key === "occupancy"
      ? { style: "percent", maximumFractionDigits: 2 }
      : ["mpi", "ari", "rgi"].includes(key) ? { maximumFractionDigits: 4 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + (key === "occupancy" || ["mpi", "ari", "rgi"].includes(key) ? "" : " EUR");
  };
  const rows: [string, string][] = [...Object.entries(periodFields), ["revpar", "revparAuto"], ["revenue_total", "revenuTotal"]];
  return <Document title={labels.reportTitle} language={locale}>
    <Page size="A4" style={s.page}>
      <Text>{groupName}</Text>
      <Text style={s.title}>{hotel.name}</Text>
      <Text>{labels.reportTitle}</Text>
      <Text>{period.period_label}</Text>
      <Text>{period.period_start} - {period.period_end}</Text>
      <Text>{labels.reportDate} {new Date().toLocaleDateString(language)}</Text>
      <Text style={s.scope}>{labels.historyScope}</Text>
      {rows.map(([key, label]) => <View key={key} style={s.row} wrap={false}>
        <Text style={s.label}>{labels[label]}</Text><Text style={s.value}>{format(key, period[key as PeriodField])}</Text>
      </View>)}
      <View style={{ marginTop: 14 }}><Text style={{ fontWeight: "bold", marginBottom: 6 }}>{labels.notesPlaceholder}</Text><Text>{period.notes || labels.unknown}</Text></View>
      <Text fixed style={s.footer}>{labels.ownerReportInfo}</Text>
    </Page>
  </Document>;
}
