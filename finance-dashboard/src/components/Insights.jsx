import { Crown, Landmark, WalletCards } from "lucide-react";
import { useMemo } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCompactCurrency, formatCurrency } from "../utils/calculateStats";

export default function Insights() {
  const { filteredTransactions, stats, totalExpenses, totalIncome } =
    useFinance();

  const topTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((firstTransaction, secondTransaction) => {
        return secondTransaction.amount - firstTransaction.amount;
      })
      .slice(0, 3);
  }, [filteredTransactions]);

  const latestMonth = stats.monthlyTrend.at(-1);
  const incomeExpenseRatio =
    totalExpenses > 0 ? (totalIncome / totalExpenses).toFixed(2) : "0.00";

  const summaryRows = [
    {
      label: "Highest spending category",
      value: stats.topCategory ? stats.topCategory.category : "No data",
      detail: stats.topCategory
        ? `${formatCurrency(stats.topCategory.amount)} spent`
        : "No expenses in the active selection",
      icon: Crown,
      tint: "bg-[#fff7e8] text-[#d6982f]",
    },
    {
      label: "Total monthly expenses",
      value: formatCurrency(latestMonth?.expense ?? 0),
      detail: latestMonth ? latestMonth.label : "No recent month",
      icon: Landmark,
      tint: "bg-[#eef8ff] text-[#59aee6]",
    },
    {
      label: "Income vs expense ratio",
      value: `${incomeExpenseRatio}x`,
      detail: `${formatCompactCurrency(totalIncome)} in vs ${formatCompactCurrency(totalExpenses)} out`,
      icon: WalletCards,
      tint: "bg-[#eeefff] text-[#6f6de8]",
    },
  ];

  return (
    <section className="finova-card h-full w-full min-w-0 max-w-full overflow-hidden px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-[var(--finova-text)]">
            Top Insights
          </p>
          <p className="mt-1 text-sm text-[var(--finova-muted)]">
            Quick signals pulled from the same filtered dataset.
          </p>
        </div>

        <span className="rounded-full bg-[var(--finova-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-accent)]">
          Live
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {summaryRows.map((summaryRow) => (
          <article
            key={summaryRow.label}
            className="finova-card-soft flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm text-[var(--finova-muted)]">
                {summaryRow.label}
              </p>
              <p className="mt-2 truncate text-lg font-semibold text-[var(--finova-text)]">
                {summaryRow.value}
              </p>
              <p className="mt-1 text-sm text-[var(--finova-muted)]">
                {summaryRow.detail}
              </p>
            </div>

            <div
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${summaryRow.tint}`}
            >
              <summaryRow.icon className="h-4 w-4" />
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--finova-text)]">
            Top 3 Transactions
          </p>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--finova-muted)]">
            Ranked
          </span>
        </div>

        <div className="mt-3 space-y-3">
          {topTransactions.length > 0 ? (
            topTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-bg-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--finova-text)]">
                    {index + 1}. {transaction.account}
                  </p>
                  <p className="mt-1 truncate text-xs uppercase tracking-[0.16em] text-[var(--finova-muted)]">
                    {transaction.category} - {transaction.type}
                  </p>
                </div>

                <p
                  className={`text-sm font-semibold sm:shrink-0 ${
                    transaction.type === "income"
                      ? "text-[var(--finova-success)]"
                      : "text-[var(--finova-danger)]"
                  }`}
                >
                  {formatCompactCurrency(transaction.amount)}
                </p>
              </div>
            ))
          ) : (
            <div className="finova-card-soft px-4 py-6 text-sm text-[var(--finova-muted)]">
              No transactions are available for the active filters.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
