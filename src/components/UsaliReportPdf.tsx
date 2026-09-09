"use client";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { MonthlyJournal, JournalRow } from "@/lib/pms/monthly-journal";

const s = StyleSheet.create({
  page: { padding: 36, paddingBottom: 65, fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.4, color: "#152744" },
  title: { fontSize: 20, fontWeight: "bold", lineHeight: 1.35, marginBottom: 8 },
  subtitle: { fontSize: 12, marginBottom: 6 },
  section: { fontSize: 13, fontWeight: "bold", marginTop: 16, marginBottom: 8 },
  note: { padding: 10, backgroundColor: "#f1f5f9", marginTop: 10, marginBottom: 8, fontSize: 9 },
  row: { flexDirection: "row", borderBottom: "0.5 solid #d8dee8", paddingVertical: 5 },
  head: { backgroundColor: "#152744", color: "white", fontWeight: "bold", paddingVertical: 7 },
  label: { width: "36%", paddingHorizontal: 5 },
  count: { width: "10%", textAlign: "right", paddingHorizontal: 3 },
  amount: { width: "18%", textAlign: "right", paddingHorizontal: 3 },
  total: { backgroundColor: "#edf2f7", fontWeight: "bold" },
  pair: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottom: "0.5 solid #d8dee8" },
  footer: { position: "absolute", bottom: 22, left: 36, right: 36, fontSize: 7, color: "#526174", borderTop: "0.5 solid #d8dee8", paddingTop: 5 },
});
// Built-in Helvetica supports these locales; normalise unsupported punctuation.
const clean = (text: string) => text.replace(/[\u2011\u2013\u2014]/g, "-").replace(/[\u202f\u00a0]/g, " ");
export default function UsaliReportPdf({ report: r, labels, locale }: { report: MonthlyJournal; labels: Record<string, string>; locale: string }) {
  const t = (key: string) => clean(labels[key] ?? key);
  const nf = new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale);
  const mf = new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (n: number) => clean(mf.format(n));
  const label = (category: string) => clean(labels[`cat_${category}`] ?? labels[category] ?? category);
  const head = <View style={[s.row, s.head]}><Text style={s.label}>{t("category")}</Text><Text style={s.count}>{t("count")}</Text>{["ht", "vat", "gross"].map(k => <Text key={k} style={s.amount}>{t(k)}</Text>)}</View>;
  const row = (r: JournalRow, total = false) => <View key={r.category} wrap={false} style={total ? [s.row, s.total] : s.row}><Text style={s.label}>{label(r.category)}</Text><Text style={s.count}>{nf.format(r.count)}</Text><Text style={s.amount}>{money(r.ht)}</Text><Text style={s.amount}>{money(r.vat)}</Text><Text style={s.amount}>{money(r.gross)}</Text></View>;
  const header = <><Text style={s.title}>{t("title")}</Text><Text style={s.subtitle}>{clean(r.propertyName)}</Text><Text>{r.start} - {r.end} · UTC</Text></>;
  const footer = <Text style={s.footer} fixed>{t("title")} · {r.start} · UTC</Text>;
  return <Document title={`${t("title")} - ${clean(r.propertyName)} - ${r.start}`} language={locale}>
    <Page size="A4" style={s.page}>{header}<Text style={s.note}>{t("scope")}</Text><Text style={s.section}>{t("journal")}</Text>{head}{row(r.operating, true)}{row(r.taxes, true)}{row(r.total, true)}<Text style={s.note}>{t("pdfScope")}</Text>
      <Text style={s.section}>{t("inventory")}</Text><Text>{t("inventoryScope")}</Text>
      {[["coverage", `${r.recordedDays} / ${r.days}`], ["closedDays", nf.format(r.closedDays)], ["available", nf.format(r.available)], ["occupied", nf.format(r.occupied)], ["occupancy", r.occupancy == null ? t("unknown") : nf.format(r.occupancy) + " %"]].map(([key, value]) => <View key={key} style={s.pair} wrap={false}><Text style={{ width: "68%" }}>{t(key)}</Text><Text>{clean(value)}</Text></View>)}{footer}
    </Page>
    <Page size="A4" style={s.page}>{header}<Text style={s.section}>{t("journal")}</Text>{head}{r.rows.map(r => row(r))}{r.rows.length === 0 && <Text style={s.note}>{t("empty")}</Text>}<Text style={s.note}>{t("pdfScope")}</Text>{footer}</Page>
    {r.audits.length > 0 && <Page size="A4" style={s.page}>{header}<Text style={s.section}>{t("inventory")}</Text><Text style={{ marginBottom: 12 }}>{t("inventoryScope")}</Text><View style={[s.row, s.head]}>{["date", "available", "occupied", "closed"].map(key => <Text key={key} style={{ width: "25%", paddingHorizontal: 4 }}>{t(key)}</Text>)}</View>{r.audits.map(a => <View key={a.audit_date} style={s.row} wrap={false}><Text style={{ width: "25%" }}>{a.audit_date}</Text><Text style={{ width: "25%" }}>{nf.format(a.total_rooms)}</Text><Text style={{ width: "25%" }}>{nf.format(a.occupied_rooms)}</Text><Text style={{ width: "25%" }}>{t(a.closed ? "closed" : "open")}</Text></View>)}{footer}</Page>}
  </Document>;
}
