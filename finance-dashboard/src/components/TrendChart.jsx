import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { useFinance } from "../context/FinanceContext";
import {
  formatCompactCurrency,
  formatCurrency,
} from "../utils/calculateStats";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

const monthLabelFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
});

const trendViewOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

function createDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getTrendBucket(dateString, trendView) {
  const transactionDate = createDate(dateString);
  const year = transactionDate.getFullYear();

  if (trendView === "yearly") {
    return {
      key: `${year}`,
      label: `${year}`,
    };
  }

  if (trendView === "quarterly") {
    const quarter = Math.floor(transactionDate.getMonth() / 3) + 1;

    return {
      key: `${year}-Q${quarter}`,
      label: `Q${quarter} ${year}`,
    };
  }

  const month = `${transactionDate.getMonth() + 1}`.padStart(2, "0");

  return {
    key: `${year}-${month}`,
    label: monthLabelFormatter.format(transactionDate),
  };
}

function buildTrendSeries(transactions, trendView) {
  // Group filtered transactions into the selected time bucket for the chart.
  const trendMap = transactions.reduce((seriesByBucket, transaction) => {
    const { key, label } = getTrendBucket(transaction.date, trendView);

    if (!seriesByBucket[key]) {
      seriesByBucket[key] = {
        label,
        income: 0,
        expense: 0,
      };
    }

    if (transaction.type === "income") {
      seriesByBucket[key].income += transaction.amount;
    } else {
      seriesByBucket[key].expense += transaction.amount;
    }

    return seriesByBucket;
  }, {});

  return Object.entries(trendMap)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([, value]) => ({
      ...value,
      net: value.income - value.expense,
    }));
}

function getDisplayLabel(label, trendView, isMobileViewport) {
  if (!isMobileViewport) {
    return label;
  }

  if (trendView === "monthly") {
    return label.split(" ")[0];
  }

  if (trendView === "quarterly") {
    return label.split(" ")[0];
  }

  return label;
}

function getChartOptions(isDarkMode, animationEnabled, isMobileViewport) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: isMobileViewport ? 4 : 10,
        right: isMobileViewport ? 10 : 14,
        top: 4,
        bottom: 0,
      },
    },
    animation: animationEnabled && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? {
          duration: 650,
          easing: "easeOutQuart",
        }
      : false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDarkMode ? "#11172a" : "#20253b",
        borderColor: isDarkMode ? "rgba(148, 163, 184, 0.16)" : "#e8ebf5",
        borderWidth: 1,
        padding: 12,
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
        callbacks: {
          label(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        offset: true,
        grid: {
          display: false,
        },
        ticks: {
          color: isDarkMode ? "#98a2ba" : "#8f95ab",
          autoSkip: true,
          maxTicksLimit: isMobileViewport ? 4 : 6,
          maxRotation: 0,
          padding: isMobileViewport ? 6 : 8,
          font: {
            size: isMobileViewport ? 10 : 11,
            weight: 600,
          },
        },
      },
      y: {
        border: {
          display: false,
        },
        grid: {
          drawTicks: false,
          color: isDarkMode
            ? "rgba(148, 163, 184, 0.12)"
            : "rgba(143, 149, 171, 0.12)",
        },
        ticks: {
          color: isDarkMode ? "#98a2ba" : "#8f95ab",
          maxTicksLimit: isMobileViewport ? 5 : 6,
          callback(value) {
            return formatCompactCurrency(Number(value));
          },
        },
      },
    },
  };
}

export default function TrendChart({ isDarkMode = false }) {
  const { animationEnabled, filteredTransactions } = useFinance();
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 640 : false;
  });
  const [trendView, setTrendView] = useState("monthly");

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateViewport = (event) => setIsMobileViewport(event.matches);

    mediaQuery.addEventListener("change", updateViewport);

    return () => {
      mediaQuery.removeEventListener("change", updateViewport);
    };
  }, []);

  const trendSeries = useMemo(() => {
    return buildTrendSeries(filteredTransactions, trendView);
  }, [filteredTransactions, trendView]);

  const selectedTrendOption = trendViewOptions.find((option) => {
    return option.value === trendView;
  });
  const latestPeriod = trendSeries.at(-1);
  const isSinglePeriodView = trendSeries.length === 1;
  const chartOptions = getChartOptions(
    isDarkMode,
    animationEnabled,
    isMobileViewport,
  );
  const chartData = {
    labels: trendSeries.map((period) => {
      return getDisplayLabel(period.label, trendView, isMobileViewport);
    }),
    datasets: [
      {
        label: "Income",
        data: trendSeries.map((period) => period.income),
        borderColor: "#298667",
        backgroundColor: "rgba(41, 134, 103, 0.08)",
        borderWidth: 3,
        pointRadius: isSinglePeriodView ? 5 : 0,
        pointHoverRadius: isSinglePeriodView ? 7 : 5,
        pointBackgroundColor: "#298667",
        pointBorderColor: "#ffffff",
        pointBorderWidth: isSinglePeriodView ? 2 : 0,
        tension: 0.38,
        fill: false,
      },
      {
        label: "Expenses",
        data: trendSeries.map((period) => period.expense),
        borderColor: "#c27343",
        backgroundColor: "rgba(194, 115, 67, 0.08)",
        borderWidth: 3,
        pointRadius: isSinglePeriodView ? 5 : 0,
        pointHoverRadius: isSinglePeriodView ? 7 : 5,
        pointBackgroundColor: "#c27343",
        pointBorderColor: "#ffffff",
        pointBorderWidth: isSinglePeriodView ? 2 : 0,
        tension: 0.38,
        fill: false,
      },
    ],
  };

  return (
    <section className="finova-card h-full w-full min-w-0 max-w-full overflow-hidden px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-xl">
          <p className="text-lg font-semibold text-[var(--finova-text)]">
            Cash flow
          </p>
          <p className="mt-1 text-sm text-[var(--finova-muted)]">
            {selectedTrendOption?.label ?? "Monthly"} income and expenses.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="relative block w-full sm:w-auto">
            <span className="sr-only">Select trend period</span>
            <select
              className="h-11 w-full appearance-none rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-bg-soft)] px-3 pr-10 text-sm font-medium text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)] focus:bg-[var(--finova-surface)] sm:min-w-[160px]"
              value={trendView}
              onChange={(event) => setTrendView(event.target.value)}
            >
              {trendViewOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--finova-muted)]" />
          </label>

          <div className="inline-flex w-full items-center rounded-2xl bg-[var(--finova-accent-soft)] px-3 py-2 text-sm font-medium text-[var(--finova-accent)] sm:w-auto">
            Latest net: {formatCurrency(latestPeriod?.net ?? 0)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--finova-muted)]">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#298667]" />
          Income
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#c27343]" />
          Expenses
        </div>
      </div>

      {trendSeries.length > 0 ? (
        <div className="finova-card-soft mt-5 w-full min-w-0 overflow-hidden p-3 sm:p-4">
          <div className="h-[280px] sm:h-[360px]">
            <Line data={chartData} options={chartOptions} />
          </div>

          {isSinglePeriodView ? (
            <p className="mt-3 text-sm text-[var(--finova-muted)]">
              This view currently has one aggregated period, so the chart shows a
              single point instead of a full line.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="finova-card-soft mt-5 flex h-[320px] items-center justify-center p-6 text-sm text-[var(--finova-muted)]">
          No monthly trend data matches the current filters.
        </div>
      )}
    </section>
  );
}
