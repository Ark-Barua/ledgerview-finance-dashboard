const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

const fullDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
});

function createDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getLatestTransactionDate(transactions) {
  if (!transactions.length) {
    return null;
  }

  return transactions.reduce((latestDate, transaction) => {
    const transactionDate = createDate(transaction.date);

    return transactionDate > latestDate ? transactionDate : latestDate;
  }, createDate(transactions[0].date));
}

function getPeriodStart(transactions, period) {
  if (period === "all") {
    return null;
  }

  const latestDate = getLatestTransactionDate(transactions);

  if (!latestDate) {
    return null;
  }

  // Anchor demo filters to the latest record so the UI stays stable over time.
  const periodStart = new Date(latestDate);

  if (period === "30d") {
    periodStart.setDate(periodStart.getDate() - 29);
    return periodStart;
  }

  if (period === "90d") {
    periodStart.setDate(periodStart.getDate() - 89);
    return periodStart;
  }

  if (period === "ytd") {
    return new Date(latestDate.getFullYear(), 0, 1);
  }

  return null;
}

export function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

export function formatCompactCurrency(amount) {
  return compactCurrencyFormatter.format(amount);
}

export function formatNumber(value) {
  return numberFormatter.format(value);
}

export function formatDate(dateString) {
  return fullDateFormatter.format(createDate(dateString));
}

export function filterTransactions(transactions, filters) {
  const searchTerm = filters.search.trim().toLowerCase();
  const periodStart = getPeriodStart(transactions, filters.period);

  return transactions
    .filter((transaction) => {
      const matchesType =
        filters.type === "all" || transaction.type === filters.type;
      const matchesCategory =
        filters.category === "all" || transaction.category === filters.category;
      const matchesAccount =
        filters.account === "all" || transaction.account === filters.account;
      const matchesPeriod =
        !periodStart || createDate(transaction.date) >= periodStart;
      const matchesSearch =
        !searchTerm ||
        `${transaction.description} ${transaction.merchant} ${transaction.category} ${transaction.account}`
          .toLowerCase()
          .includes(searchTerm);

      return (
        matchesType &&
        matchesCategory &&
        matchesAccount &&
        matchesPeriod &&
        matchesSearch
      );
    })
    .sort((leftTransaction, rightTransaction) => {
      return createDate(rightTransaction.date) - createDate(leftTransaction.date);
    });
}

export function calculateStats(transactions) {
  const sortedTransactions = [...transactions].sort(
    (leftTransaction, rightTransaction) => {
      return (
        createDate(leftTransaction.date) - createDate(rightTransaction.date)
      );
    },
  );

  const incomeTransactions = sortedTransactions.filter(
    (transaction) => transaction.type === "income",
  );
  const expenseTransactions = sortedTransactions.filter(
    (transaction) => transaction.type === "expense",
  );

  const totalIncome = incomeTransactions.reduce(
    (runningTotal, transaction) => runningTotal + transaction.amount,
    0,
  );
  const totalExpenses = expenseTransactions.reduce(
    (runningTotal, transaction) => runningTotal + transaction.amount,
    0,
  );
  const balance = totalIncome - totalExpenses;
  const savingsRate =
    totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0;

  const categoryTotalsMap = expenseTransactions.reduce(
    (totalsByCategory, transaction) => {
      totalsByCategory[transaction.category] =
        (totalsByCategory[transaction.category] ?? 0) + transaction.amount;

      return totalsByCategory;
    },
    {},
  );

  const categoryTotals = Object.entries(categoryTotalsMap)
    .map(([category, amount]) => ({
      category,
      amount,
      share: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort(
      (leftCategory, rightCategory) => rightCategory.amount - leftCategory.amount,
    );

  const largestExpense = expenseTransactions.reduce(
    (largestTransaction, transaction) => {
      if (!largestTransaction || transaction.amount > largestTransaction.amount) {
        return transaction;
      }

      return largestTransaction;
    },
    null,
  );

  const monthlyTrendMap = sortedTransactions.reduce(
    (trendByMonth, transaction) => {
      const transactionDate = createDate(transaction.date);
      const year = transactionDate.getFullYear();
      const month = `${transactionDate.getMonth() + 1}`.padStart(2, "0");
      const monthKey = `${year}-${month}`;

      if (!trendByMonth[monthKey]) {
        trendByMonth[monthKey] = {
          label: monthFormatter.format(transactionDate),
          income: 0,
          expense: 0,
        };
      }

      if (transaction.type === "income") {
        trendByMonth[monthKey].income += transaction.amount;
      } else {
        trendByMonth[monthKey].expense += transaction.amount;
      }

      return trendByMonth;
    },
    {},
  );

  const monthlyTrend = Object.entries(monthlyTrendMap)
    .sort(([leftMonth], [rightMonth]) => leftMonth.localeCompare(rightMonth))
    .map(([, monthData]) => ({
      ...monthData,
      net: monthData.income - monthData.expense,
    }));

  const latestMonth = monthlyTrend.at(-1);
  const previousMonth = monthlyTrend.at(-2);
  const monthlyExpenseChange =
    latestMonth && previousMonth && previousMonth.expense > 0
      ? ((latestMonth.expense - previousMonth.expense) / previousMonth.expense) *
        100
      : null;

  return {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate,
    transactionCount: sortedTransactions.length,
    averageIncome:
      incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0,
    averageExpense:
      expenseTransactions.length > 0
        ? totalExpenses / expenseTransactions.length
        : 0,
    pendingCount: sortedTransactions.filter(
      (transaction) => transaction.status === "pending",
    ).length,
    categoryTotals,
    topCategory: categoryTotals[0] ?? null,
    largestExpense,
    monthlyTrend,
    monthlyExpenseChange,
    latestTransaction: sortedTransactions.at(-1) ?? null,
  };
}
