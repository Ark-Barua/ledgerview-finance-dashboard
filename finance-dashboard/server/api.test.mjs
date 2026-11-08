import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "./database.mjs";
import { runDue } from "./scheduler.mjs";
import { forecast } from "../src/utils/schedule.js";
import { createApi } from "./api.mjs";

test("workspace authentication, isolation, durable records and revocation", async t => {
  const directory = mkdtempSync(join(tmpdir(), "ledgerview-test-"));
  const filename = join(directory, "ledger.sqlite");
  let db = openDatabase(filename);
  let api = createApi(db);
  t.after(() => { db.close(); rmSync(directory, { recursive: true }); });
  const password = "my secure test passphrase";
  async function call(path, method = "GET", body = {}, session = {}, headers = {}) {
    const req = Readable.from([Buffer.from(JSON.stringify(body))]);
    Object.assign(req, { url: "/api/" + path, method, socket: { remoteAddress: "local" }, headers: {
      host: "localhost", origin: "http://localhost", "content-type": "application/json", "x-ledger-request": "1",
      "x-ledger-user": String(session.id), cookie: session.cookie, ...headers,
    }});
    const res = { statusCode: 200, headers: {}, setHeader(k,v) { this.headers[k] = v; }, end(s) { this.data = JSON.parse(s); } };
    await api(req, res, () => assert.fail("API path escaped"));
    return { ...res.data, status: res.statusCode, cookie: res.headers["Set-Cookie"]?.split(";")[0],
      flags: res.headers["Set-Cookie"], id: res.data.workspace?.currentUser.id };
  }
  const owner = { name: "Owner", email: "owner@example.test", password };
  const viewer = { name: "Reader", email: "reader@example.test", password, role: "viewer" };
  const row = { account: "Current", category: "Rent", date: "2026-04-01", type: "expense", amount: 13.75 };
  assert.equal((await call("workspace")).workspace, null);
  assert.equal((await call("transactions","POST",row)).status, 401);
  const admin = await call("signup","POST",{ ...owner, legacy: { transactions: [row] } });
  assert.equal(admin.status, 200);
  assert.match(admin.flags, /HttpOnly; SameSite=Strict/);
  assert.equal(admin.workspace.transactions.length, 1);
  assert.equal((await call("signup","POST",owner)).status, 409);
  assert.equal((await call("signin","POST",{...owner,password:"invalid"})).status, 401);
  assert.equal((await call("members","POST",viewer,admin)).status, 200);
  const reader = await call("signin","POST",viewer);
  const personal = { name:"New reader", title:"Analyst", email:viewer.email, avatar:"" };
  assert.equal((await call("profile","PUT",personal,reader)).workspace.currentUser.title,"Analyst");
  assert.equal((await call("profile","PUT",{...personal,email:"change@example.test",password:"wrong"},reader)).status,403);
  const changed = await call("profile","PUT",{...personal,email:"change@example.test",password},reader);
  assert.equal(changed.workspace.currentUser.email,"change@example.test");
  assert.equal((await call("workspace","GET",{},reader)).workspace,null);
  reader.cookie = changed.cookie;
  assert.equal((await call("profile","DELETE",{password},admin)).status,400);
  const budget = {month:"2031-01",category:"Rent",limit:900};
  assert.equal((await call("budgets","POST",budget,reader)).status,403);
  assert.equal((await call("budgets","POST",budget,admin)).status,200);
  assert.equal((await call("budgets","POST",budget,admin)).status,409);
  assert.equal(reader.workspace.currentUser.role, "viewer");
  assert.ok(reader.workspace.reports.length === 0 && reader.workspace.assetWorkflows.length === 0);
  assert.equal((await call("transactions","POST",row,reader)).status, 403);
  assert.equal((await call("members","POST",owner,reader)).status, 403);
  assert.equal((await call("transactions","POST",row,admin,{origin:"https://foreign.test"})).status, 403);
  const created = await call("transactions","POST",row,admin);
  const id = created.workspace.transactions[0].id;
  const outsider = await call("signup","POST",{...owner,email:"other@example.test"});
  for (const kind of ["transactions","workspaceEvents","assetWorkflows","financeNotes","workspaceFiles","documents","reports"]) {
    assert.deepEqual(outsider.workspace[kind], []);
  }
  assert.equal((await call("transactions/"+id,"DELETE",{},outsider)).status, 404);
  assert.equal((await call("transactions/"+id,"PUT",{...row,amount:21},admin)).status, 200);
  assert.equal((await call("reports","POST",{title:"Review",cadence:"Weekly",audience:"Finance"},admin)).status, 200);
  assert.equal((await call("reports","POST",{},admin)).generatedCount, 1);
  const collections = {
    workspaceEvents: { title: "Review", detail: "Quarterly review", type: "info", amount: 0 },
    assetWorkflows: { title: "Budget", status: "Draft", owner: "Finance", summary: "Review allocation" },
    financeNotes: { title: "Memo", content: "Meeting notes" },
    workspaceFiles: { name: "balance.txt", content: "Closing balance" },
  };
  for (const [kind, draft] of Object.entries(collections)) {
    const saved = await call(kind, "POST", draft, admin);
    assert.equal(saved.status, 200);
    const rowId = saved.workspace[kind][0].id;
    assert.equal((await call(kind + "/" + rowId, "DELETE", {}, reader)).status, 403);
    assert.equal((await call(kind + "/" + rowId, "DELETE", {}, admin)).status, 200);
  }
  const creation = await call("documents", "POST", {title:"Minutes",summary:"Review",body:"Open"}, admin);
  const document = creation.workspace.documents[0];
  const edited = await call("documents/" + document.id, "PUT", { ...document, body: "Approved" }, admin);
  assert.equal(edited.workspace.documents.find(row => row.id === document.id).body, "Approved");
  db.close();
  db = openDatabase(filename);
  api = createApi(db);
  const restored = await call("workspace","GET",{},admin);
  assert.equal(restored.workspace.transactions.find(r => r.id === id).amount, 21);
  assert.ok(!JSON.stringify(restored).includes("scrypt-v1"));
  const firstDate = "2091-01-31";
  await call("recurring","POST",{...row,amount:50,cadence:"Monthly",nextDate:firstDate},admin);
  await call("reports","POST",{title:"Scheduled",audience:"Owner",cadence:"Monthly",nextDate:firstDate},admin);
  db.close();
  db = openDatabase(filename);
  api = createApi(db);
  runDue(db,"2091-03-31");
  runDue(db,"2091-03-31");
  const after = (await call("workspace","GET",{},admin)).workspace;
  const postings = after.transactions.filter(t => t.recurringId);
  assert.deepEqual(postings.map(t => t.date),["2091-03-31","2091-02-28",firstDate]);
  const runs = after.reportRuns.filter(r => r.title === "Scheduled");
  assert.equal(runs.length,3);
  assert.equal(runs[0].groups[0].amount - runs[2].groups[0].amount,100);
  assert.equal(forecast(postings,after.recurring,"2091-03-31",[30])[0].balance,-200);
  assert.deepEqual((await call("workspace","GET",{},reader)).workspace.reportRuns,[]);
  assert.equal((await call("profile","DELETE",{password},outsider)).status,409);
  assert.equal((await call("profile","DELETE",{password,deleteWorkspace:"yes"},outsider)).status,200);
  const hashes = db.prepare("SELECT hash FROM users").all();
  assert.equal(new Set(hashes.map(row => row.hash)).size, 2);
  assert.ok(hashes.every(row => row.hash.startsWith("scrypt-v1:") && !row.hash.includes(password)));
  assert.equal((await call("transactions/"+id,"DELETE",{},admin)).status, 200);
  assert.equal((await call("members/"+reader.id,"DELETE",{},admin)).status, 200);
  assert.equal((await call("workspace","GET",{},reader)).workspace, null);
  await call("signout","POST",{},admin);
  assert.equal((await call("workspace","GET",{},admin)).workspace, null);
  db.prepare("UPDATE sessions SET expires=0").run();
  assert.equal((await call("workspace","GET",{},outsider)).workspace, null);
  for (let attempt = 0; attempt < 12; attempt++) {
    await call("signin", "POST", { ...owner, password: "wrong" });
  }
  assert.equal((await call("signin", "POST", owner)).status, 429);
});

