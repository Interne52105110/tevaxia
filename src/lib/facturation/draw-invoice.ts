import { rgb, type PDFDocument, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import assets from "./assets/pdf-fonts.json";
import { type FacturXInvoice, computeTotals } from "./factur-x";
import { invoiceDecimalText, invoiceLineAmount } from "./invoice-arithmetic";
import { PDF_LABELS } from "./pdf-labels";

/** Paginated text flow: no slicing or ellipses in invoice data. */
export async function drawInvoice(pdf: PDFDocument, inv: FacturXInvoice, locale: string): Promise<void> {
  const labels = PDF_LABELS[locale] ?? PDF_LABELS.fr;
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(assets.regular, { subset: true });
  const bold = await pdf.embedFont(assets.bold, { subset: true });
  const glyphs = new Set(font.getCharacterSet());
  const navy = rgb(0.06,0.11,0.2), muted = rgb(0.3,0.35,0.4), rule = rgb(0.8,0.83,0.87);
  const width = 515, left = 40, bottom = 65;
  let page = pdf.addPage([595,842]), y = 792;
  const money = (value: number) => new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style:"currency",currency:inv.currency,minimumFractionDigits:2,maximumFractionDigits:2 }).format(value).replace(/[\u00a0\u202f]/g," ");
  const clean = (value: string) => {
    const result = value.replace(/\r\n?/g,"\n").replace(/\t/g,"    ").replace(/[\u00a0\u202f]/g," ");
    for (const character of result) if (character !== "\n" && !glyphs.has(character.codePointAt(0)!)) throw new RangeError(`Unsupported PDF character U+${character.codePointAt(0)!.toString(16).toUpperCase()}`);
    return result;
  };
  const ensure = (height: number) => {
    if (y - height >= bottom) return;
    page = pdf.addPage([595,842]); y = 792;
    page.drawText(labels[inv.document_type], { x:left,y:814,size:9,font:bold,color:muted });
  };
  const write = (value: string, size = 10, face: PDFFont = font) => {
    for (const paragraph of clean(value).split("\n")) {
      let current = "";
      const output = () => { ensure(size*1.5); page.drawText(current,{x:left,y,size,font:face,color:navy});y-=size*1.5;current=""; };
      for (const word of paragraph.split(/( +)/)) {
        if (face.widthOfTextAtSize(current + word,size) <= width) { current += word; continue; }
        if (current) output();
        for (const character of word) {
          if (face.widthOfTextAtSize(current+character,size)>width) output();
          current += character;
        }
      }
      output();
    }
  };
  const section = (title: string) => { ensure(45);y-=10;write(title,12,bold);y-=3; };
  const row = (label: string, value: string, large=false) => {
    const size=large?14:10; ensure(size*1.8);
    page.drawText(clean(label),{x:left,y,size,font:large?bold:font,color:navy});
    const content=clean(value),face=large?bold:font;
    page.drawText(content,{x:left+width-face.widthOfTextAtSize(content,size),y,size,font:face,color:navy});y-=size*1.8;
  };
  write(labels[inv.document_type],24,bold);
  write(`${labels.reference}: ${inv.invoice_number}`,12,bold);
  write(`${labels.issue}: ${inv.issue_date}`);
  if(inv.due_date)write(`${labels.due}: ${inv.due_date}`);
  for(const [label,party] of [[labels.seller,inv.seller],[labels.buyer,inv.buyer]] as const){
    section(label);write(party.name,11,bold);
    for(const value of [party.trading_name,party.address_line1,party.address_line2,[party.postcode,party.city].filter(Boolean).join(" "),party.country_code])if(value)write(value);
    if(party.legal_id)write(`${labels.legal}: ${party.legal_id}`);
    if(party.vat_id)write(`${labels.vat}: ${party.vat_id}`);
    if(party.email||party.phone)write(`${labels.contact}: ${[party.email,party.phone].filter(Boolean).join(" · ")}`);
  }
  if(inv.buyer_reference||inv.contract_reference||inv.purchase_order_reference){
    section(labels.references);
    for(const [label,value] of [[labels.buyerRef,inv.buyer_reference],[labels.contract,inv.contract_reference],[labels.order,inv.purchase_order_reference]])if(value)write(`${label}: ${value}`);
  }
  section(labels.lines);
  inv.lines.forEach((line,index)=>{
    ensure(75);write(`${index+1}. ${line.name}`,11,bold);
    write(`${labels.quantity}: ${invoiceDecimalText(line.quantity)} ${line.unit_code ?? "C62"} · ${labels.price}: ${invoiceDecimalText(line.unit_price_net)} ${inv.currency}`);
    if(line.discount_percent)write(`${labels.discount}: ${invoiceDecimalText(line.discount_percent)} %`);
    write(`${labels.vat}: ${invoiceDecimalText(line.vat_rate_percent)} % · ${labels.category}: ${line.vat_category} · ${labels.net}: ${money(invoiceLineAmount(line))}`);
    if(line.description)write(line.description);
    ensure(10);page.drawLine({start:{x:left,y:y+2},end:{x:left+width,y:y+2},thickness:0.4,color:rule});y-=8;
  });
  const totals=computeTotals(inv);
  section(labels.breakdown);
  for(const group of totals.vat_breakdown)write(`${group.category} · ${invoiceDecimalText(group.rate_percent)} % · ${labels.base}: ${money(group.taxable_amount)} · ${labels.tax}: ${money(group.tax_amount)}`);
  ensure(90);y-=12;row(labels.net,money(totals.line_total));row(labels.tax,money(totals.vat_total));row(labels.gross,money(totals.grand_total),true);
  if(inv.payment_iban||inv.payment_bic||inv.payment_reference||inv.payment_terms){
    section(labels.payment);
    for(const [label,value] of [["IBAN",inv.payment_iban],["BIC",inv.payment_bic],[labels.reference,inv.payment_reference],[labels.terms,inv.payment_terms]])if(value)write(`${label}: ${value}`);
  }
  if(inv.notes?.length){section(labels.notes);for(const note of inv.notes)write(note);}
  const count=pdf.getPageCount();
  pdf.getPages().forEach((p,index)=>{
    p.drawLine({start:{x:left,y:43},end:{x:left+width,y:43},thickness:0.4,color:rule});
    p.drawText(`${labels.generated} · ${labels.entered}`,{x:left,y:29,size:8,font,color:muted});
    const number=`${labels.page} ${index+1} / ${count}`;p.drawText(number,{x:left+width-font.widthOfTextAtSize(number,8),y:16,size:8,font,color:muted});
  });
}
