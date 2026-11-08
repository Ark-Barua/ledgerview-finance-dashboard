import {
  ArrowDownAZ,
  ArrowUpZA,
  PencilLine,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate } from "../utils/calculateStats";

function sortTransactionsByDate(transactions, direction) {
  const sortedTransactions = [...transactions].sort(
    (firstTransaction, secondTransaction) => {
      return new Date(firstTransaction.date) - new Date(secondTransaction.date);
    },
  );

  return direction === "desc" ? sortedTransactions.reverse() : sortedTransactions;
}

function createEmptyDraft() {
  return {
    date: new Date().toISOString().slice(0, 10),
    account: "",
    category: "",
    type: "expense",
    amount: "",
  };
}

function createDraftFromTransaction(transaction) {
  return {
    date: transaction.date,
    account: transaction.account,
    category: transaction.category,
    type: transaction.type,
    amount: String(transaction.amount),
  };
}

function getTransactionTypeClasses(transactionType) {
  return transactionType === "income"
    ? "bg-[#e9fbf5] text-[#22b07f]"
    : "bg-[#fff1f3] text-[#ea6677]";
}

function getTransactionAmountClasses(transactionType) {
  return transactionType === "income"
    ? "text-[var(--finova-success)]"
    : "text-[var(--finova-danger)]";
}

