import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useFinance } from "../context/FinanceContext";

export default function Filters() {
  const {
    animationEnabled,
    categories,
    filteredTransactions,
    hasActiveFilters,
    resetFilters,
    searchQuery,
    selectedCategory,
    selectedType,
    setSearchQuery,
    setSelectedCategory,
    setSelectedType,
    transactions,
  } = useFinance();

  const controlMotion = animationEnabled
    ? "transition-all duration-200 ease-out focus:-translate-y-0.5"
    : "transition-none";

  return (
    <section className="finova-card w-full min-w-0 max-w-full overflow-hidden px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
            <SlidersHorizontal className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--finova-text)]">
              Smart Filters
            </p>
            <p className="text-sm text-[var(--finova-muted)]">
              {filteredTransactions.length} of {transactions.length} transactions visible
            </p>
          </div>
        </div>

        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:w-full xl:max-w-[780px] xl:grid-cols-[minmax(0,1.25fr)_repeat(2,minmax(0,0.7fr))_auto]">
          <label className="relative block min-w-0">
            <span className="sr-only">Search transactions</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--finova-muted)]" />
            <input
              className={`h-12 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-bg-soft)] pl-11 pr-4 text-sm text-[var(--finova-text)] outline-none focus:border-[var(--finova-accent)] focus:bg-[var(--finova-surface)] ${controlMotion}`}
              placeholder="Search transactions"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>

          <label className="block min-w-0">
            <span className="sr-only">Select category</span>
            <select
              className={`h-12 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-bg-soft)] px-4 text-sm text-[var(--finova-text)] outline-none focus:border-[var(--finova-accent)] focus:bg-[var(--finova-surface)] ${controlMotion}`}
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="sr-only">Select transaction type</span>
            <select
              className={`h-12 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-bg-soft)] px-4 text-sm text-[var(--finova-text)] outline-none focus:border-[var(--finova-accent)] focus:bg-[var(--finova-surface)] ${controlMotion}`}
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
            >
              <option value="all">All transactions</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </label>

          <button
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] px-4 text-sm font-medium text-[var(--finova-text)] transition hover:border-[var(--finova-border-strong)] hover:bg-[var(--finova-bg-soft)] disabled:cursor-not-allowed disabled:opacity-45 xl:w-auto"
            disabled={!hasActiveFilters}
            type="button"
            onClick={resetFilters}
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
