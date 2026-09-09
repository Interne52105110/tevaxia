export const GREEN_KEY_SOURCES = { previous: "https://www.greenkey.global/criteria/2022-2026", next: "https://www.greenkey.global/criteria-20262031", process: "https://www.greenkey.global/certification-process-2026-2031", contact: "https://www.greenkey.global/join-green-key" };
export type GreenKeyRow = { criterion: string; kind: "unknown" | "imperative" | "guideline"; status: "unknown" | "evidence" | "review" | "na"; proof: string };
export type GreenKeyFile = { name: string; version: "" | "2022-2026" | "2026-2031"; scope: string; rows: GreenKeyRow[] };
function text(s: string, max: number, required=true) {if(typeof s!=="string"||s.length>max||required&&!s.trim())throw new RangeError("Required document reference");}
export function validateGreenKeyFile(file: GreenKeyFile) {
 text(file.name,160);text(file.scope,1500);if(!["2022-2026","2026-2031"].includes(file.version))throw new RangeError("Select criteria version");
 if(!Array.isArray(file.rows)||!file.rows.length||file.rows.length>200)throw new RangeError("Invalid rows");
 for(const row of file.rows){text(row.criterion,500);if(!["unknown","imperative","guideline"].includes(row.kind)||!["unknown","evidence","review","na"].includes(row.status))throw new RangeError("Invalid status");text(row.proof,2000,row.status!=="unknown");}
 return file;
}
export function greenKeyFileCsv(file: GreenKeyFile) {
 validateGreenKeyFile(file);const rows:unknown[][]=[["scope","value"],["establishment",file.name],["criteria_version",file.version],["scope_and_operator_reference",file.scope],["criteria_source",file.version==="2022-2026"?GREEN_KEY_SOURCES.previous:GREEN_KEY_SOURCES.next],["notice","Internal evidence register only; no eligibility, conformity or certification decision"],[],["criterion_reference","type","internal_status","proof_or_justification"]];
 for(const row of file.rows)rows.push([row.criterion,row.kind,row.status,row.proof]);
 return "\uFEFF"+rows.map(row=>row.map(v=>'"'+(typeof v==="string"&&/^[=+@\t\r-]/.test(v)?"'"+v:String(v)).replace(/"/g,'""')+'"').join(";")).join("\r\n");
}
