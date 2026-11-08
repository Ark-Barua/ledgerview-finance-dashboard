import { authenticate, emailAddress, sessionCookie, sessionUser, throttle } from "./auth.mjs";
import { atomic } from "./database.mjs";
import { fail, field } from "./records.mjs";

function portrait(value) {
  if (!value) return "";
  if (typeof value !== "string" || value.length > 350000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(value)) fail(400, "Choose a smaller JPEG portrait.");
  const bytes = Buffer.from(value.slice(23), "base64");
  if (bytes.length < 5 || bytes.readUIntBE(0, 3) !== 0xffd8ff || bytes.readUInt16BE(bytes.length - 2) !== 0xffd9) fail(400, "Invalid JPEG portrait.");
  return value;
}

export async function changeProfile(db, req, res, user, draft) {
  const deleting = req.method === "DELETE";
  const email = deleting ? user.email : emailAddress(draft.email);
  const sensitive = deleting || email !== user.email;
  if (sensitive) {
    throttle(db, "profile:" + user.id, 12);
    try { await authenticate(db, { email: user.email, password: draft.password }); }
    catch (error) { if (error.status === 401) fail(403, "Enter your current password."); throw error; }
  }
  return atomic(db, () => {
    const active = sessionUser(db, req);
    if (active?.id !== user.id || active.email !== user.email) fail(409, "Your account changed. Reload and try again.");
    if (deleting) {
      const others = db.prepare("SELECT id,role FROM users WHERE workspace=? AND id<>?").all(user.workspace,user.id);
      if (!others.length && draft.deleteWorkspace !== "yes") fail(409, "Confirm deletion of the empty membership workspace and its records.");
      if (others.length && !others.some(member => member.role === "admin")) {
        const successor = others.find(member => member.id === Number(draft.successor));
        if (!successor) fail(400, "Select a new workspace administrator.");
        db.prepare("UPDATE users SET role='admin' WHERE id=?").run(successor.id);
      }
      db.prepare("DELETE FROM users WHERE id=?").run(user.id);
      if (!others.length) {
        db.prepare("DELETE FROM records WHERE workspace=?").run(user.workspace);
        db.prepare("DELETE FROM workspaces WHERE id=?").run(user.workspace);
      }
      sessionCookie(db,req,res,null);
      return null;
    }
    const name = field(draft.name,"name");
    const title = draft.title ? field(draft.title,"job title",100) : "";
    const avatar = portrait(draft.avatar);
    if (db.prepare("SELECT id FROM users WHERE email=? AND id<>?").get(email,user.id)) fail(409,"This email is unavailable.");
    db.prepare("UPDATE users SET name=?,email=? WHERE id=?").run(name,email,user.id);
    db.prepare("INSERT INTO profiles(user_id,title,avatar) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET title=excluded.title,avatar=excluded.avatar").run(user.id,title,avatar);
    if (sensitive) {
      db.prepare("DELETE FROM sessions WHERE user_id=?").run(user.id);
      sessionCookie(db,req,res,user);
    }
    return { ...user, name, email };
  });
}

