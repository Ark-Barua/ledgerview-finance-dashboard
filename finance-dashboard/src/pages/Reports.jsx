import { Download, FileSpreadsheet, Lock, PlayCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatDate } from "../utils/calculateStats";
import { downloadTextFile } from "../utils/downloadFile";

import { csvCell, exportRun } from "../utils/reportExport";

function buildReportsExport(reports) {
  const headers = ["title", "cadence", "audience", "status", "lastRunAt", "runCount"];
  const rows = reports.map((report) => {
    return headers
      .map(header => csvCell(report[header]))
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export default function Reports() {
  const { createReport, deleteReport, reports, reportRuns, role, runReports, scheduleReport } = useFinance();
  const [statusMessage, setStatusMessage] = useState("");

  const [creating, setCreating] = useState(false);

  const [scheduling, setScheduling] = useState(null);
  const [format,setFormat] = useState("csv");

  if (role !== "admin") {
    return (
      <section className="finova-card px-6 py-12 text-center">
        <div className="mx-auto flex max-w-xl flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-[var(--finova-text)]">
            Admin access required
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--finova-muted)]">
            Reports includes generation and scheduling actions that are only
            available to admins.
          </p>
        </div>
      </section>
    );
  }

  const handleDeleteReport = async (reportId) => {
    const shouldDelete = window.confirm(
      "Delete this report template? This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    const deletion = await deleteReport(reportId);
    if (!deletion.success) return;
    setStatusMessage("Report deleted from the workspace.");
  };

  return (
    <section className="space-y-5">
      <section className="finova-card px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-[var(--finova-text)]">
              Reports
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
              Generate, schedule, and export professional reporting packs.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="finova-action-button" onClick={() => setCreating(true)}>Create report</button>
            <button
              className="finova-action-button finova-action-button--primary"
              type="button"
              disabled={!reports.length}
              onClick={async () => {
                const result = await runReports();

                if (!result.success) {
                  setStatusMessage("Report generation failed.");
                  return;
                }

                setStatusMessage(
                  `${result.generatedCount} reports generated on ${formatDate(
                    result.generatedAt,
                  )}.`,
                );
              }}
            >
              <PlayCircle className="h-4 w-4" />
              Run report
            </button>
            <button
              className="finova-action-button"
              type="button"
              disabled={!reports.length}
              onClick={() =>
                downloadTextFile(
                  "ledgerview-reports.csv",
                  buildReportsExport(reports),
                  "text/csv;charset=utf-8;",
                )
              }
            >
              <Download className="h-4 w-4" />
              Export all
            </button>
          </div>
        </div>

        {creating && <form className="mt-5 grid gap-3" onSubmit={async event => {
          event.preventDefault();
          const draft = Object.fromEntries(new FormData(event.currentTarget));
          if (!draft.nextDate) draft.cadence = "Manual";
          const result = await createReport(draft);
          setStatusMessage(result.success ? "Report created." : result.message);
          if (result.success) setCreating(false);
        }}>
          {["Title", "Audience"].map(label => <label key={label} className="grid gap-1 text-sm">
            {label}<input required maxLength={200} name={label.toLowerCase()} className="h-11 border border-[var(--finova-border)] px-3" />
          </label>)}
          <label>Frequency <select name="cadence" defaultValue="Weekly"><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label>
          <label>First scheduled date (UTC, optional) <input type="date" name="nextDate" min={new Date().toISOString().slice(0,10)} /></label>
          <div className="flex gap-3"><button className="finova-action-button" type="submit">Save report</button>
            <button className="finova-action-button" type="button" onClick={() => setCreating(false)}>Cancel</button></div>
        </form>}
        {!reports.length && !creating && <p className="mt-4 text-sm">No reports yet.</p>}
        <div className="mt-4 min-h-6 text-sm text-[var(--finova-accent)]">
          {statusMessage || null}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {reports.map((reportItem) => (
          <article key={reportItem.id} className="finova-card px-5 py-5">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
              <FileSpreadsheet className="h-4 w-4" />
            </div>

            <p className="mt-4 text-base font-semibold text-[var(--finova-text)]">
              {reportItem.title}
            </p>
            <p className="mt-2 text-sm text-[var(--finova-muted)]">
              Cadence: {reportItem.cadence}
            </p>
            <p className="mt-1 text-sm text-[var(--finova-muted)]">
              Audience: {reportItem.audience}
            </p>
            <p className="mt-1 text-sm text-[var(--finova-muted)]">
              Status: {reportItem.status}
            </p>
            <p className="mt-1 text-sm text-[var(--finova-muted)]">
              Last run:{" "}
              {reportItem.lastRunAt ? formatDate(reportItem.lastRunAt) : "Never"}
            </p>
            <p className="mt-1 text-sm text-[var(--finova-muted)]">
              Run count: {reportItem.runCount}
            </p>

            <p className="mt-2 text-sm">Next scheduled run: {reportItem.nextDate ? formatDate(reportItem.nextDate) + " UTC" : "Manual only"}</p>
            <button className="finova-action-button mt-3" onClick={() => setScheduling(scheduling === reportItem.id ? null : reportItem.id)}>Change schedule</button>
            {scheduling === reportItem.id && <form className="desk-panel mt-2" onSubmit={async e => {
              e.preventDefault(); const draft = Object.fromEntries(new FormData(e.currentTarget));
              const result = await scheduleReport(reportItem.id,draft); if (result.success) setScheduling(null);
            }}><label>Frequency <select name="cadence" defaultValue={reportItem.cadence}><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label>
              <label>Next date (UTC) <input required type="date" name="nextDate" min={new Date().toISOString().slice(0,10)} defaultValue={reportItem.nextDate || ""} /></label>
              <button className="finova-action-button">Save schedule</button>
              {reportItem.nextDate && <button type="button" onClick={async () => { if ((await scheduleReport(reportItem.id,{nextDate:null})).success) setScheduling(null); }}>Stop schedule</button>}
            </form>}
            <button
              className="finova-action-button finova-action-button--danger finova-action-button--sm mt-5"
              type="button"
              onClick={() => handleDeleteReport(reportItem.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </article>
        ))}
      </div>
      <section className="desk-panel"><header><h2>Generated reports</h2><label>Export format <select value={format} onChange={e => setFormat(e.target.value)}>
        <option value="csv">CSV</option><option value="json">JSON</option><option value="html">Printable HTML</option></select></label></header>
        {!reportRuns.length && <p>Run a report to capture a dated summary of income and expenses by category.</p>}
        {reportRuns.map(run => <div className="plan-row" key={run.id}><div><strong>{run.title}</strong><p>Through {formatDate(run.asOf)} · {run.groups.reduce((n,g) => n+g.entries,0)} transactions</p></div>
          <button className="finova-action-button" onClick={() => exportRun(run,format)}>Download {format.toUpperCase()}</button></div>)}
      </section>
    </section>
  );
}
