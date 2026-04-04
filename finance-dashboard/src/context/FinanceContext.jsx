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
import {
  seedAssetWorkflows,
  seedDocuments,
  seedFinanceNotes,
  seedReports,
  seedWorkspaceEvents,
  seedWorkspaceFiles,
} from "../data/workspaceContent";
import { transactions as seedTransactions } from "../data/transactions";
import { calculateStats } from "../utils/calculateStats";

const FinanceContext = createContext(null);
const TRANSACTIONS_STORAGE_KEY = "finance-dashboard:transactions";
const FILTERS_STORAGE_KEY = "finance-dashboard:filters";
const ANIMATION_STORAGE_KEY = "finance-dashboard:animations";
const USERS_STORAGE_KEY = "finance-dashboard:users";
const SESSION_STORAGE_KEY = "finance-dashboard:session";
const PAGE_STORAGE_KEY = "finance-dashboard:page";
const EVENTS_STORAGE_KEY = "finance-dashboard:events";
const ASSETS_STORAGE_KEY = "finance-dashboard:asset-workflows";
const NOTES_STORAGE_KEY = "finance-dashboard:finance-notes";
const FILES_STORAGE_KEY = "finance-dashboard:workspace-files";
const DOCUMENTS_STORAGE_KEY = "finance-dashboard:documents";
const REPORTS_STORAGE_KEY = "finance-dashboard:reports";
const LEGACY_ADMIN_NAME = "Ariana Admin";
const LEDGERVIEW_ADMIN_NAME = "Admin";
const LEGACY_VIEWER_NAME = "Victor Viewer";
const LEDGERVIEW_VIEWER_NAME = "Viewer";
const LEGACY_ADMIN_EMAIL = "admin@finova.app";
const LEDGERVIEW_ADMIN_EMAIL = "admin@ledgerview.app";
const LEGACY_VIEWER_EMAIL = "viewer@finova.app";
const LEDGERVIEW_VIEWER_EMAIL = "viewer@ledgerview.app";

const demoUsers = [
  {
    id: 1,
    name: LEDGERVIEW_ADMIN_NAME,
    email: LEDGERVIEW_ADMIN_EMAIL,
    password: "admin123",
    role: "admin",
  },
  {
    id: 2,
    name: LEDGERVIEW_VIEWER_NAME,
    email: LEDGERVIEW_VIEWER_EMAIL,
    password: "viewer123",
    role: "viewer",
  },
];

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

function sortByLatestDateField(items, dateField) {
  return [...items].sort((firstItem, secondItem) => {
    return new Date(secondItem[dateField]) - new Date(firstItem[dateField]);
  });
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password: _password, ...safeUser } = user;

  return safeUser;
}

function migrateStoredUser(user) {
  if (!user) {
    return user;
  }

  if (user.role === "admin") {
    const migratedAdminName =
      user.name === LEGACY_ADMIN_NAME ? LEDGERVIEW_ADMIN_NAME : user.name;
    const migratedAdminEmail =
      user.email?.toLowerCase() === LEGACY_ADMIN_EMAIL
        ? LEDGERVIEW_ADMIN_EMAIL
        : user.email;

    return {
      ...user,
      name: migratedAdminName,
      email: migratedAdminEmail,
    };
  }

  if (user.role === "viewer") {
    const migratedViewerName =
      user.name === LEGACY_VIEWER_NAME ? LEDGERVIEW_VIEWER_NAME : user.name;
    const migratedViewerEmail =
      user.email?.toLowerCase() === LEGACY_VIEWER_EMAIL
        ? LEDGERVIEW_VIEWER_EMAIL
        : user.email;

    return {
      ...user,
      name: migratedViewerName,
      email: migratedViewerEmail,
    };
  }

  return user;
}

function migrateWorkspacePersonName(name) {
  return name === LEGACY_ADMIN_NAME ? LEDGERVIEW_ADMIN_NAME : name;
}

function migrateWorkspaceEvents(events) {
  return events.map((eventItem) => ({
    ...eventItem,
    createdBy: migrateWorkspacePersonName(eventItem.createdBy),
  }));
}

function migrateAssetWorkflows(assets) {
  return assets.map((asset) => ({
    ...asset,
    owner: migrateWorkspacePersonName(asset.owner),
  }));
}

function migrateFinanceNotes(notes) {
  return notes.map((note) => ({
    ...note,
    author: migrateWorkspacePersonName(note.author),
  }));
}