export default function TransactionTable() {
  const [sortDirection, setSortDirection] = useState("desc");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [draftTransaction, setDraftTransaction] = useState(createEmptyDraft);
  const [formError, setFormError] = useState("");
  const {
    addTransaction,
    categories,
    deleteTransaction,
    filteredTransactions,
    role,
    searchQuery,
    selectedCategory,
    selectedType,
    updateTransaction,
  } = useFinance();

  const isAdmin = role === "admin";
  const isEditing = editingTransactionId !== null;
  const areEditorInputsDisabled = !isAdmin;

  const sortedTransactions = useMemo(() => {
    return sortTransactionsByDate(filteredTransactions, sortDirection);
  }, [filteredTransactions, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection((currentDirection) => {
      return currentDirection === "desc" ? "asc" : "desc";
    });
  };

  const handleDraftChange = (event) => {
    const { name, value } = event.target;

    setDraftTransaction((currentDraft) => ({
      ...currentDraft,
      [name]: value,
    }));
  };

  const handleOpenAdd = () => {
    if (!isAdmin) {
      return;
    }

    setDraftTransaction(createEmptyDraft());
    setEditingTransactionId(null);
    setFormError("");
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (transaction) => {
    if (!isAdmin) {
      return;
    }

    setDraftTransaction(createDraftFromTransaction(transaction));
    setEditingTransactionId(transaction.id);
    setFormError("");
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setDraftTransaction(createEmptyDraft());
    setEditingTransactionId(null);
    setFormError("");
    setIsEditorOpen(false);
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!isAdmin) {
      return;
    }

    const shouldDelete = window.confirm(
      "Delete this transaction? This action cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    const deletion = await deleteTransaction(transactionId);
    if (!deletion.success) return;

    if (editingTransactionId === transactionId) {
      handleCloseEditor();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdmin) {
      setFormError("Viewer access is read-only. Switch to Admin to make changes.");
      return;
    }

    const trimmedAccount = draftTransaction.account.trim();
    const trimmedCategory = draftTransaction.category.trim();
    const parsedAmount = Number.parseFloat(draftTransaction.amount);

    if (
      !draftTransaction.date ||
      !trimmedAccount ||
      !trimmedCategory ||
      !draftTransaction.type
    ) {
      setFormError("Complete every field before saving the transaction.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError("Enter an amount greater than zero.");
      return;
    }

    const normalizedTransaction = {
      id: editingTransactionId ?? undefined,
      date: draftTransaction.date,
      account: trimmedAccount,
      category: trimmedCategory,
      type: draftTransaction.type,
      amount: Number(parsedAmount.toFixed(2)),
    };

    // One compact editor handles both add and edit flows so the admin UI stays simple.
    const result = isEditing ? await updateTransaction(normalizedTransaction) : await addTransaction(normalizedTransaction);
    if (!result.success) { setFormError(result.message); return; }

    handleCloseEditor();
  };

  return (
    <section className="finova-card h-full w-full min-w-0 max-w-full overflow-hidden px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-[var(--finova-text)]">
            Transactions
          </p>
          <p className="mt-1 text-sm text-[var(--finova-muted)]">
            Sorted by date and synced to the active filters.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          {isAdmin ? (
            <button
              className="finova-action-button finova-action-button--primary w-full sm:w-auto"
              type="button"
              onClick={handleOpenAdd}
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </button>
          ) : null}

          <button
            className="finova-action-button finova-action-button--secondary w-full sm:w-auto"
            type="button"
            onClick={toggleSortDirection}
          >
            Sort by date
            {sortDirection === "desc" ? (
              <ArrowDownAZ className="h-4 w-4 text-[var(--finova-muted)]" />
            ) : (
              <ArrowUpZA className="h-4 w-4 text-[var(--finova-muted)]" />
            )}
          </button>
        </div>
      </div>

      {isEditorOpen ? (
        <div className="finova-card-soft mt-5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--finova-text)]">
                {isEditing ? "Edit transaction" : "Add transaction"}
              </p>
              <p className="mt-1 text-sm text-[var(--finova-muted)]">
                {areEditorInputsDisabled
                  ? "Viewer mode keeps transaction fields read-only."
                  : "Update transaction details and save instantly to FinanceContext."}
              </p>
            </div>

            <button
              className="finova-action-button finova-action-button--sm"
              type="button"
              onClick={handleCloseEditor}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>

          <form
            className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5"
            onSubmit={handleSubmit}
          >
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Date
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)] disabled:cursor-not-allowed disabled:bg-[var(--finova-bg-soft)]"
                disabled={areEditorInputsDisabled}
                name="date"
                type="date"
                value={draftTransaction.date}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Account
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)] disabled:cursor-not-allowed disabled:bg-[var(--finova-bg-soft)]"
                disabled={areEditorInputsDisabled}
                name="account"
                placeholder="Account name"
                type="text"
                value={draftTransaction.account}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Category
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)] disabled:cursor-not-allowed disabled:bg-[var(--finova-bg-soft)]"
                disabled={areEditorInputsDisabled}
                list="transaction-categories"
                name="category"
                placeholder="Category name"
                type="text"
                value={draftTransaction.category}
                onChange={handleDraftChange}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Type
              </span>
              <select
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)] disabled:cursor-not-allowed disabled:bg-[var(--finova-bg-soft)]"
                disabled={areEditorInputsDisabled}
                name="type"
                value={draftTransaction.type}
                onChange={handleDraftChange}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                Amount
              </span>
              <input
                className="h-11 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)] disabled:cursor-not-allowed disabled:bg-[var(--finova-bg-soft)]"
                disabled={areEditorInputsDisabled}
                min="0"
                name="amount"
                placeholder="0.00"
                step="0.01"
                type="number"
                value={draftTransaction.amount}
                onChange={handleDraftChange}
              />
            </label>

            <datalist id="transaction-categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>

            <div className="md:col-span-2 xl:col-span-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-h-6 text-sm text-[var(--finova-danger)]">
                  {formError || null}
                </div>

                <button
                  className="finova-action-button finova-action-button--primary disabled:bg-slate-300"
                  disabled={areEditorInputsDisabled}
                  type="submit"
                >
                  {isEditing ? "Save Changes" : "Create Transaction"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {sortedTransactions.length > 0 ? (
        <>
          <div className="mt-5 space-y-3 md:hidden">
            {sortedTransactions.map((transaction) => (
              <article
                key={transaction.id}
                className="finova-card-soft w-full min-w-0 space-y-4 overflow-hidden px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--finova-text)]">
                      {transaction.account}
                    </p>
                    <p className="mt-1 text-sm text-[var(--finova-muted)]">
                      {formatDate(transaction.date)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getTransactionTypeClasses(
                      transaction.type,
                    )}`}
                  >
                    {transaction.type}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-[var(--finova-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--finova-accent)]">
                    {transaction.category}
                  </span>

                  <span
                    className={`text-sm font-semibold ${getTransactionAmountClasses(
                      transaction.type,
                    )}`}
                  >
                    {transaction.type === "income" ? "+ " : "- "}
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>

                {isAdmin ? (
                  <div className="finova-action-group w-full">
                    <button
                      className="finova-action-button finova-action-button--sm min-w-0 flex-1 sm:flex-none"
                      type="button"
                      onClick={() => handleOpenEdit(transaction)}
                    >
                      <PencilLine className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    <button
                      className="finova-action-button finova-action-button--danger finova-action-button--sm min-w-0 flex-1 sm:flex-none"
                      type="button"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>

          <div className="finova-card-soft finova-scroll mt-5 hidden overflow-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--finova-border)] text-xs uppercase tracking-[0.18em] text-[var(--finova-muted)]">
                <tr>
                  <th className="px-4 py-4 font-semibold sm:px-5">Date</th>
                  <th className="px-4 py-4 font-semibold">Account</th>
                  <th className="px-4 py-4 font-semibold">Category</th>
                  <th className="px-4 py-4 font-semibold">Type</th>
                  <th className="px-4 py-4 text-right font-semibold sm:px-5">
                    Amount
                  </th>
                  {isAdmin ? (
                    <th className="px-4 py-4 text-right font-semibold sm:px-5">
                      Action
                    </th>
                  ) : null}
                </tr>
              </thead>

              <tbody>
                {sortedTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-[var(--finova-border)] last:border-b-0"
                  >
                    <td className="px-4 py-4 font-medium text-[var(--finova-text)] sm:px-5">
                      {formatDate(transaction.date)}
                    </td>

                    <td className="px-4 py-4 text-[var(--finova-muted)]">
                      {transaction.account}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-[var(--finova-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--finova-accent)]">
                        {transaction.category}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getTransactionTypeClasses(
                          transaction.type,
                        )}`}
                      >
                        {transaction.type}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right sm:px-5">
                      <span
                        className={`font-semibold ${getTransactionAmountClasses(
                          transaction.type,
                        )}`}
                      >
                        {transaction.type === "income" ? "+ " : "- "}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>

                    {isAdmin ? (
                      <td className="px-4 py-4 text-right sm:px-5">
                        <div className="finova-action-group justify-end">
                          <button
                            className="finova-action-button finova-action-button--sm"
                            type="button"
                            onClick={() => handleOpenEdit(transaction)}
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            className="finova-action-button finova-action-button--danger finova-action-button--sm"
                            type="button"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="finova-card-soft mt-5 px-6 py-12 text-center text-sm text-[var(--finova-muted)]">
          No transactions match the current filters.
          {(searchQuery || selectedCategory !== "all" || selectedType !== "all") && (
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--finova-muted)]">
              Try broadening the search, category, or transaction type.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
