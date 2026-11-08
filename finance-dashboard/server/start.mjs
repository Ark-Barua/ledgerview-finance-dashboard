import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { openDatabase } from "./database.mjs";
import { startScheduler } from "./scheduler.mjs";
import { createApi } from "./api.mjs";

const dist = new URL("../dist/", import.meta.url);
await readFile(new URL("index.html", dist));
const db = openDatabase();
const stopScheduler = startScheduler(db);
const api = createApi(db);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff": "font/woff", ".woff2": "font/woff2" };
const server = createServer((req, res) => api(req, res, async () => {
  try {
    if (!["GET","HEAD"].includes(req.method)) { res.writeHead(405).end(); return; }
    const path = new URL(req.url, "http://localhost").pathname;
    const file = /^\/(assets\/[\w.-]+|[\w-]+\.svg)$/.test(path) ? path.slice(1) : "index.html";
    const data = await readFile(new URL(file, dist));
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin", "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'" });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch { res.writeHead(404).end(); }
}));
server.on("close", () => { stopScheduler(); db.close(); });
const host = process.env.HOST || "127.0.0.1";
server.listen(Number(process.env.PORT || 3000), host, () => console.log("LedgerView listening at http://" + host + ":" + server.address().port));

