export const collections = ["transactions", "workspaceEvents", "assetWorkflows", "financeNotes", "workspaceFiles", "documents", "reports", "budgets", "recurring", "reportRuns"];

export function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
export function field(value, name, limit = 200) {
  if (typeof value !== "string" || !value.trim() || value.length > limit) fail(400, "Invalid " + name + ".");
  return value.trim();
}
function choice(value, options) {
  if (!options.includes(value)) fail(400, "Invalid selection.");
  return value;
}
function date(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value) fail(400, "Enter a valid date.");
  return value;
}
function amount(value) {
  if ((typeof value !== "number" && typeof value !== "string") || !Number.isFinite(Number(value)) ||
      Number(value) < 0 || Number(value) > 1e12) fail(400, "Invalid amount.");
  return Math.round(Number(value) * 100) / 100;
}
export const today = () => new Date().toISOString().slice(0, 10);
export function schedule(draft) {
  const nextDate = date(draft.nextDate);
  if (nextDate < today() || nextDate > "9900-12-31") fail(400, "Choose today or a future start date.");
  return { cadence: choice(draft.cadence, ["Daily","Weekly","Monthly"]), nextDate, anchorDay: Number(nextDate.slice(-2)) };
}
export function record(kind, draft, user, importing = false) {
  const text = (key, limit) => field(draft[key], key, limit);
  const author = key => importing ? text(key) : user.name;
  const stamp = key => importing ? date(draft[key]) : today();
  switch (kind) {
    case "budgets": {
      const limit = amount(draft.limit);
      if (!limit || !/^\d{4}-(0[1-9]|1[0-2])$/.test(draft.month)) fail(400,"Enter a month and a positive budget.");
      return { month: draft.month, category: text("category"), limit };
    }
    case "recurring": {
      const timing = schedule(draft);
      const transaction = record("transactions", { ...draft, date: timing.nextDate }, user);
      return { ...transaction, ...timing };
    }
    case "transactions": {
      const value = amount(draft.amount);
      if (!value) fail(400, "Amount must be positive.");
      return { date: date(draft.date), account: text("account"), category: text("category"), type: choice(draft.type, ["income","expense"]), amount: value };
    }
    case "workspaceEvents": return { title: text("title"), detail: text("detail", 10000), type: choice(draft.type, ["info","income","expense"]), date: date(draft.date || today()), amount: amount(draft.amount ?? 0), createdBy: author("createdBy") };
    case "assetWorkflows": return { title: text("title"), status: text("status"), owner: text("owner"), summary: text("summary", 10000) };
    case "financeNotes": return { title: text("title"), content: text("content", 100000), author: author("author"), createdAt: stamp("createdAt") };
    case "workspaceFiles": {
      const content = text("content", 1000000);
      return { name: text("name"), content, owner: author("owner"), updatedAt: stamp("updatedAt"), size: (Buffer.byteLength(content) / 1024).toFixed(1) + " KB" };
    }
    case "documents": return { title: text("title"), summary: text("summary", 10000), body: text("body", 100000), updatedAt: stamp("updatedAt") };
    case "reports": {
      if (!importing) return { title: text("title"), cadence: text("cadence"), audience: text("audience"), ...(draft.nextDate ? schedule(draft) : {}), status: "Pending", runCount: 0, lastRunAt: null };
      if (!Number.isSafeInteger(draft.runCount) || draft.runCount < 0) fail(400, "Invalid report.");
      return { title: text("title"), cadence: text("cadence"), audience: text("audience"), status: text("status"), runCount: draft.runCount, lastRunAt: draft.lastRunAt ? date(draft.lastRunAt) : null };
    }
    default: fail(404, "Unknown resource.");
  }
}

