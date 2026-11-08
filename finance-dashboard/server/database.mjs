import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { isLegacySample, removeSeededBatches } from "./legacy-samples.mjs";
import { collections, record, fail } from "./records.mjs";

export function openDatabase(filename = process.env.LEDGERVIEW_DB || join(homedir(), ".ledgerview", "ledger.sqlite")) {
  if (filename !== ":memory:") mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA busy_timeout=5000;
    PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS workspaces(id INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, workspace INTEGER NOT NULL REFERENCES workspaces(id),
      name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK(role IN ('admin','viewer')), hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS records(id INTEGER PRIMARY KEY AUTOINCREMENT, workspace INTEGER NOT NULL REFERENCES workspaces(id), kind TEXT NOT NULL, body TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS records_scope ON records(workspace,kind);
    CREATE TABLE IF NOT EXISTS profiles(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, avatar TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
  `);
  atomic(db, () => {
    if (db.prepare("PRAGMA user_version").get().user_version === 0) {
      removeSeededBatches(db);
      db.exec("PRAGMA user_version=1");
    }
  });
  return db;
}
export function atomic(db, run) {
  db.exec("BEGIN IMMEDIATE");
  try { const result = run(); db.exec("COMMIT"); return result; }
  catch (error) { db.exec("ROLLBACK"); throw error; }
}
export function importWorkspace(db, workspace, legacy = {}) {
  if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) fail(400, "Invalid workspace import.");
  const insert = db.prepare("INSERT INTO records(workspace,kind,body) VALUES(?,?,?)");
  for (const kind of collections.filter(kind => !["recurring","budgets","reportRuns"].includes(kind))) {
    const rows = legacy[kind] ?? [];
    if (!Array.isArray(rows) || rows.length > 20000) fail(400, "Invalid workspace collection.");
    for (const row of rows) {
      if (!row || typeof row !== "object") fail(400, "Invalid workspace record.");
      const normalized = record(kind, row, null, true);
      if (!isLegacySample(kind, row.id, normalized)) insert.run(workspace, kind, JSON.stringify(normalized));
    }
  }
}
export function snapshot(db, user) {
  const result = Object.fromEntries(collections.map(key => [key, []]));
  const rows = db.prepare("SELECT id,kind,body FROM records WHERE workspace=? AND (?='admin' OR kind NOT IN ('assetWorkflows','reports','reportRuns')) ORDER BY id DESC").all(user.workspace, user.role);
  for (const row of rows) result[row.kind].push({ ...JSON.parse(row.body), id: row.id });
  result.workspaceUsers = db.prepare("SELECT id,name,email,role FROM users WHERE workspace=? ORDER BY id").all(user.workspace);
  const profile = db.prepare("SELECT title,avatar FROM profiles WHERE user_id=?").get(user.id) ?? { title: "", avatar: "" };
  return { ...result, currentUser: { ...profile, id: user.id, name: user.name, email: user.email, role: user.role } };
}

