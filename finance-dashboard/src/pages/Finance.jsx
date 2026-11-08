import {
  BadgeDollarSign,
  CheckCircle2,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import DashboardCards from "../components/DashboardCards";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate } from "../utils/calculateStats";

function createEmptyNoteDraft() {
  return {
    title: "",
    content: "",
  };
}

export default function Finance() {
  const {
    addFinanceNote,
    deleteFinanceNote,
    filteredTransactions,
    financeNotes,
    role,
    totalExpenses,
    totalIncome,
  } = useFinance();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(createEmptyNoteDraft);
  const [statusMessage, setStatusMessage] = useState("");
  const isAdmin = role === "admin";

  const recentFinanceItems = useMemo(() => {
    return filteredTransactions.slice(0, 6);
  }, [filteredTransactions]);

  const handleDraftChange = (event) => {
    const { name, value } = event.target;

    setNoteDraft((currentDraft) => ({
      ...currentDraft,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const result = await addFinanceNote(noteDraft);

    if (!result.success) {
      setStatusMessage(result.message);
      return;
    }

    setStatusMessage("Finance note saved.");
    setNoteDraft(createEmptyNoteDraft());
    setIsComposerOpen(false);
  };

  const handleDeleteNote = async (noteId) => {
    const shouldDelete = window.confirm(
      "Delete this finance note? This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    const deletion = await deleteFinanceNote(noteId);
    if (!deletion.success) return;
    setStatusMessage("Finance note deleted.");
  };

  return (
    <section className="space-y-5">
      <DashboardCards />

      <section className="finova-card px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-[var(--finova-text)]">
              Finance operations
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
              Review current inflow and outflow activity from the selected
              workspace view.
            </p>
          </div>

          {isAdmin ? (
            <button
              className="finova-action-button finova-action-button--primary"
              type="button"
              onClick={() => {
                setStatusMessage("");
                setIsComposerOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4" />
              Add finance note
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="finova-card-soft px-4 py-4">
            <p className="text-sm text-[var(--finova-muted)]">Income booked</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--finova-text)]">
              {formatCurrency(totalIncome)}
            </p>
          </article>

          <article className="finova-card-soft px-4 py-4">
            <p className="text-sm text-[var(--finova-muted)]">Expenses booked</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--finova-text)]">
              {formatCurrency(totalExpenses)}
            </p>
          </article>
        </div>

        {isAdmin && isComposerOpen ? (
          <form
            className="finova-card-soft mt-5 grid gap-3 p-4"
            onSubmit={handleSubmit}
          >
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Note title
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="title"
                placeholder="Note title"
                type="text"
                value={noteDraft.title}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Note body
              </span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 py-3 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                name="content"
                placeholder="Write the operational note you want the team to see."
                value={noteDraft.content}
                onChange={handleDraftChange}
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-6 text-sm text-[var(--finova-danger)]">
                {statusMessage || null}
              </div>

              <div className="finova-action-group">
                <button
                  className="finova-action-button"
                  type="button"
                  onClick={() => {
                    setIsComposerOpen(false);
                    setStatusMessage("");
                  }}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>

                <button
                  className="finova-action-button finova-action-button--primary"
                  type="submit"
                >
                  <PlusCircle className="h-4 w-4" />
                  Save Note
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </section>

      <section className="finova-card px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
            <BadgeDollarSign className="h-4 w-4" />
          </div>

          <div>
            <p className="text-lg font-semibold text-[var(--finova-text)]">
              Recent finance entries
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
              This list stays read-only for viewers and becomes operational for
              admins through the dashboard transaction editor.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {recentFinanceItems.map((transaction) => (
            <article
              key={transaction.id}
              className="finova-card-soft flex items-center justify-between gap-4 px-4 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--finova-text)]">
                  {transaction.account}
                </p>
                <p className="mt-1 text-sm text-[var(--finova-muted)]">
                  {transaction.category} - {formatDate(transaction.date)}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${
                    transaction.type === "income"
                      ? "text-[var(--finova-success)]"
                      : "text-[var(--finova-danger)]"
                  }`}
                >
                  {transaction.type === "income" ? "+ " : "- "}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--finova-muted)]">
                  {transaction.type}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#e9fbf5] px-4 py-3 text-sm text-[#1a8e68]">
          <CheckCircle2 className="h-4 w-4" />
          Finance data is visible to both roles, while write actions stay
          reserved for admins.
        </div>
      </section>

      <section className="finova-card px-5 py-5 sm:px-6">
        <p className="text-lg font-semibold text-[var(--finova-text)]">
          Finance notes
        </p>
        <div className="mt-5 space-y-3">
          {financeNotes.map((note) => (
            <article key={note.id} className="finova-card-soft px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--finova-text)]">
                    {note.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
                    {note.content}
                  </p>
                </div>

                <div className="text-right text-xs uppercase tracking-[0.16em] text-[var(--finova-muted)]">
                  <p>{note.author}</p>
                  <p className="mt-1">{formatDate(note.createdAt)}</p>
                  {isAdmin ? (
                    <button
                      className="finova-action-button finova-action-button--danger finova-action-button--sm mt-3"
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
