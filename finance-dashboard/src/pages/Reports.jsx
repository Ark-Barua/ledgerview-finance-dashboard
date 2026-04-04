import { Download, FileSpreadsheet, Lock, PlayCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatDate } from "../utils/calculateStats";
import { downloadTextFile } from "../utils/downloadFile";

function buildReportsExport(reports) {
  const headers = ["title", "cadence", "audience", "status", "lastRunAt", "runCount"];
  const rows = reports.map((report) => {
    return headers
      .map((header) => `"${`${report[header] ?? ""}`.replaceAll('"', '""')}"`)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export default function Reports() {
  const { deleteReport, reports, role, runReports } = useFinance();
  const [statusMessage, setStatusMessage] = useState("");

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

  const handleDeleteReport = (reportId) => {
    const shouldDelete = window.confirm(
      "Delete this report template? This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    deleteReport(reportId);
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
            <button
              className="finova-action-button finova-action-button--primary"
              type="button"
              onClick={() => {
                const result = runReports();

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
    </section>
  );
}
