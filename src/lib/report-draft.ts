/** Export the rendered draft, including collapsed sections and live control values. */
export function buildReportDraftHtml(root:HTMLElement,labels:{title:string;empty:string;checked:string;unchecked:string;locale:string}):string {
 const clone=root.cloneNode(true) as HTMLElement;
 const sources=Array.from(root.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('input,textarea,select'));
 const targets=Array.from(clone.querySelectorAll('input,textarea,select'));
 sources.forEach((source,index)=>{
  const value=source instanceof HTMLInputElement&&source.type==='checkbox'?(source.checked?labels.checked:labels.unchecked):source instanceof HTMLSelectElement?(source.value?source.selectedOptions[0]?.textContent??source.value:labels.empty):(source.value||labels.empty);
  const answer=document.createElement('span');answer.className='draft-answer';answer.textContent=value;targets[index].replaceWith(answer);
 });
 clone.querySelectorAll('[data-export-omit],svg').forEach(node=>node.remove());
 clone.querySelectorAll('[data-export-title]').forEach(node=>{const heading=document.createElement('h2');heading.textContent=Array.from(node.children).map(child=>child.textContent).join(" ");node.replaceWith(heading)});
 clone.querySelectorAll('button').forEach(node=>node.remove());
 clone.querySelectorAll('[hidden]').forEach(node=>node.removeAttribute('hidden'));
 clone.removeAttribute('hidden');
 const doc=document.implementation.createHTMLDocument(labels.title);doc.documentElement.lang=labels.locale;
 const meta=doc.createElement('meta');meta.setAttribute('charset','utf-8');doc.head.prepend(meta);
 const style=doc.createElement('style');style.textContent='body{font:16px/1.5 Arial,sans-serif;color:#1b2a4a;max-width:960px;margin:32px auto;padding:0 24px}h1{font-size:28px}h2{font-size:22px;border-bottom:1px solid #bbb;padding-top:24px}h4{font-size:17px}h4 span{margin-right:8px}[class*="flex justify-between"]{display:flex;justify-content:space-between;gap:16px}p,label{display:block;margin:10px 0}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{padding:8px;border:1px solid #ddd;text-align:left}.draft-answer{display:block;white-space:pre-wrap;overflow-wrap:anywhere;padding:8px;border-left:3px solid #c8a951;background:#f8f7f4}a{color:#1b2a4a}input,textarea,select,button,svg{display:none}@media print{body{margin:0;max-width:none;font-size:11pt}[data-report-section]{break-before:page}h2,h4{break-after:avoid}[data-report-section="1"]{break-before:auto}p,label{margin:5px 0}.draft-answer{padding:5px;break-inside:auto}.space-y-1,[class*="border-card-border/50 pt-4"]{break-inside:avoid}}';doc.head.append(style);
 const title=doc.createElement('h1');title.textContent=labels.title;doc.body.append(title,clone);
 return '<!doctype html>\n'+doc.documentElement.outerHTML;
}
export function downloadReportDraft(root:HTMLElement,labels:Parameters<typeof buildReportDraftHtml>[1]){
 const blob=new Blob([buildReportDraftHtml(root,labels)],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='tevaxia-brouillon-dossier.html';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
