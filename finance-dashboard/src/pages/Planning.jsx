import { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate } from "../utils/calculateStats";
import { forecast } from "../utils/schedule";

export default function Planning() {
  const { role, budgets, recurring, transactions, createBudget, updateBudget, deleteBudget, createRecurring, deleteRecurring } = useFinance();
  const today = new Date().toISOString().slice(0,10);
  const [month,setMonth] = useState(today.slice(0,7));
  const [editor,setEditor] = useState("");
  const [editing,setEditing] = useState(null);
  const [includeHistory,setIncludeHistory] = useState(false);
  const admin = role === "admin";
  const visible = budgets.filter(b => b.month === month);
  const categories = [...new Set(transactions.map(row => row.category))];
  async function save(event) {
    event.preventDefault();
    const draft = Object.fromEntries(new FormData(event.currentTarget));
    let result;
    if (editor === "recurring") result = await createRecurring(draft);
    else if (editing) result = await updateBudget(editing.id,{...draft,month});
    else result = await createBudget({...draft,month});
    if (result.success) { setEditor(""); setEditing(null); }
  }
  function open(kind, item = null) { setEditing(item); setEditor(kind); }
  return <section className="planning-desk">
    <header className="overview-heading"><div><p className="ledger-label">Cash planning</p><h1>Planning <em>desk.</em></h1></div></header>
    <section className="desk-panel">
      <h2>Balance forecast</h2><p>Projected balance includes dated transactions and scheduled income and expenses through each checkpoint.</p>
      <label>Forecast basis<select value={includeHistory ? "history" : "scheduled"} onChange={e => setIncludeHistory(e.target.value === "history")}><option value="scheduled">Scheduled cash flow</option><option value="history">Scheduled + historical trend</option></select></label>
      {includeHistory && <p>Also projects the average daily net of non-recurring entries over the last 90 calendar days.</p>}
      <div className="forecast-strip">{forecast(transactions,recurring,today,[30,60,90],includeHistory).map(point => <div key={point.days}>
        <span className="ledger-label">{point.days} days</span><strong>{formatCurrency(point.balance)}</strong><small>{formatDate(point.until)}</small>
      </div>)}</div>
    </section>
    <section className="desk-panel"><header><h2>Monthly budgets</h2><label>Budget month <input type="month" required value={month} onChange={e => { if (e.target.value) { setMonth(e.target.value); setEditor(""); } }} /></label>
      {admin && <button className="finova-action-button" onClick={() => open("budget")}>Add budget</button>}</header>
      {editor === "budget" && <form key={editing?.id ?? "new"} onSubmit={save}>
        <label>Category<input required name="category" list="plan-categories" defaultValue={editing?.category} /></label>
        <label>Limit (INR)<input required type="number" min=".01" step=".01" name="limit" defaultValue={editing?.limit} /></label>
        <button className="finova-action-button">Save budget</button><button type="button" onClick={() => setEditor("")}>Cancel</button>
      </form>}
      {!visible.length && <p>No category budgets for this month.</p>}
      {visible.map(b => {
        const spent = transactions.filter(t => t.type === "expense" && t.date.startsWith(month) && t.category.toLowerCase() === b.category.toLowerCase()).reduce((sum,t) => sum+t.amount,0);
        return <div className="plan-row" key={b.id}><div><strong>{b.category}</strong><p>{formatCurrency(spent)} of {formatCurrency(b.limit)} spent · {formatCurrency(Math.abs(b.limit-spent))} {spent > b.limit ? "over budget" : "remaining"}</p><progress max={b.limit} value={Math.min(spent,b.limit)} aria-label={b.category + " spending"} /></div>
          {admin && <div><button onClick={() => open("budget",b)}>Edit</button> <button onClick={() => window.confirm("Remove this budget?") && deleteBudget(b.id)}>Remove</button></div>}</div>;
      })}
    </section>
    <section className="desk-panel"><header><h2>Recurring transactions</h2>{admin && <button className="finova-action-button" onClick={() => open("recurring")}>Add recurring entry</button>}</header>
      {editor === "recurring" && <form onSubmit={save}>
        <label>Account<input name="account" required /></label><label>Category<input name="category" list="plan-categories" required /></label>
        <label>Type<select name="type"><option value="expense">Expense</option><option value="income">Income</option></select></label>
        <label>Amount (INR)<input required name="amount" type="number" min=".01" step=".01" /></label>
        <label>Frequency<select name="cadence"><option>Monthly</option><option>Weekly</option><option>Daily</option></select></label>
        <label>First posting (UTC)<input required type="date" name="nextDate" defaultValue={today} min={today} /></label>
        <button className="finova-action-button">Save recurring entry</button><button type="button" onClick={() => setEditor("")}>Cancel</button>
      </form>}
      {!recurring.length && <p>No recurring entries scheduled.</p>}
      {recurring.map(rule => <div className="plan-row" key={rule.id}><div><strong>{rule.category} · {formatCurrency(rule.amount)}</strong>
        <p>{rule.account} · {rule.type} · {rule.cadence} · Next {formatDate(rule.nextDate)}</p></div>
        {admin && <button onClick={() => window.confirm("Stop future postings for this entry?") && deleteRecurring(rule.id)}>Stop recurrence</button>}</div>)}
    </section><datalist id="plan-categories">{categories.map(c => <option key={c}>{c}</option>)}</datalist>
  </section>;
}

