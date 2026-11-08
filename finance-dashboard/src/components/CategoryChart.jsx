import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { useFinance } from "../context/FinanceContext";
import { formatCompactCurrency, formatCurrency } from "../utils/calculateStats";

ChartJS.register(ArcElement, Tooltip, Legend);

const palette = ["#315d48", "#a9bf74", "#c77b51", "#e0c68c", "#72a398", "#9b8070"];

function getChartOptions(animationEnabled, isDarkMode) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    animation: animationEnabled && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? {
          duration: 650,
          easing: "easeOutQuart",
        }
      : false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDarkMode ? "#11172a" : "#20253b",
        borderColor: isDarkMode ? "rgba(148, 163, 184, 0.16)" : "#e8ebf5",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label(context) {
            const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
            const share = total > 0 ? (context.parsed / total) * 100 : 0;

            return `${context.label}: ${formatCurrency(context.parsed)} (${share.toFixed(
              1,
            )}%)`;
          },
        },
      },
    },
  };
}

export default function CategoryChart({ isDarkMode = false }) {
  const { animationEnabled, filteredTransactions, stats } = useFinance();
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const expenseBreakdown = stats.categoryTotals;
  const breakdownDetails = useMemo(() => {
    const expenseCounts = filteredTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((countsByCategory, transaction) => {
        countsByCategory[transaction.category] =
          (countsByCategory[transaction.category] ?? 0) + 1;

        return countsByCategory;
      }, {});

    return expenseBreakdown.map((item) => ({
      ...item,
      transactionCount: expenseCounts[item.category] ?? 0,
    }));
  }, [expenseBreakdown, filteredTransactions]);
  const chartOptions = getChartOptions(animationEnabled, isDarkMode);
  const chartData = {
    labels: expenseBreakdown.map((item) => item.category),
    datasets: [
      {
        data: expenseBreakdown.map((item) => item.amount),
        backgroundColor: expenseBreakdown.map(
          (_, index) => palette[index % palette.length],
        ),
        borderWidth: 0,
        hoverOffset: animationEnabled ? 8 : 0,
      },
    ],
  };

  return (
    <section className="finova-card h-full w-full min-w-0 max-w-full overflow-hidden px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-[var(--finova-text)]">
            Spending breakdown
          </p>
          <p className="mt-1 text-sm text-[var(--finova-muted)]">
            Expenses by category.
          </p>
        </div>

        <button
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium text-[var(--finova-accent)]"
          disabled={!expenseBreakdown.length}
          type="button"
          onClick={() => setIsBreakdownOpen(true)}
        >
          See all
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {expenseBreakdown.length > 0 ? (
        <div className="mt-5 space-y-5">
          <div className="finova-card-soft relative flex h-[250px] w-full min-w-0 items-center justify-center overflow-hidden p-4">
            <div className="absolute text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--finova-muted)]">
                Total
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--finova-text)]">
                {formatCompactCurrency(stats.totalExpenses)}
              </p>
            </div>

            <div className="h-[210px] w-full max-w-[220px]">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="space-y-3">
            {expenseBreakdown.map((item, index) => (
              <div
                key={item.category}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: palette[index % palette.length] }}
                  />
                  <span className="truncate font-medium text-[var(--finova-text)]">
                    {item.category}
                  </span>
                </div>

                <div className="text-right">
                  <p className="font-medium text-[var(--finova-text)]">
                    {formatCompactCurrency(item.amount)}
                  </p>
                  <p className="text-xs text-[var(--finova-muted)]">
                    {item.share.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="finova-card-soft mt-5 flex h-[250px] items-center justify-center p-6 text-sm text-[var(--finova-muted)]">
          No expense data is available for the active dashboard selection.
        </div>
      )}

      {isBreakdownOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6"
          role="presentation"
          onClick={() => setIsBreakdownOpen(false)}
        >
          <section
            aria-label="Full spending breakdown"
            className="finova-card finova-scroll max-h-[85vh] w-full max-w-xl overflow-y-auto px-5 py-5 sm:px-6"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-[var(--finova-text)]">
                  Full spending breakdown
                </p>
                <p className="mt-1 text-sm text-[var(--finova-muted)]">
                  All expense categories in the current filtered view.
                </p>
              </div>

              <button
                aria-label="Close spending breakdown"
                className="finova-icon-button h-10 w-10 shrink-0"
                type="button"
                onClick={() => setIsBreakdownOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {breakdownDetails.map((item, index) => (
                <article
                  key={item.category}
                  className="finova-card-soft px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: palette[index % palette.length] }}
                        />
                        <p className="truncate text-sm font-semibold text-[var(--finova-text)]">
                          {item.category}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-[var(--finova-muted)]">
                        {item.transactionCount} expense transaction
                        {item.transactionCount === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--finova-text)]">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="mt-1 text-xs text-[var(--finova-muted)]">
                        {item.share.toFixed(1)}% of total
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
