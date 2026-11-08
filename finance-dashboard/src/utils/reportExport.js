import { downloadTextFile } from "./downloadFile";

const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
export const csvCell = value => {
  let text = String(value ?? "");
  if (/^\s*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"','""') + '"';
};
export function exportRun(run, format) {
  const filename = "ledger-report-" + run.reportId + "-" + run.asOf + "-" + run.id;
  const rows = [["Category","Type","Entries","Amount (INR)"], ...run.groups.map(g => [g.category,g.type,g.entries,g.amount])];
  if (format === "json") return downloadTextFile(filename+".json", JSON.stringify({...run,currency:"INR"},null,2),"application/json");
  if (format === "csv") return downloadTextFile(filename+".csv", [
    ["Report",run.title],["Audience",run.audience],["Through",run.asOf],[],...rows
  ].map(r => r.map(csvCell).join(",")).join("\r\n"),"text/csv;charset=utf-8");
  const html = '<!doctype html><html lang="en"><meta charset="utf-8"><title>'+escapeHtml(run.title)+'</title><style>body{max-width:800px;margin:4em auto;padding:1em;font:16px system-ui;color:#193c30}h1{font:42px Georgia}table{border-collapse:collapse;width:100%}td,th{text-align:left;border-bottom:1px solid #ccc;padding:.65em}</style><h1>'+escapeHtml(run.title)+'</h1><p>'+escapeHtml(run.audience)+' · Ledger through '+escapeHtml(run.asOf)+'</p><table>'+rows.map((row,i) => '<tr>'+row.map(v => i ? '<td>'+escapeHtml(v)+'</td>' : '<th>'+escapeHtml(v)+'</th>').join("")+'</tr>').join("")+'</table></html>';
  downloadTextFile(filename+".html",html,"text/html;charset=utf-8");
}

