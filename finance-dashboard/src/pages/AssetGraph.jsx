import { PieChart, TrendingUp, WalletCards } from "lucide-react";
import CategoryChart from "../components/CategoryChart";
import TrendChart from "../components/TrendChart";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../utils/calculateStats";

export default function AssetGraph({ isDarkMode = false }) {
  const { overallStats, stats } = useFinance();

  const summaryCards = [
    {
      label: "Visible balance",
      value: formatCurrency(stats.balance),
      icon: WalletCards,
      tint: "bg-[#eeefff] text-[#6f6de8]",
    },
    {
      label: "Largest expense",
      value: stats.largestExpense
        ? formatCurrency(stats.largestExpense.amount)
        : formatCurrency(0),
      icon: TrendingUp,
      tint: "bg-[#fff1f3] text-[#ea6677]",
    },
    {
      label: "Top category",
      value: stats.topCategory?.category ?? "No data",
      icon: PieChart,
      tint: "bg-[#e9fbf5] text-[#22b07f]",
    },
  ];

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <article key={card.label} className="finova-card px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[var(--finova-muted)]">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-[var(--finova-text)]">
                  {card.value}
                </p>
              </div>

              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${card.tint}`}
              >
                <card.icon className="h-4 w-4" />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
        <TrendChart isDarkMode={isDarkMode} />
        <CategoryChart isDarkMode={isDarkMode} />
      </div>

      <section className="finova-card px-5 py-5 sm:px-6">
        <p className="text-lg font-semibold text-[var(--finova-text)]">
          Portfolio signal
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--finova-muted)]">
          This read-only page helps viewers and admins compare how the visible
          selection is performing versus the full portfolio balance of{" "}
          {formatCurrency(overallStats.balance)}.
        </p>
      </section>
    </section>
  );
}