function isAllowedRole(role) {
  return role === "admin" || role === "viewer";
}

function getNextId(items) {
  return items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, bytes / 1024).toFixed(1)} KB`;
}

function buildWorkspaceFileSize(content) {
  const contentBytes = new Blob([content]).size;

  return formatBytes(contentBytes);
}

function validateUserDraft(userDraft, existingUsers) {
  const trimmedName = userDraft.name.trim();
  const normalizedEmail = userDraft.email.trim().toLowerCase();
  const trimmedPassword = userDraft.password.trim();

  if (!trimmedName) {
    return { success: false, message: "Enter a full name to continue." };
  }

  if (!normalizedEmail) {
    return { success: false, message: "Enter an email address to continue." };
  }

  if (trimmedPassword.length < 6) {
    return {
      success: false,
      message: "Use a password with at least 6 characters.",
    };
  }

  if (!isAllowedRole(userDraft.role)) {
    return {
      success: false,
      message: "Choose whether the account should be Viewer or Admin.",
    };
  }

  if (
    existingUsers.some((user) => user.email.toLowerCase() === normalizedEmail)
  ) {
    return {
      success: false,
      message: "An account with that email already exists.",
    };
  }

  return {
    success: true,
    nextUser: {
      id: getNextId(existingUsers),
      name: trimmedName,
      email: normalizedEmail,
      password: userDraft.password,
      role: userDraft.role,
    },
  };
}

function persistAuthUsers(users) {
  writeStoredValue(USERS_STORAGE_KEY, users);
}

function persistAuthSession(user) {
  writeStoredValue(SESSION_STORAGE_KEY, user);
}

export function FinanceProvider({ children }) {
  const [transactions, setTransactions] = useState(() => {
    return readStoredValue(TRANSACTIONS_STORAGE_KEY, seedTransactions);
  });
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
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    return readStoredValue(USERS_STORAGE_KEY, demoUsers).map(migrateStoredUser);
  });
  const [currentUser, setCurrentUser] = useState(() => {
    return migrateStoredUser(readStoredValue(SESSION_STORAGE_KEY, null));
  });
  const [pagePreference, setPagePreference] = useState(() => {
    return readStoredValue(PAGE_STORAGE_KEY, "dashboard");
  });
  const [workspaceEvents, setWorkspaceEvents] = useState(() => {
    return migrateWorkspaceEvents(readStoredValue(EVENTS_STORAGE_KEY, seedWorkspaceEvents));
  });
  const [assetWorkflows, setAssetWorkflows] = useState(() => {
    return migrateAssetWorkflows(
      readStoredValue(ASSETS_STORAGE_KEY, seedAssetWorkflows),
    );
  });
  const [financeNotes, setFinanceNotes] = useState(() => {
    return migrateFinanceNotes(readStoredValue(NOTES_STORAGE_KEY, seedFinanceNotes));
  });
  const [workspaceFiles, setWorkspaceFiles] = useState(() => {
    return readStoredValue(FILES_STORAGE_KEY, seedWorkspaceFiles);
  });
  const [documents, setDocuments] = useState(() => {
    return readStoredValue(DOCUMENTS_STORAGE_KEY, seedDocuments);
  });
  const [reports, setReports] = useState(() => {
    return readStoredValue(REPORTS_STORAGE_KEY, seedReports);
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

  const workspaceUsers = useMemo(() => {
    return registeredUsers.map((user) => sanitizeUser(user));
  }, [registeredUsers]);

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

  const addTransaction = useCallback((transaction) => {
    setTransactions((currentTransactions) => {
      const nextId =
        currentTransactions.length > 0
          ? Math.max(...currentTransactions.map((item) => item.id)) + 1
          : 1;

      return [
        {
          ...transaction,
          id: transaction.id ?? nextId,
        },
        ...currentTransactions,
      ].sort(sortByNewest);
    });
  }, []);

  const updateTransaction = useCallback((updatedTransaction) => {
    setTransactions((currentTransactions) => {
      return currentTransactions
        .map((transaction) => {
          if (transaction.id !== updatedTransaction.id) {
            return transaction;
          }

          return {
            ...transaction,
            ...updatedTransaction,
          };
        })
        .sort(sortByNewest);
    });
  }, []);

  const deleteTransaction = useCallback((transactionId) => {
    setTransactions((currentTransactions) => {
      return currentTransactions.filter((transaction) => {
        return transaction.id !== transactionId;
      });
    });

    return { success: true };
  }, []);

  const createEvent = useCallback(
    ({ title, detail, amount = 0, date, type = "info" }) => {
      const trimmedTitle = title.trim();
      const trimmedDetail = detail.trim();
      const parsedAmount = Number.parseFloat(amount || 0);

      if (!trimmedTitle || !trimmedDetail) {
        return {
          success: false,
          message: "Provide both an event title and description.",
        };
      }

      const nextEvent = {
        id: 0,
        title: trimmedTitle,
        detail: trimmedDetail,
        amount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
        date: date || getTodayIsoDate(),
        createdBy: currentUser?.name ?? "Admin",
        type,
      };

      setWorkspaceEvents((currentEvents) => {
        const completeEvent = {
          ...nextEvent,
          id: getNextId(currentEvents),
        };

        return sortByLatestDateField([...currentEvents, completeEvent], "date");
      });

      return { success: true };
    },
    [currentUser],
  );

  const deleteEvent = useCallback((eventId) => {
    setWorkspaceEvents((currentEvents) => {
      return currentEvents.filter((eventItem) => eventItem.id !== eventId);
    });

    return { success: true };
  }, []);

  const createAssetWorkflow = useCallback(
    ({ title, status, owner, summary }) => {
      const trimmedTitle = title.trim();
      const trimmedStatus = status.trim();
      const trimmedOwner = owner.trim();
      const trimmedSummary = summary.trim();

      if (!trimmedTitle || !trimmedStatus || !trimmedOwner || !trimmedSummary) {
        return {
          success: false,
          message: "Complete all asset workflow fields before saving.",
        };
      }

      setAssetWorkflows((currentAssets) => {
        const nextAsset = {
          id: getNextId(currentAssets),
          title: trimmedTitle,
          status: trimmedStatus,
          owner: trimmedOwner,
          summary: trimmedSummary,
        };

        return [nextAsset, ...currentAssets];
      });

      return { success: true };
    },
    [],
  );

  const updateAssetWorkflow = useCallback((assetId, updates) => {
    const trimmedTitle = updates.title.trim();
    const trimmedStatus = updates.status.trim();
    const trimmedOwner = updates.owner.trim();
    const trimmedSummary = updates.summary.trim();

    if (!trimmedTitle || !trimmedStatus || !trimmedOwner || !trimmedSummary) {
      return {
        success: false,
        message: "Complete all workflow fields before saving changes.",
      };
    }

    setAssetWorkflows((currentAssets) => {
      return currentAssets.map((asset) => {
        return asset.id === assetId
          ? {
              ...asset,
              title: trimmedTitle,
              status: trimmedStatus,
              owner: trimmedOwner,
              summary: trimmedSummary,
            }
          : asset;
      });
    });

    return { success: true };
  }, []);

  const deleteAssetWorkflow = useCallback((assetId) => {
    setAssetWorkflows((currentAssets) => {
      return currentAssets.filter((asset) => asset.id !== assetId);
    });

    return { success: true };
  }, []);

  const addFinanceNote = useCallback(
    ({ title, content }) => {
      const trimmedTitle = title.trim();
      const trimmedContent = content.trim();

      if (!trimmedTitle || !trimmedContent) {
        return {
          success: false,
          message: "Add both a finance note title and body.",
        };
      }

      setFinanceNotes((currentNotes) => {
        const nextNote = {
          id: getNextId(currentNotes),
          title: trimmedTitle,
          content: trimmedContent,
          author: currentUser?.name ?? "Admin",
          createdAt: getTodayIsoDate(),
        };

        return sortByLatestDateField([...currentNotes, nextNote], "createdAt");
      });

      return { success: true };
    },
    [currentUser],
  );

  const deleteFinanceNote = useCallback((noteId) => {
    setFinanceNotes((currentNotes) => {
      return currentNotes.filter((note) => note.id !== noteId);
    });

    return { success: true };
  }, []);

  const inviteMember = useCallback(
    (userDraft) => {
      const validationResult = validateUserDraft(userDraft, registeredUsers);

      if (!validationResult.success) {
        return validationResult;
      }

      setRegisteredUsers((currentUsers) => {
        return [...currentUsers, validationResult.nextUser];
      });

      return {
        success: true,
        message: `Invitation saved for ${validationResult.nextUser.email}.`,
      };
    },
    [registeredUsers],
  );

  const deleteMember = useCallback(
    (memberId) => {
      if (currentUser?.id === memberId) {
        return {
          success: false,
          message: "You cannot delete the account that is currently signed in.",
        };
      }

      setRegisteredUsers((currentUsers) => {
        return currentUsers.filter((user) => user.id !== memberId);
      });

      return { success: true };
    },
    [currentUser],
  );

  const uploadWorkspaceFile = useCallback(
    ({ name, content }) => {
      const trimmedName = name.trim();
      const trimmedContent = content.trim();

      if (!trimmedName || !trimmedContent) {
        return {
          success: false,
          message: "Provide both a file name and file content.",
        };
      }

      setWorkspaceFiles((currentFiles) => {
        const nextFile = {
          id: getNextId(currentFiles),
          name: trimmedName,
          owner: currentUser?.name ?? "Admin",
          size: buildWorkspaceFileSize(trimmedContent),
          updatedAt: getTodayIsoDate(),
          content: trimmedContent,
        };

        return sortByLatestDateField([...currentFiles, nextFile], "updatedAt");
      });

      return { success: true };
    },
    [currentUser],
  );

  const deleteWorkspaceFile = useCallback((fileId) => {
    setWorkspaceFiles((currentFiles) => {
      return currentFiles.filter((fileItem) => fileItem.id !== fileId);
    });

    return { success: true };
  }, []);

  const updateDocument = useCallback((documentId, updates) => {
    const trimmedTitle = updates.title.trim();
    const trimmedSummary = updates.summary.trim();
    const trimmedBody = updates.body.trim();

    if (!trimmedTitle || !trimmedSummary || !trimmedBody) {
      return {
        success: false,
        message: "Complete the title, summary, and body before saving.",
      };
    }

    setDocuments((currentDocuments) => {
      return currentDocuments.map((documentItem) => {
        return documentItem.id === documentId
          ? {
              ...documentItem,
              title: trimmedTitle,
              summary: trimmedSummary,
              body: trimmedBody,
              updatedAt: getTodayIsoDate(),
            }
          : documentItem;
      });
    });

    return { success: true };
  }, []);

  const deleteDocument = useCallback((documentId) => {
    setDocuments((currentDocuments) => {
      return currentDocuments.filter((documentItem) => documentItem.id !== documentId);
    });

    return { success: true };
  }, []);

  const runReports = useCallback(() => {
    const runDate = getTodayIsoDate();

    setReports((currentReports) => {
      return currentReports.map((report) => ({
        ...report,
        lastRunAt: runDate,
        runCount: report.runCount + 1,
        status: "Generated",
      }));
    });

    return {
      success: true,
      generatedCount: reports.length,
      generatedAt: runDate,
    };
  }, [reports.length]);

  const deleteReport = useCallback((reportId) => {
    setReports((currentReports) => {
      return currentReports.filter((report) => report.id !== reportId);
    });

    return { success: true };
  }, []);

  const setCurrentPage = useCallback(
    (nextPageId) => {
      if (accessiblePages.some((page) => page.id === nextPageId)) {
        setPagePreference(nextPageId);
      }
    },
    [accessiblePages],
  );

  const signIn = useCallback(
    ({ email, password }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const matchingUser = registeredUsers.find((user) => {
        return (
          user.email.toLowerCase() === normalizedEmail &&
          user.password === password
        );
      });

      if (!matchingUser) {
        return {
          success: false,
          message: "Incorrect email or password. Try one of the demo accounts.",
        };
      }

      const safeUser = sanitizeUser(matchingUser);

      setCurrentUser(safeUser);
      setPagePreference("dashboard");
      persistAuthSession(safeUser);
      writeStoredValue(PAGE_STORAGE_KEY, "dashboard");

      return { success: true };
    },
    [registeredUsers],
  );

  const signUp = useCallback(
    (userDraft) => {
      const validationResult = validateUserDraft(userDraft, registeredUsers);

      if (!validationResult.success) {
        return validationResult;
      }

      const safeUser = sanitizeUser(validationResult.nextUser);

      setRegisteredUsers((currentUsers) => {
        const nextUsers = [...currentUsers, validationResult.nextUser];
        persistAuthUsers(nextUsers);
        return nextUsers;
      });
      setCurrentUser(safeUser);
      setPagePreference("dashboard");
      persistAuthSession(safeUser);
      writeStoredValue(PAGE_STORAGE_KEY, "dashboard");

      return { success: true };
    },
    [registeredUsers],
  );

  const signOut = useCallback(() => {
    setCurrentUser(null);
    setPagePreference("dashboard");
    persistAuthSession(null);
    writeStoredValue(PAGE_STORAGE_KEY, "dashboard");
  }, []);

  const setRole = useCallback(
    (nextRole) => {
      if (!currentUser || !isAllowedRole(nextRole)) {
        return;
      }

      setCurrentUser((existingUser) => {
        return existingUser
          ? {
              ...existingUser,
              role: nextRole,
            }
          : existingUser;
      });
      setRegisteredUsers((currentUsers) => {
        return currentUsers.map((user) => {
          return user.id === currentUser.id
            ? {
                ...user,
                role: nextRole,
              }
            : user;
        });
      });
    },
    [currentUser],
  );

  const resetFilters = useCallback(() => {
    setSelectedCategory("all");
    setSelectedType("all");
    setSearchQuery("");
  }, []);

  useEffect(() => {
    writeStoredValue(TRANSACTIONS_STORAGE_KEY, transactions);
  }, [transactions]);

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
    writeStoredValue(USERS_STORAGE_KEY, registeredUsers);
  }, [registeredUsers]);

  useEffect(() => {
    writeStoredValue(SESSION_STORAGE_KEY, currentUser);
  }, [currentUser]);

  useEffect(() => {
    writeStoredValue(PAGE_STORAGE_KEY, currentPage);
  }, [currentPage]);

  useEffect(() => {
    writeStoredValue(EVENTS_STORAGE_KEY, workspaceEvents);
  }, [workspaceEvents]);

  useEffect(() => {
    writeStoredValue(ASSETS_STORAGE_KEY, assetWorkflows);
  }, [assetWorkflows]);

  useEffect(() => {
    writeStoredValue(NOTES_STORAGE_KEY, financeNotes);
  }, [financeNotes]);

  useEffect(() => {
    writeStoredValue(FILES_STORAGE_KEY, workspaceFiles);
  }, [workspaceFiles]);

  useEffect(() => {
    writeStoredValue(DOCUMENTS_STORAGE_KEY, documents);
  }, [documents]);

  useEffect(() => {
    writeStoredValue(REPORTS_STORAGE_KEY, reports);
  }, [reports]);

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
      addTransaction,
      updateTransaction,
      deleteTransaction,
      createEvent,
      deleteEvent,
      createAssetWorkflow,
      updateAssetWorkflow,
      deleteAssetWorkflow,
      addFinanceNote,
      deleteFinanceNote,
      inviteMember,
      deleteMember,
      uploadWorkspaceFile,
      deleteWorkspaceFile,
      updateDocument,
      deleteDocument,
      runReports,
      deleteReport,
      filterTransactions,
      calculateTotals,
      setSelectedCategory,
      setSelectedType,
      setSearchQuery,
      setAnimationEnabled,
      setRole,
      setCurrentPage,
      signIn,
      signUp,
      signOut,
      resetFilters,
    }),
    [
      accessiblePages,
      activeFilterCount,
      addFinanceNote,
      addTransaction,
      animationEnabled,
      assetWorkflows,
      calculateTotals,
      categories,
      createAssetWorkflow,
      createEvent,
      currentPage,
      currentUser,
      deleteAssetWorkflow,
      deleteDocument,
      deleteEvent,
      deleteFinanceNote,
      deleteMember,
      deleteReport,
      deleteTransaction,
      deleteWorkspaceFile,
      documents,
      filteredTransactions,
      filterTransactions,
      financeNotes,
      inviteMember,
      isAuthenticated,
      overallStats,
      reports,
      resetFilters,
      role,
      runReports,
      searchQuery,
      selectedCategory,
      selectedType,
      setCurrentPage,
      setRole,
      signIn,
      signOut,
      signUp,
      stats,
      totals.balance,
      totals.totalExpenses,
      totals.totalIncome,
      transactions,
      updateAssetWorkflow,
      updateDocument,
      updateTransaction,
      uploadWorkspaceFile,
      workspaceEvents,
      workspaceFiles,
      workspaceUsers,
    ],
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const financeContext = useContext(FinanceContext);

  if (!financeContext) {
    throw new Error("useFinance must be used inside FinanceProvider.");
  }

  return financeContext;
}
