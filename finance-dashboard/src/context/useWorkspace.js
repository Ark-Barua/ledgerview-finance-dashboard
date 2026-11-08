import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { received } from "../store/ledger";

export function useWorkspace() {
  const workspace = useSelector(state => state.workspace);
  const dispatch = useDispatch();
  const queue = useRef(Promise.resolve());
  const saving = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const userId = workspace?.currentUser.id;

  const request = useCallback((path, method = "GET", data = {}) => {
    const writing = method !== "GET";
    if (writing && saving.current) return Promise.resolve({ success: false, message: "A change is already being saved." });
    if (writing) saving.current = true;
    async function run() {
      try {
        const response = await fetch("/api/" + path, {
          method, credentials: "same-origin", cache: "no-store",
          headers: writing ? { "Content-Type": "application/json", "X-Ledger-Request": "1", "X-Ledger-User": String(userId ?? "") } : {},
          body: writing ? JSON.stringify(data) : undefined,
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          if (response.status === 401 && path !== "signin") dispatch(received(null));
          throw new Error(result.message || "The server could not complete this request.");
        }
        dispatch(received(result.workspace));
        setError("");
        return result;
      } catch (exception) {
        const message = exception instanceof SyntaxError ? "The workspace API is unavailable." : exception.message || "Unable to reach the server.";
        setError(message);
        return { success: false, message };
      } finally {
        if (writing) saving.current = false;
        setReady(true);
      }
    }
    queue.current = queue.current.then(run);
    return queue.current;
  }, [dispatch, userId]);

  useEffect(() => {
    // Discard credentials left by the previous browser-only implementation.
    try {
      localStorage.removeItem("finance-dashboard:users");
      localStorage.removeItem("finance-dashboard:session");
    } catch { /* Storage may be disabled. */ }
    const refresh = () => { void request("workspace"); };
    refresh();
    const timer = userId && setInterval(() => { if (!document.hidden) refresh(); }, 60000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [request, userId]);

  const actions = useMemo(() => {
    const add = kind => data => request(kind, "POST", data);
    const update = kind => (id, data) => request(kind + "/" + id, "PUT", data);
    const remove = kind => id => request(kind + "/" + id, "DELETE");
    return {
      signUp: add("signup"), signIn: add("signin"), signOut: () => request("signout", "POST"),
      addTransaction: add("transactions"), updateTransaction: row => update("transactions")(row.id, row),
      deleteTransaction: remove("transactions"), createEvent: add("workspaceEvents"), deleteEvent: remove("workspaceEvents"),
      createAssetWorkflow: add("assetWorkflows"), updateAssetWorkflow: update("assetWorkflows"), deleteAssetWorkflow: remove("assetWorkflows"),
      addFinanceNote: add("financeNotes"), deleteFinanceNote: remove("financeNotes"), inviteMember: add("members"),
      deleteMember: remove("members"), uploadWorkspaceFile: add("workspaceFiles"), deleteWorkspaceFile: remove("workspaceFiles"),
      saveProfile: data => request("profile","PUT",data), deleteAccount: data => request("profile","DELETE",data),
      createBudget: add("budgets"), updateBudget: update("budgets"), deleteBudget: remove("budgets"),
      createRecurring: add("recurring"), deleteRecurring: remove("recurring"), scheduleReport: update("reports"),
      createDocument: add("documents"), createReport: add("reports"),
      updateDocument: update("documents"), deleteDocument: remove("documents"), runReports: add("reports"), deleteReport: remove("reports"),
    };
  }, [request]);
  return { workspace, actions, ready, error, setError };
}

