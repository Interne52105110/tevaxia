"use client";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceRecord } from "@/lib/pms/invoice-record";
const s = StyleSheet.create({
 page: { padding: 36, paddingBottom: 65, fontFamily: "Helvetica", fontSize: 9, lineHeight: 1.4, color: "#152744" },
 title: { fontSize: 21, fontWeight: "bold", marginBottom: 10 },
 section: { fontSize: 12, fontWeight: "bold", marginTop: 14, marginBottom: 6 },
 scope: { padding: 10, backgroundColor: "#edf2f7", marginVertical: 10 },
 row: { flexDirection: "row", borderBottom: "0.5 solid #d8dee8", paddingVertical: 6 },
 name: { width: "34%", paddingRight: 6 }, cell: { width: "22%", textAlign: "right", paddingLeft: 5 },
 total: { marginTop: 12, padding: 10, backgroundColor: "#edf2f7" },
 footer: { position: "absolute", bottom: 22, left: 36, right: 36, fontSize: 7, color: "#526174", borderTop: "0.5 solid #d8dee8", paddingTop: 5 },
});
const clean = (v: string) => v.replace(/[\u2011\u2013\u2014]/g, "-").replace(/[\u00a0\u202f]/g, " ");
export function PmsInvoiceDocument({ record, labels, locale, generatedAt }: { record: InvoiceRecord; labels: Record<string,string>; locale: string; generatedAt: string }) {
 const { invoice: inv, property: p, rows } = record;
 const t = (key: string) => clean(labels[key] ?? key);
 const money = (n: number) => clean(new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency: inv.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n));
 const detail = (key: string, value: string | null | undefined) => <Text>{t(key)}: {clean(value || t("missing"))}</Text>;
 return <Document title={`${t("title")} - ${inv.invoice_number}`} language={locale}>
  <Page size="A4" style={s.page}>
   <Text style={s.title}>{t("title")}</Text>
   {detail("number",inv.invoice_number)}{detail("type",t(inv.invoice_type))}
   {detail("state",`${t(inv.issued ? "issued" : "draft")} / ${t(inv.paid ? "paid" : "unpaid")}`)}
   {detail("issueDate",inv.issue_date)}{detail("dueDate",inv.due_date)}{detail("generated",generatedAt + " UTC")}
   <Text style={s.scope}>{t("scope")}</Text>
   <Text style={s.section}>{t("property")}</Text><Text>{clean(p.name)}</Text>
   <Text>{clean([p.address,p.postal_code,p.commune,p.country].filter(Boolean).join(" · ") || t("missing"))}</Text>
   <Text>{clean([p.vat_number,p.registration_number,p.email,p.phone].filter(Boolean).join(" · "))}</Text>
   <Text style={s.section}>{t("customer")}</Text><Text>{clean(inv.customer_name)}</Text>
   <Text>{clean(inv.customer_address || t("missing"))}</Text>{inv.customer_vat_number && <Text>{clean(inv.customer_vat_number)}</Text>}
   <View wrap={false}><Text style={s.section}>{t("groups")}</Text>
    <View style={s.row}><Text style={s.name}>{t("category")}</Text>{["ht","vat","gross"].map(key=><Text key={key} style={s.cell}>{t(key)}</Text>)}</View>
    {rows.map(row=><View key={row.key} style={s.row}><Text style={s.name}>{t(row.key)}</Text><Text style={s.cell}>{money(row.ht)}</Text><Text style={s.cell}>{money(row.vat)}</Text><Text style={s.cell}>{money(row.gross)}</Text></View>)}
   </View>
   <View style={s.total} wrap={false}>
    <Text>{t("ht")}: {money(Number(inv.total_ht))}</Text><Text>{t("vat")}: {money(Number(inv.total_tva))}</Text>
    <Text>{t("tax")}: {money(Number(inv.taxe_sejour))}</Text><Text style={{fontWeight:"bold"}}>{t("total")}: {money(Number(inv.total_ttc))}</Text>
   </View>
   <Text style={s.scope}>{t("amountScope")}</Text>
   {inv.notes && <><Text style={s.section} minPresenceAhead={30}>{t("notes")}</Text><Text>{clean(inv.notes)}</Text></>}
   {inv.legal_footer && <><Text style={s.section} minPresenceAhead={30}>{t("terms")}</Text><Text>{clean(inv.legal_footer)}</Text></>}
   <Text fixed style={s.footer}>{t("title")} · {clean(inv.invoice_number)}</Text>
  </Page>
 </Document>;
}
export async function generatePmsInvoiceBlob(record: InvoiceRecord, labels: Record<string,string>, locale: string, generatedAt: string): Promise<Blob> {
 const { pdf } = await import("@react-pdf/renderer");
 return pdf(<PmsInvoiceDocument record={record} labels={labels} locale={locale} generatedAt={generatedAt} />).toBlob();
}
