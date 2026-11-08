/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { workspacePages } from "../data/workspacePages";
import { useWorkspace } from "./useWorkspace";
import { calculateStats } from "../utils/calculateStats";

const FinanceContext = createContext(null);
const FILTERS_STORAGE_KEY = "finance-dashboard:filters";
const ANIMATION_STORAGE_KEY = "finance-dashboard:animations";
const PAGE_STORAGE_KEY = "finance-dashboard:page";
const emptyRows = [];

function readStoredValue(storageKey, fallbackValue) {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    return storedValue ? JSON.parse(storedValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeStoredValue(storageKey, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Fail silently so storage limits never break the dashboard.
  }
}

function sortByNewest(firstTransaction, secondTransaction) {
  return new Date(secondTransaction.date) - new Date(firstTransaction.date);
}

export function FinanceProvider({ children }) {
  const { workspace, actions, ready, error, setError } = useWorkspace();
  const { currentUser = null, transactions = emptyRows, workspaceUsers = emptyRows,
    workspaceEvents = emptyRows, assetWorkflows = emptyRows, financeNotes = emptyRows,
    workspaceFiles = emptyRows, documents = emptyRows, reports = emptyRows } = workspace || {};
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const storedFilters = readStoredValue(FILTERS_STORAGE_KEY, {});

    return storedFilters.selectedCategory ?? "all";
  });
  const [selectedType, setSelectedType] = useState(() => {
    const storedFilters = readStoredValue(FILTERS_STORAGE_KEY, {});

    return storedFilters.selectedType ?? "all";
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    const storedFilters = readStoredValue(FILTERS_STORAGE_KEY, {});

    return storedFilters.searchQuery ?? "";
  });
  const [animationEnabled, setAnimationEnabled] = useState(() => {
    return readStoredValue(ANIMATION_STORAGE_KEY, true);
  });
  const [pagePreference, setPagePreference] = useState(() => {
    return readStoredValue(PAGE_STORAGE_KEY, "dashboard");
  });
  const role = currentUser?.role ?? "viewer";
  const isAuthenticated = Boolean(currentUser);

  const accessiblePages = useMemo(() => {
    return workspacePages.filter((page) => page.allowedRoles.includes(role));
  }, [role]);

  const currentPage = useMemo(() => {
    return accessiblePages.some((page) => page.id === pagePreference)
      ? pagePreference
      : accessiblePages[0]?.id ?? "dashboard";
  }, [accessiblePages, pagePreference]);

  // Defer search updates so typing feels smooth even while charts recompute.
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filterTransactions = useCallback(
    (options = {}) => {
      const sourceTransactions = options.transactions ?? transactions;
      const activeCategory = options.category ?? selectedCategory;
      const activeType = options.type ?? selectedType;
      const activeQuery = (
        options.searchQuery ?? deferredSearchQuery
      ).trim().toLowerCase();

      return sourceTransactions
        .filter((transaction) => {
          const matchesCategory =
            activeCategory === "all" || transaction.category === activeCategory;
          const matchesType =
            activeType === "all" || transaction.type === activeType;
          const matchesSearch =
            !activeQuery ||
            `${transaction.account} ${transaction.category} ${transaction.type} ${transaction.amount}`
              .toLowerCase()
              .includes(activeQuery);

          return matchesCategory && matchesType && matchesSearch;
        })
        .sort(sortByNewest);
    },
    [deferredSearchQuery, selectedCategory, selectedType, transactions],
  );

  const filteredTransactions = useMemo(() => {
    return filterTransactions();
  }, [filterTransactions]);

  const calculateTotals = useCallback(
    (transactionList = filteredTransactions) => {
      return transactionList.reduce(
        (totals, transaction) => {
          if (transaction.type === "income") {
            totals.totalIncome += transaction.amount;
          }

          if (transaction.type === "expense") {
            totals.totalExpenses += transaction.amount;
          }

          totals.balance = totals.totalIncome - totals.totalExpenses;

          return totals;
        },
        {
          totalIncome: 0,
          totalExpenses: 0,
          balance: 0,
        },
      );
    },
    [filteredTransactions],
  );

  const setCurrentPage = useCallback(
    (nextPageId) => {
      if (accessiblePages.some((page) => page.id === nextPageId)) {
        setPagePreference(nextPageId);
      }
    },
    [accessiblePages],
  );

  const resetFilters = useCallback(() => {
    setSelectedCategory("all");
    setSelectedType("all");
    setSearchQuery("");
  }, []);

  useEffect(() => {
    writeStoredValue(FILTERS_STORAGE_KEY, {
      selectedCategory,
      selectedType,
      searchQuery,
    });
  }, [searchQuery, selectedCategory, selectedType]);

  useEffect(() => {
    writeStoredValue(ANIMATION_STORAGE_KEY, animationEnabled);
  }, [animationEnabled]);

  useEffect(() => {
    writeStoredValue(PAGE_STORAGE_KEY, currentPage);
  }, [currentPage]);

  const totals = useMemo(() => {
    return calculateTotals(filteredTransactions);
  }, [calculateTotals, filteredTransactions]);

  const overallStats = useMemo(() => {
    return calculateStats(transactions);
  }, [transactions]);

  const stats = useMemo(() => {
    return calculateStats(filteredTransactions);
  }, [filteredTransactions]);

  const categories = useMemo(() => {
    return [...new Set(transactions.map((transaction) => transaction.category))].sort();
  }, [transactions]);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (selectedCategory !== "all") {
      count += 1;
    }

    if (selectedType !== "all") {
      count += 1;
    }

    if (searchQuery.trim()) {
      count += 1;
    }

    return count;
  }, [searchQuery, selectedCategory, selectedType]);

  const value = useMemo(
    () => ({
      transactions,
      filteredTransactions,
      totalIncome: totals.totalIncome,
      totalExpenses: totals.totalExpenses,
      balance: totals.balance,
      selectedCategory,
      selectedType,
      searchQuery,
      categories,
      animationEnabled,
      role,
      currentUser,
      isAuthenticated,
      currentPage,
      accessiblePages,
      workspaceUsers,
      workspaceEvents,
      assetWorkflows,
      financeNotes,
      workspaceFiles,
      documents,
      reports,
      stats,
      overallStats,
      activeFilterCount,
      hasActiveFilters: activeFilterCount > 0,
      budgets: workspace?.budgets ?? emptyRows, recurring: workspace?.recurring ?? emptyRows,
      reportRuns: workspace?.reportRuns ?? emptyRows,
      ...actions,
      filterTransactions,
      calculateTotals,
      setSelectedCategory,
      setSelectedType,
      setSearchQuery,
      setAnimationEnabled,
      setCurrentPage,
      resetFilters,
    }),
    [
      actions, workspace,
      accessiblePages,
      activeFilterCount,
      animationEnabled,
      assetWorkflows,
      calculateTotals,
      categories,
      currentPage,
      currentUser,
      documents,
      filteredTransactions,
      filterTransactions,
      financeNotes,
      isAuthenticated,
      overallStats,
      reports,
      resetFilters,
      role,
      searchQuery,
      selectedCategory,
      selectedType,
      setCurrentPage,
      stats,
      totals.balance,
      totals.totalExpenses,
      totals.totalIncome,
      transactions,
      workspaceEvents,
      workspaceFiles,
      workspaceUsers,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>
      {ready ? children : <p role="status" className="p-6">Opening workspace…</p>}
      {error && <div role="alert" className="fixed bottom-4 left-4 z-50 flex items-center gap-4 rounded bg-[var(--finova-surface)] p-4 shadow-lg">
        {error}<button onClick={() => setError("")}>Dismiss</button>
      </div>}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const financeContext = useContext(FinanceContext);

  if (!financeContext) {
    throw new Error("useFinance must be used inside FinanceProvider.");
  }

  return financeContext;
}
