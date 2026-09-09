// Invoice PDF/A container with embedded fonts, sRGB output intent and declared XMP extension.
// Validate both this container and its CII payload; neither replaces fiscal or platform-specific checks.
import { PDFDocument, PDFName, PDFHexString, AFRelationship } from "pdf-lib";
import assets from "./assets/pdf-fonts.json";
import type { FacturXInvoice } from "./factur-x";
import { buildFacturXCiiXml } from "./factur-x";
import { drawInvoice } from "./draw-invoice";
import { PDF_LABELS } from "./pdf-labels";

// ============================================================
// Rendu visuel PDF
// ============================================================

async function embedFacturXml(pdf: PDFDocument, xml: string, filename = "factur-x.xml"): Promise<void> {
  const xmlBytes = new TextEncoder().encode(xml);
  await pdf.attach(xmlBytes, filename, {
    mimeType: "application/xml",
    description: "Facture électronique Factur-X (EN 16931 CII)",
    creationDate: new Date(),
    modificationDate: new Date(),
    afRelationship: AFRelationship.Alternative,
  });
}

const xmlText = (value: string) => value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
function buildXmpMetadata(inv: FacturXInvoice, now: string, title: string): string {
  const profileUrn = (() => {
    switch (inv.profile) {
      case "MINIMUM": return "MINIMUM";
      case "BASIC_WL": return "BASIC WL";
      case "BASIC": return "BASIC";
      case "EN_16931": return "EN 16931";
      case "EXTENDED": return "EXTENDED";
    }
  })();
  return `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="tevaxia-factur-x">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
      xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${xmlText(title)}</rdf:li></rdf:Alt></dc:title>
      <dc:creator><rdf:Seq><rdf:li>${xmlText(inv.seller.name)}</rdf:li></rdf:Seq></dc:creator>
      <dc:format>application/pdf</dc:format>
      <pdf:Producer>tevaxia.lu Factur-X</pdf:Producer>
      <xmp:CreatorTool>tevaxia.lu</xmp:CreatorTool>
      <xmp:CreateDate>${now}</xmp:CreateDate>
      <xmp:ModifyDate>${now}</xmp:ModifyDate>
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      <fx:DocumentType>INVOICE</fx:DocumentType>
      <fx:DocumentFileName>factur-x.xml</fx:DocumentFileName>
      <fx:Version>1.0</fx:Version>
      <fx:ConformanceLevel>${profileUrn}</fx:ConformanceLevel>
    </rdf:Description>
    <rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
      <pdfaExtension:schemas><rdf:Bag><rdf:li rdf:parseType="Resource">
        <pdfaSchema:schema>Factur-X PDF/A Extension Schema</pdfaSchema:schema>
        <pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
        <pdfaSchema:prefix>fx</pdfaSchema:prefix>
        <pdfaSchema:property><rdf:Seq>${["DocumentType","DocumentFileName","Version","ConformanceLevel"].map(name=>`<rdf:li rdf:parseType="Resource"><pdfaProperty:name>${name}</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>Factur-X ${name}</pdfaProperty:description></rdf:li>`).join("")}</rdf:Seq></pdfaSchema:property>
      </rdf:li></rdf:Bag></pdfaExtension:schemas>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

// ============================================================
// Public API
// ============================================================

export interface FacturXArtifacts {
  pdfBytes: Uint8Array;
  xml: string;
  pdfFilename: string;
  xmlFilename: string;
}

export async function generateFacturXPdf(inv: FacturXInvoice, options: { locale?: string } = {}): Promise<FacturXArtifacts> {
  const locale = options.locale && PDF_LABELS[options.locale] ? options.locale : "fr";
  const title = `${PDF_LABELS[locale][inv.document_type]} ${inv.invoice_number}`;
  const xml = buildFacturXCiiXml(inv);
  const pdf = await PDFDocument.create();
  const generatedAt = new Date(Math.floor(Date.now() / 1000) * 1000);

  pdf.setTitle(title);
  pdf.setLanguage(locale);
  pdf.setAuthor(inv.seller.name);
  pdf.setProducer("tevaxia.lu Factur-X");
  pdf.setCreator("tevaxia.lu");
  pdf.setCreationDate(generatedAt);
  pdf.setModificationDate(generatedAt);
  const fileId = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2,"0")).join("");
  pdf.context.trailerInfo.ID = pdf.context.obj([PDFHexString.of(fileId), PDFHexString.of(fileId)]);
  const iccBytes = Uint8Array.from(atob(assets.srgb), character => character.charCodeAt(0));
  const outputProfile = pdf.context.register(pdf.context.flateStream(iccBytes, { N: 3 }));
  pdf.catalog.set(PDFName.of("OutputIntents"), pdf.context.obj([pdf.context.obj({ Type: "OutputIntent", S: "GTS_PDFA1", OutputConditionIdentifier: PDFHexString.fromText("sRGB"), Info: PDFHexString.fromText("sRGB"), DestOutputProfile: outputProfile })]));

  await drawInvoice(pdf, inv, locale);
  await embedFacturXml(pdf, xml);

  // Métadonnées XMP Factur-X (tag custom dans catalogue)
  const xmp = buildXmpMetadata(inv, generatedAt.toISOString(), title);
  const catalog = pdf.catalog;
  const xmpStream = pdf.context.stream(new TextEncoder().encode(xmp), {
    Type: "Metadata",
    Subtype: "XML",
  });
  const xmpRef = pdf.context.register(xmpStream);
  catalog.set(PDFName.of("Metadata"), xmpRef);

  const pdfBytes = await pdf.save();
  const safeNum = inv.invoice_number.replace(/[^A-Za-z0-9_-]/g, "_");

  return {
    pdfBytes,
    xml,
    pdfFilename: `facture-${safeNum}.pdf`,
    xmlFilename: `facture-${safeNum}.xml`,
  };
}
