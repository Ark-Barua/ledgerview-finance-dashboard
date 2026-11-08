import { atomic, openDatabase, importWorkspace, snapshot } from "./database.mjs";
import { authenticate, emailAddress, insertAccount, newAccount, sessionCookie, sessionUser, throttle } from "./auth.mjs";
import { changeProfile } from "./profile.mjs";
import { generateReport, runDue } from "./scheduler.mjs";
import { collections, record, schedule, today, fail } from "./records.mjs";

async function readBody(req) {
  if (req.headers["content-type"]?.split(";")[0] !== "application/json" || req.headers["x-ledger-request"] !== "1") fail(403, "Invalid request.");
  const origin = req.headers.origin;
  const expectedOrigin = process.env.LEDGERVIEW_ORIGIN || ((req.socket.encrypted ? "https://" : "http://") + req.headers.host);
  if (origin && origin !== expectedOrigin) fail(403, "Origin rejected.");
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 6 * 1024 * 1024) fail(413, "Request exceeds 6 MB.");
    chunks.push(chunk);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks));
    if (body && typeof body === "object" && !Array.isArray(body)) return body;
  } catch { /* Report invalid JSON below. */ }
  fail(400, "Invalid JSON object.");
}
function requireAdmin(user) {
  if (!user) fail(401, "Please sign in.");
  if (user.role !== "admin") fail(403, "Administrator access required.");
}
function change(db, user, kind, id, method, body) {
  const scope = [user.workspace, kind, id];
  if (kind === "members" && method === "DELETE" && id) {
    if (id === user.id) fail(400, "You cannot delete your own account.");
    if (!db.prepare("DELETE FROM users WHERE workspace=? AND id=?").run(user.workspace,id).changes) fail(404, "Member not found.");
    return {};
  }
  if (!collections.includes(kind) || kind === "reportRuns") fail(404, "Unknown resource.");
  if (kind === "reports" && method === "POST" && !id && !Object.keys(body).length) {
    const generatedAt = today();
    const rows = db.prepare("SELECT * FROM records WHERE workspace=? AND kind='reports'").all(user.workspace);
    for (const row of rows) {
      const report = JSON.parse(row.body);
      generateReport(db, row, report, generatedAt);
      db.prepare("UPDATE records SET body=? WHERE id=?").run(JSON.stringify(report),row.id);
    }
    return { generatedAt, generatedCount: rows.length };
  }
  if (kind === "reports" && method === "PUT" && id) {
    const row = db.prepare("SELECT body FROM records WHERE workspace=? AND kind=? AND id=?").get(...scope);
    if (!row) fail(404,"Report not found.");
    const report = JSON.parse(row.body);
    Object.assign(report, body.nextDate ? schedule(body) : { cadence: "Manual", nextDate: null });
    db.prepare("UPDATE records SET body=? WHERE id=?").run(JSON.stringify(report),id);
    return {};
  }
  if (kind === "budgets" && ["POST","PUT"].includes(method)) {
    const budget = record(kind,body,user);
    if (db.prepare("SELECT id FROM records WHERE workspace=? AND kind='budgets' AND json_extract(body,'$.month')=? AND lower(json_extract(body,'$.category'))=lower(?) AND id<>?").get(user.workspace,budget.month,budget.category,id)) fail(409,"A budget already exists for this category and month.");
  }
  if (method === "DELETE" && id) {
    if (!db.prepare("DELETE FROM records WHERE workspace=? AND kind=? AND id=?").run(...scope).changes) fail(404, "Record not found.");
  } else if (method === "PUT" && id && ["transactions","assetWorkflows","documents","budgets"].includes(kind)) {
    if (!db.prepare("UPDATE records SET body=json_patch(body,?) WHERE workspace=? AND kind=? AND id=?").run(JSON.stringify(record(kind, body, user)), ...scope).changes) fail(404, "Record not found.");
  } else if (method === "POST" && !id) {
    db.prepare("INSERT INTO records(workspace,kind,body) VALUES(?,?,?)").run(user.workspace, kind, JSON.stringify(record(kind, body, user)));
  } else fail(405, "Unsupported operation.");
  return {};
}
export function createApi(db = openDatabase()) {
  return async function api(req, res, next) {
    if (!req.url.startsWith("/api/")) return next();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    try {
      const path = req.url.split("?")[0].slice(5);
      const method = req.method;
      const body = method === "GET" ? {} : await readBody(req);
      let user = sessionUser(db, req);
      let result = {};
      if (method === "GET" && path === "workspace") {
        // A missing or expired session returns a signed-out workspace.
      } else if (method === "POST" && ["signin","signup"].includes(path)) {
        throttle(db, "ip:" + req.socket.remoteAddress, 40);
        throttle(db, path + ":" + emailAddress(body.email), 12);
        if (path === "signup") {
          const account = await newAccount(body, "admin");
          user = atomic(db, () => {
            const workspace = Number(db.prepare("INSERT INTO workspaces DEFAULT VALUES").run().lastInsertRowid);
            const owner = insertAccount(db, workspace, account);
            importWorkspace(db, workspace, body.legacy);
            return owner;
          });
        } else user = await authenticate(db, body);
        sessionCookie(db, req, res, user);
      } else if (method === "POST" && path === "signout") {
        sessionCookie(db, req, res, null);
        user = null;
      } else if (path === "profile" && ["PUT","DELETE"].includes(method)) {
        if (!user) fail(401,"Please sign in.");
        if (req.headers["x-ledger-user"] !== String(user.id)) fail(409,"Session changed.");
        user = await changeProfile(db,req,res,user,body);
      } else {
        requireAdmin(user);
        if (req.headers["x-ledger-user"] !== String(user.id)) fail(409, "Your session changed. Refresh the page.");
        if (path === "members" && method === "POST") {
          const account = await newAccount(body, body.role);
          atomic(db, () => {
            const active = sessionUser(db, req);
            requireAdmin(active);
            if (active.id !== user.id) fail(403, "Session changed.");
            insertAccount(db, user.workspace, account);
          });
          result.message = "Member account created.";
        } else {
          const match = /^([a-zA-Z]+)(?:\/([1-9]\d*))?$/.exec(path);
          if (!match) fail(404, "Unknown resource.");
          runDue(db);
          result = atomic(db, () => change(db, user, match[1], Number(match[2]) || 0, method, body));
        }
      }
      if (user && method !== "GET") runDue(db);
      res.end(JSON.stringify({ success: true, workspace: user ? snapshot(db, user) : null, ...result }));
    } catch (error) {
      res.statusCode = error.status || 500;
      if (!error.status) console.error("Ledger API error", error.code || error.name);
      res.end(JSON.stringify({ success: false, message: error.status ? error.message : "Unable to complete the request." }));
    }
  };
}

