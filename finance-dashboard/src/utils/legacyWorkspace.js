const legacyKeys = {
  transactions: "transactions", workspaceEvents: "events", assetWorkflows: "asset-workflows",
  financeNotes: "finance-notes", workspaceFiles: "workspace-files", documents: "documents", reports: "reports",
};

export function hasLegacyWorkspace() {
  try { return Object.values(legacyKeys).some(key => localStorage.getItem("finance-dashboard:" + key) !== null); }
  catch { return false; }
}

export function readLegacyWorkspace() {
  const data = {};
  for (const [collection, key] of Object.entries(legacyKeys)) {
    const saved = localStorage.getItem("finance-dashboard:" + key);
    if (saved !== null) data[collection] = JSON.parse(saved);
  }
  return data;
}

