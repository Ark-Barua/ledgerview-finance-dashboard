import { atomic } from "./database.mjs";
import { today } from "./records.mjs";
import { nextOccurrence } from "../src/utils/schedule.js";

export function generateReport(db, row, report, asOf) {
  const groups = db.prepare(`SELECT json_extract(body,'$.category') AS category, json_extract(body,'$.type') AS type,
    COUNT(*) AS entries, SUM(CAST(ROUND(json_extract(body,'$.amount')*100) AS INTEGER)) AS cents
    FROM records WHERE workspace=? AND kind='transactions' AND json_extract(body,'$.date')<=?
    GROUP BY category,type ORDER BY category,type`).all(row.workspace, asOf);
  const summary = { title: report.title, audience: report.audience, reportId: row.id, asOf,
    groups: groups.map(({ category,type,entries,cents }) => ({ category,type,entries,amount:cents/100 })) };
  db.prepare("INSERT INTO records(workspace,kind,body) VALUES(?,'reportRuns',?)").run(row.workspace, JSON.stringify(summary));
  report.lastRunAt = asOf;
  report.runCount++;
  report.status = "Generated";
}

export function runDue(db, asOf = today()) {
  atomic(db, () => {
    const due = db.prepare(`SELECT * FROM records WHERE kind IN ('recurring','reports')
      AND json_extract(body,'$.nextDate') <= ? ORDER BY CASE kind WHEN 'recurring' THEN 0 ELSE 1 END, id`).all(asOf);
    const insert = db.prepare("INSERT INTO records(workspace,kind,body) VALUES(?,'transactions',?)");
    const update = db.prepare("UPDATE records SET body=? WHERE id=?");
    for (const row of due) {
      const rule = JSON.parse(row.body);
      while (rule.nextDate <= asOf) {
        if (row.kind === "recurring") {
          const { account, category, amount, type } = rule;
          insert.run(row.workspace, JSON.stringify({ account, category, amount, type, date: rule.nextDate, recurringId: row.id }));
        } else generateReport(db, row, rule, rule.nextDate);
        rule.nextDate = nextOccurrence(rule.nextDate, rule.cadence, rule.anchorDay);
      }
      update.run(JSON.stringify(rule), row.id);
    }
  });
}

export function startScheduler(db) {
  runDue(db);
  const timer = setInterval(() => {
    try { runDue(db); } catch (error) { console.error("Scheduled ledger update failed", error.message); }
  }, 60000);
  timer.unref();
  return () => clearInterval(timer);
}

