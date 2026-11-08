import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../utils/calculateStats";

export default function DashboardCards() {
  const { balance, stats, totalExpenses, totalIncome } = useFinance();
  const metrics = [
    ["Net balance", formatCurrency(balance), stats.transactionCount + " transactions"],
    ["Income", formatCurrency(totalIncome), "Avg. " + formatCurrency(stats.averageIncome)],
    ["Expenses", formatCurrency(totalExpenses), "Avg. " + formatCurrency(stats.averageExpense)],
    ["Savings rate", stats.savingsRate + "%", "Share of income retained"],
  ];
  return <dl className="metric-strip">{metrics.map(([name, value, detail]) =>
    <div key={name}><dt className="ledger-label">{name}</dt><dd>{value}</dd><dd>{detail}</dd></div>
  )}</dl>;
}
