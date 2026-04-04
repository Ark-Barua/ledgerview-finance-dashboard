import {
  ArrowDownRight,
  ArrowUpRight,
  BadgePercent,
  Wallet,
} from "lucide-react";
import { createElement } from "react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../utils/calculateStats";

const cardConfig = {
  balance: {
    title: "Total Balance",
    icon: Wallet,
    accent: "bg-[#7e7cf5]",
    tint: "bg-[#eeefff] text-[#6f6de8]",
  },
  income: {
    title: "Total Income",
    icon: ArrowUpRight,
    accent: "bg-[#34c99a]",
    tint: "bg-[#e9fbf5] text-[#22b07f]",
  },
  expenses: {
    title: "Total Expenses",
    icon: ArrowDownRight,
    accent: "bg-[#f08b96]",
    tint: "bg-[#fff1f3] text-[#ea6677]",
  },
  savings: {
    title: "Savings Rate",
    icon: BadgePercent,
    accent: "bg-[#f0b34f]",
    tint: "bg-[#fff7e6] text-[#d9982f]",
  },
};

export default function DashboardCards() {
  const {
    animationEnabled,
    balance,
    stats,
    totalExpenses,
    totalIncome,
  } = useFinance();

  const hoverClasses = animationEnabled
    ? "transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_24px_44px_-30px_rgba(30,35,65,0.25)]"
    : "transition-none";

  const cards = [
    {
      key: "balance",
      value: formatCurrency(balance),
      secondary: `${stats.transactionCount} visible transactions`,
      note: "Live total from the current dashboard selection",
      ...cardConfig.balance,
    },
    {
      key: "income",
      value: formatCurrency(totalIncome),
      secondary: `Avg. ${formatCurrency(stats.averageIncome || 0)}`,
      note: "Income collected in the filtered view",
      ...cardConfig.income,
    },
    {
      key: "expenses",
      value: formatCurrency(totalExpenses),
      secondary: `Avg. ${formatCurrency(stats.averageExpense || 0)}`,
      note: "Expense outflow in the filtered view",
      ...cardConfig.expenses,
    },
    {
      key: "savings",
      value: `${stats.savingsRate}%`,
      secondary:
        stats.monthlyExpenseChange !== null
          ? `${stats.monthlyExpenseChange > 0 ? "+" : ""}${stats.monthlyExpenseChange.toFixed(
              1,
            )}% vs previous month`
          : "Waiting for previous month data",
      note: "How much income remains after expenses",
      ...cardConfig.savings,
    },
  ];

  return (
    <section className="grid min-w-0 gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {cards.map(({ key, title, value, secondary, note, icon: Icon, accent, tint }) => (
        <article
          key={key}
          className={`finova-card relative w-full min-w-0 overflow-hidden px-5 py-5 sm:px-6 ${hoverClasses}`}
        >
          <span className={`absolute inset-x-0 top-0 h-1.5 ${accent}`} />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--finova-muted)]">
                {title}
              </p>
              <p className="mt-4 text-[1.95rem] font-semibold tracking-tight text-[var(--finova-text)]">
                {value}
              </p>
            </div>

            <div
              className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}
            >
              {createElement(Icon, { className: "h-5 w-5" })}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-sm font-medium text-[var(--finova-text)]">
              {secondary}
            </p>
            <p className="text-sm leading-6 text-[var(--finova-muted)]">
              {note}
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}
