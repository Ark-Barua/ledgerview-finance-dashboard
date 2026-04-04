import { CalendarDays, Landmark, Sparkles } from "lucide-react";
import CategoryChart from "../components/CategoryChart";
import DashboardCards from "../components/DashboardCards";
import Filters from "../components/Filters";
import Insights from "../components/Insights";
import TransactionTable from "../components/TransactionTable";
import TrendChart from "../components/TrendChart";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate } from "../utils/calculateStats";

export default function Dashboard({ isDarkMode = false }) {
  const { activeFilterCount, overallStats, stats, transactions } = useFinance();
  const latestTransaction =
    stats.latestTransaction ?? overallStats.latestTransaction;
  const hasTransactions = transactions.length > 0;

  return (
    <section className="min-w-0 max-w-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="inline-flex w-full items-center gap-2 rounded-2xl bg-[var(--finova-surface)] px-4 py-2.5 text-sm font-medium text-[var(--finova-text)] shadow-[0_20px_40px_-32px_rgba(30,35,65,0.28)] sm:w-auto">
          <Landmark className="h-4 w-4 text-[var(--finova-accent)]" />
          {formatCurrency(overallStats.balance)} overall balance
        </div>

        {latestTransaction ? (
          <div className="inline-flex w-full items-center gap-2 rounded-2xl bg-[var(--finova-surface)] px-4 py-2.5 text-sm font-medium text-[var(--finova-text)] shadow-[0_20px_40px_-32px_rgba(30,35,65,0.28)] sm:w-auto">
            <CalendarDays className="h-4 w-4 text-[var(--finova-success)]" />
            Latest activity {formatDate(latestTransaction.date)}
          </div>
        ) : null}

        {activeFilterCount > 0 ? (
          <div className="inline-flex w-full items-center gap-2 rounded-2xl bg-[var(--finova-surface)] px-4 py-2.5 text-sm font-medium text-[var(--finova-text)] shadow-[0_20px_40px_-32px_rgba(30,35,65,0.28)] sm:w-auto">
            <Sparkles className="h-4 w-4 text-[var(--finova-warning)]" />
            {activeFilterCount} active filter
            {activeFilterCount === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>

      {hasTransactions ? (
        <>
          <Filters />
          <DashboardCards />

          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.7fr)_360px]">
            <div className="min-w-0">
              <TrendChart isDarkMode={isDarkMode} />
            </div>

            <div className="min-w-0">
              <Insights />
            </div>
          </div>

          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
            <div className="min-w-0">
              <TransactionTable />
            </div>

            <div className="min-w-0">
              <CategoryChart isDarkMode={isDarkMode} />
            </div>
          </div>
        </>
      ) : (
        <section className="finova-card px-6 py-12 sm:px-8">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[var(--finova-accent-soft)] text-[var(--finova-accent)]">
              <Sparkles className="h-8 w-8" />
            </div>

            <p className="mt-6 text-sm font-semibold text-[var(--finova-accent)]">
              Empty state
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--finova-text)]">
              No transaction data available
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--finova-muted)]">
              Add transactions to unlock the cards, charts, insights, and
              management controls in this dashboard layout.
            </p>
          </div>
        </section>
      )}
    </section>
  );
}
