"use client";
import {Document,Page,Text,View,StyleSheet,pdf} from "@react-pdf/renderer";
import {PageHeader,Footer,generateRef} from "./EnergyPdf";
export interface EnergyAuditReport {title:string;sections:{title:string;keepTogether?:boolean;text?:string;rows?:{label:string;value:string}[]}[];sources:string[]}
const s=StyleSheet.create({page:{paddingTop:42,paddingHorizontal:40,paddingBottom:55,fontFamily:"Inter",fontSize:10,color:"#1B2A4A"},h:{fontSize:13,fontWeight:700,marginTop:15,marginBottom:8},p:{fontSize:9,lineHeight:1.5,marginBottom:8},row:{flexDirection:"row",gap:16,paddingVertical:5,borderBottomWidth:.5,borderBottomColor:"#e2e8f0"},label:{flex:1},value:{width:135,textAlign:"right"},source:{fontSize:7,lineHeight:1.5,marginBottom:6}});
export async function generateEnergyAuditPdf(report:EnergyAuditReport):Promise<Blob>{
 const clean=(value:string)=>value.replace(/[\u00a0\u202f]/g," ");
 report={...report,title:clean(report.title),sections:report.sections.map(section=>({...section,title:clean(section.title),text:section.text?clean(section.text):undefined,rows:section.rows?.map(row=>({label:clean(row.label),value:clean(row.value)}))}))};
 const ref=generateRef();
 return pdf(<Document><Page size="A4" style={s.page}><PageHeader title={report.title} reference={ref}/>
  {report.sections.map((section,index)=><View key={index} wrap={!section.keepTogether}><Text style={s.h} minPresenceAhead={35}>{section.title}</Text>
   {section.text&&<Text style={s.p}>{section.text}</Text>}
   {section.rows?.map((row,j)=><View key={j} style={s.row} wrap={false}><Text style={s.label}>{row.label}</Text><Text style={s.value}>{row.value}</Text></View>)}
  </View>)}
  <Text style={s.h}>Sources / Links</Text>{report.sources.map(source=><Text key={source} style={s.source}>{source}</Text>)}<Footer/>
 </Page></Document>).toBlob();
}
