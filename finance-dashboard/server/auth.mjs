import { randomBytes, createHash, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { field, fail } from "./records.mjs";

const derive = promisify(scrypt);
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const lifetime = 8 * 60 * 60;
const digest = text => createHash("sha256").update(text).digest("hex");
const dummyHash = "scrypt-v1:" + randomBytes(16).toString("hex") + ":" + randomBytes(64).toString("hex");

export function emailAddress(value) {
  const email = field(value, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, "Enter a valid email address.");
  return email;
}
export async function newAccount(draft, role) {
  const name = field(draft.name, "name");
  const email = emailAddress(draft.email);
  if (!["admin","viewer"].includes(role)) fail(400, "Invalid member role.");
  if (typeof draft.password !== "string" || draft.password.length < 12 || draft.password.length > 256) fail(400, "Use a password between 12 and 256 characters.");
  const salt = randomBytes(16).toString("hex");
  const key = await derive(draft.password, salt, 64, options);
  return { name, email, role, hash: "scrypt-v1:" + salt + ":" + key.toString("hex") };
}
export function insertAccount(db, workspace, account) {
  if (db.prepare("SELECT 1 FROM users WHERE email=?").get(account.email)) fail(409, "This email is unavailable.");
  const { name, email, role, hash } = account;
  const id = Number(db.prepare("INSERT INTO users(workspace,name,email,role,hash) VALUES(?,?,?,?,?)").run(workspace,name,email,role,hash).lastInsertRowid);
  return { id, workspace, name, email, role };
}
export async function authenticate(db, draft) {
  const email = emailAddress(draft.email);
  if (typeof draft.password !== "string" || draft.password.length > 256) fail(401, "Incorrect email or password.");
  const user = db.prepare("SELECT * FROM users WHERE email=?").get(email);
  const [, salt, hash] = (user?.hash ?? dummyHash).split(":");
  const key = await derive(draft.password, salt, 64, options);
  if (!timingSafeEqual(key, Buffer.from(hash, "hex")) || !user) fail(401, "Incorrect email or password.");
  return user;
}
export function throttle(db, key, max) {
  const now = Date.now();
  db.prepare("DELETE FROM attempts WHERE expires<=?").run(now);
  const entry = db.prepare("INSERT INTO attempts VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count").get(digest(key), now + 15 * 60000);
  if (entry.count > max) fail(429, "Too many attempts. Try again in 15 minutes.");
}
function tokenDigest(req) {
  return digest(req.headers.cookie?.match(/(?:^|;\s*)lv_session=([a-f0-9]{64})(?:;|$)/)?.[1] ?? "");
}
export function sessionUser(db, req) {
  return db.prepare("SELECT u.id,u.name,u.role,u.email,u.workspace FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?").get(tokenDigest(req), Date.now());
}
export function sessionCookie(db, req, res, user) {
  db.prepare("DELETE FROM sessions WHERE token=? OR expires<=?").run(tokenDigest(req), Date.now());
  const token = user ? randomBytes(32).toString("hex") : "";
  if (user) db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(digest(token), user.id, Date.now() + lifetime * 1000);
  const secure = req.socket.encrypted || process.env.LEDGERVIEW_ORIGIN?.startsWith("https://");
  res.setHeader("Set-Cookie", "lv_session=" + token + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + (user ? lifetime : 0) + (secure ? "; Secure" : ""));
}

