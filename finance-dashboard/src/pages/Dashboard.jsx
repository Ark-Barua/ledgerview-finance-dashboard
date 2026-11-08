import { CalendarDays, SlidersHorizontal } from "lucide-react";
import CategoryChart from "../components/CategoryChart";
import DashboardCards from "../components/DashboardCards";
import Filters from "../components/Filters";
import Insights from "../components/Insights";
import TransactionTable from "../components/TransactionTable";
import TrendChart from "../components/TrendChart";
import { useFinance } from "../context/FinanceContext";
import { formatDate } from "../utils/calculateStats";

export default function Dashboard({ isDarkMode = false }) {
  const { activeFilterCount, overallStats, stats, transactions } = useFinance();
  const latestTransaction =
    stats.latestTransaction ?? overallStats.latestTransaction;
  const hasTransactions = transactions.length > 0;

  return (
    <section className="min-w-0 max-w-full space-y-5">
      <header className="overview-heading">
        <div><p className="ledger-label">Financial overview</p><h1>Account <em>overview.</em></h1></div>
        {latestTransaction && <p><CalendarDays size={15} /> Latest entry {formatDate(latestTransaction.date)}</p>}
      </header>
      {hasTransactions ? (
        <>
          <DashboardCards />
          <details className="ledger-filters"><summary><SlidersHorizontal size={16} /> Filters {activeFilterCount > 0 && <b>{activeFilterCount}</b>}</summary><Filters /></details>

          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.7fr)_360px]">
            <div className="min-w-0">
              <TrendChart isDarkMode={isDarkMode} />
            </div>

            <div className="min-w-0">
              <CategoryChart isDarkMode={isDarkMode} />
            </div>
          </div>

          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
            <div className="min-w-0">
              <TransactionTable />
            </div>

            <div className="min-w-0">
              <Insights />
            </div>
          </div>
        </>
      ) : (
        <TransactionTable />
      )}
    </section>
  );
}
