import {validateDcfLease,type Lease} from './dcf-leases';
const HEADERS=['locataire','surface','loyerAnnuel','dateDebut','dateFin','dateBreak','indexation','ervM2','probabiliteRenouvellement','franchiseMois','fitOutContribution','chargesLocataire','stepRents'] as const;
function csvRows(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const delimiter = text.slice(0, text.search(/[\r\n]/) < 0 ? text.length : text.search(/[\r\n]/)).includes(";") ? ";" : text.split(/[\r\n]/)[0].includes("\t") ? "\t" : ",";
  const rows: string[][] = []; let row: string[] = [], field = "", quoted = false, closed = false;
  const pushField = () => { row.push(field.trim()); field = ""; closed = false; };
  const pushRow = () => { pushField(); if (row.some(f => f !== "")) rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else field += ch;
    } else if (ch === delimiter) pushField();
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; pushRow(); }
    else if (ch === '"' && field.trim() === "" && !closed) { field = ""; quoted = true; }
    else if (ch === '"' || (closed && ch.trim())) throw new Error("Malformed CSV");
    else field += ch;
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  pushRow(); return rows;
}

export function parseDcfLeasesCsv(text:string):Lease[]{
 if(text.length>2_000_000)throw new Error('CSV too large');
 const rows=csvRows(text),headers=rows.shift();
 if(!headers||rows.length<1||rows.length>100||HEADERS.filter(h=>!['dateBreak','fitOutContribution','stepRents'].includes(h)).some(h=>headers.filter(v=>v===h).length!==1)||new Set(headers).size!==headers.length||headers.some(h=>!HEADERS.includes(h as typeof HEADERS[number])))throw new Error('Invalid CSV header or row count');
 return rows.map((row,i)=>{
  if(row.length!==headers.length)throw new Error('Invalid CSV row '+(i+2));
  const get=(h:string)=>headers.includes(h)?row[headers.indexOf(h)]:'';
  const number=(h:string,optional=false)=>{const v=get(h).replace(/[\u00a0\u202f ]/g,'').replace(',','.');if(optional&&v==='')return 0;if(!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v))throw new Error('Invalid CSV number at row '+(i+2));return Number(v)};
  let steps:Lease['stepRents'];try{steps=get('stepRents')?JSON.parse(get('stepRents')):undefined;if(steps&&!Array.isArray(steps))throw new Error('steps')}catch{throw new Error('Invalid rent steps at row '+(i+2))}
  const lease:Lease={id:'csv-'+i,locataire:get('locataire'),surface:number('surface'),loyerAnnuel:number('loyerAnnuel'),dateDebut:get('dateDebut'),dateFin:get('dateFin'),dateBreak:get('dateBreak')||undefined,indexation:number('indexation'),ervM2:number('ervM2'),probabiliteRenouvellement:number('probabiliteRenouvellement'),franchiseMois:number('franchiseMois'),fitOutContribution:number('fitOutContribution',true),chargesLocataire:number('chargesLocataire'),stepRents:steps};
  validateDcfLease(lease);return lease;
 });
}
export const dcfCsvCell=(value:string|number)=>'"'+String(typeof value==='string'&&/^[=+@-]/.test(value)?"'"+value:value).replace(/"/g,'""')+'"';
export function dcfLeasesCsv(leases:Lease[]):string{
 return '\uFEFF'+[HEADERS.join(';'),...leases.map(l=>HEADERS.map(h=>dcfCsvCell(h==='stepRents'?JSON.stringify(l.stepRents??[]):l[h]??'')).join(';'))].join('\r\n');
}
