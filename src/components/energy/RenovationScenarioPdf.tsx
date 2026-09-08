"use client";
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { CoverPage, PageHeader, Footer, generateRef } from './EnergyPdf';
import type { RenovationScenarioInput, RenovationScenarioResult } from '@/lib/renovation-scenario';
interface Copy {title:string;scope:string;assumptions:string;labels:Record<string,string>;results:{label:string;value:string}[]}
const s=StyleSheet.create({page:{paddingTop:50,paddingBottom:60,paddingHorizontal:40,fontFamily:'Inter',fontSize:9,color:'#1B2A4A'},h:{fontSize:13,fontWeight:700,marginTop:16,marginBottom:10},p:{fontSize:8,lineHeight:1.5,color:'#475569',marginBottom:12},row:{flexDirection:'row',justifyContent:'space-between',gap:12,paddingVertical:5,borderBottomWidth:.5,borderBottomColor:'#e2e8f0'},label:{flex:1},val:{textAlign:'right',fontWeight:600},cell:{flex:1,textAlign:'right'},header:{fontWeight:700}});
const euro=(n:number)=>`${n.toFixed(2)} EUR`;
export async function generateScenarioPdf(input:RenovationScenarioInput,result:RenovationScenarioResult,copy:Copy):Promise<Blob>{
 const ref=generateRef();
 const unit=(key:string)=>key.endsWith('Pct')?' %':key.endsWith('Ans')||key==='anneeVersementAides'?'':' EUR';
 return pdf(<Document>
  <CoverPage title={copy.title} subtitle={`${input.horizonAns} ans`} value={euro(result.coutNetAides)} date={new Date().toLocaleDateString('fr-FR')} reference={ref}/>
  <Page size="A4" style={s.page}><PageHeader title={copy.title} reference={ref}/><Text style={s.h}>{copy.labels.results}</Text>
   {copy.results.map((row,i)=><View key={i} style={s.row} wrap={false}><Text style={s.label}>{row.label}</Text><Text style={s.val}>{row.value}</Text></View>)}
   <Text style={{...s.p,marginTop:16}}>{copy.scope}</Text><Text style={s.p}>{copy.assumptions}</Text>
   <Text style={s.h}>{copy.labels.inputs}</Text>{Object.entries(input).map(([key,value])=><View key={key} style={s.row} wrap={false}><Text style={s.label}>{copy.labels[key]}</Text><Text style={s.val}>{value.toLocaleString('fr-FR')}{unit(key)}</Text></View>)}
   {input.montantPret>0&&<><Text style={s.h}>{copy.labels.payment}</Text><Text style={s.p}>{euro(result.mensualite)} / mois · {copy.labels.interestCost} : {euro(result.interetsPret)} · {copy.labels.cashAfterDebt} : {euro(result.soldeAnnuelApresCredit)}</Text></>}
   <Footer/>
  </Page>
  <Page size="A4" style={s.page}><PageHeader title={copy.title} reference={ref}/><Text style={s.h}>{copy.labels.schedule}</Text>
   <View style={s.row} fixed>{['year','flow','cumulative','discounted'].map(key=><Text key={key} style={{...s.cell,...s.header}}>{copy.labels[key]}</Text>)}</View>
   <View style={s.row} wrap={false}><Text style={s.cell}>0</Text><Text style={s.cell}>{euro(-result.besoinInitial)}</Text><Text style={s.cell}>{euro(-result.besoinInitial)}</Text><Text style={s.cell}>{euro(-result.besoinInitial)}</Text></View>
   {result.flux.map(row=><View key={row.annee} style={s.row} wrap={false}><Text style={s.cell}>{row.annee}</Text><Text style={s.cell}>{euro(row.flux)}</Text><Text style={s.cell}>{euro(row.cumule)}</Text><Text style={s.cell}>{euro(row.actualise)}</Text></View>)}
   <Text style={{...s.p,marginTop:16}}>Klimabonus : https://guichet.public.lu/fr/citoyens/aides/logement-construction/klimabonus-2026/renovation-energetique-logement.html</Text><Footer/>
  </Page>
 </Document>).toBlob();
}
