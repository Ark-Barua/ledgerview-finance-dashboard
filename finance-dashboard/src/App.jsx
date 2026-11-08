import { motion } from "framer-motion";
import {
  Download,
  Menu,
  MoonStar,
  Search,
  Sparkles,
  SunMedium,
  X,
} from "lucide-react";
import {
  createElement,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import AuthScreen from "./components/AuthScreen";
import BrandLogo from "./components/BrandLogo";
import RoleSwitcher from "./components/RoleSwitcher";
import { FinanceProvider, useFinance } from "./context/FinanceContext";
import { workspacePages } from "./data/workspacePages";
const AdminCenter = lazy(() => import("./pages/AdminCenter"));
const AssetGraph = lazy(() => import("./pages/AssetGraph"));
const AssetManagement = lazy(() => import("./pages/AssetManagement"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Document = lazy(() => import("./pages/Document"));
const Events = lazy(() => import("./pages/Events"));
const FileManager = lazy(() => import("./pages/FileManager"));
const Finance = lazy(() => import("./pages/Finance"));
const Members = lazy(() => import("./pages/Members"));
const Reports = lazy(() => import("./pages/Reports"));

const THEME_STORAGE_KEY = "finance-dashboard:theme";
const AUTH_ROUTE_PATH = "/auth";
const MotionSection = motion.section;

const pageComponents = {
  dashboard: Dashboard,
  planning: lazy(() => import("./pages/Planning")),
  profile: lazy(() => import("./pages/Profile")),
  "asset-graph": AssetGraph,
  events: Events,
  "asset-management": AssetManagement,
  finance: Finance,
  members: Members,
  "file-manager": FileManager,
  document: Document,
  reports: Reports,
  "admin-center": AdminCenter,
};

function readPreference(storageKey, fallbackValue) {
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

function writePreference(storageKey, value) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Preference storage should never block the dashboard.
  }
}

function buildCsvContent(transactions) {
  const headers = ["id", "date", "account", "category", "type", "amount"];
  const escapeValue = (value) => {
    const stringValue = `${value ?? ""}`;

    return `"${stringValue.replaceAll('"', '""')}"`;
  };

  const rows = transactions.map((transaction) => {
    return headers.map((header) => escapeValue(transaction[header])).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

function getNormalizedPathname(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function getBrowserPathname() {
  if (typeof window === "undefined") {
    return "/";
  }

  return getNormalizedPathname(window.location.pathname);
}

function subscribeToPathname(onStoreChange) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handlePathnameChange = () => onStoreChange();

  window.addEventListener("popstate", handlePathnameChange);
  window.addEventListener("pathnamechange", handlePathnameChange);

  return () => {
    window.removeEventListener("popstate", handlePathnameChange);
    window.removeEventListener("pathnamechange", handlePathnameChange);
  };
}

function navigateBrowserPath(nextPath, options = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedPath = getNormalizedPathname(nextPath);

  if (getBrowserPathname() === normalizedPath) {
    return;
  }

  const historyMethod = options.replace ? "replaceState" : "pushState";
  window.history[historyMethod]({}, "", normalizedPath);
  window.dispatchEvent(new Event("pathnamechange"));
}

function WorkspaceApp() {
  const {
    accessiblePages,
    currentUser,
    animationEnabled,
    currentPage,
    filteredTransactions,
    isAuthenticated,
    searchQuery,
    setAnimationEnabled,
    setCurrentPage,
    setSearchQuery,
  } = useFinance();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return readPreference(THEME_STORAGE_KEY, false);
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth >= 1024 : false;
  });
  const pathname = useSyncExternalStore(
    subscribeToPathname,
    getBrowserPathname,
    () => "/",
  );

  const pagesById = useMemo(() => {
    return new Map(workspacePages.map((page) => [page.id, page]));
  }, []);

  const pagesByPath = useMemo(() => {
    return new Map(workspacePages.map((page) => [page.path, page]));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", isDarkMode);
    writePreference(THEME_STORAGE_KEY, isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleViewportChange = (event) => {
      setIsDesktopViewport(event.matches);

      if (event.matches) {
        setIsSidebarOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    if (!isSidebarOpen || isDesktopViewport) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDesktopViewport, isSidebarOpen]);

  const navigateToPath = useCallback((nextPath, options = {}) => {
    navigateBrowserPath(nextPath, options);
  }, []);

  const navigateToPage = useCallback(
    (pageId, options = {}) => {
      const nextPage = pagesById.get(pageId);

      if (!nextPage) {
        return;
      }

      setCurrentPage(nextPage.id);
      navigateToPath(nextPage.path, options);
    },
    [navigateToPath, pagesById, setCurrentPage],
  );

  const fallbackPage =
    accessiblePages.find((page) => page.id === currentPage) ?? accessiblePages[0];
  const routePage = pagesByPath.get(pathname);
  const isRouteAllowed = routePage
    ? accessiblePages.some((page) => page.id === routePage.id)
    : false;
  const activePage =
    isRouteAllowed && routePage ? routePage : fallbackPage ?? workspacePages[0];
  const PageComponent = pageComponents[activePage.id] ?? Dashboard;

  const handleExportCsv = useCallback(() => {
    if (!filteredTransactions.length) {
      return;
    }

    const csvContent = buildCsvContent(filteredTransactions);
    const csvBlob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const downloadUrl = window.URL.createObjectURL(csvBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = `transactions-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    downloadLink.click();

    window.URL.revokeObjectURL(downloadUrl);
  }, [filteredTransactions]);

  const getSectionMotion = useCallback(
    (delay = 0) => {
      if (!animationEnabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return {};
      }

      return {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: {
          duration: 0.42,
          delay,
          ease: [0.22, 1, 0.36, 1],
        },
      };
    },
    [animationEnabled],
  );

  const headerActionButtons = useMemo(() => {
    return [
      {
        icon: isDarkMode ? SunMedium : MoonStar,
        label: isDarkMode ? "Light" : "Dark",
        onClick: () => setIsDarkMode((currentValue) => !currentValue),
      },
      {
        icon: Sparkles,
        label: animationEnabled ? "Motion On" : "Motion Off",
        onClick: () => setAnimationEnabled((currentValue) => !currentValue),
      },
      {
        icon: Download,
        label: "Export CSV",
        onClick: handleExportCsv,
        disabled: !filteredTransactions.length,
      },
    ];
  }, [
    animationEnabled,
    filteredTransactions.length,
    handleExportCsv,
    isDarkMode,
    setAnimationEnabled,
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (pathname !== AUTH_ROUTE_PATH) {
        navigateToPath(AUTH_ROUTE_PATH, { replace: true });
      }

      return;
    }

    // Keep direct URL access protected by auth and role checks before rendering.
    if (pathname === "/" || pathname === AUTH_ROUTE_PATH) {
      navigateToPage(fallbackPage?.id ?? "dashboard", { replace: true });
      return;
    }

    if (!routePage) {
      navigateToPage(fallbackPage?.id ?? "dashboard", { replace: true });
      return;
    }

    if (!isRouteAllowed) {
      navigateToPage(fallbackPage?.id ?? "dashboard", { replace: true });
      return;
    }

    if (currentPage !== routePage.id) {
      setCurrentPage(routePage.id);
    }
  }, [
    currentPage,
    fallbackPage?.id,
    isAuthenticated,
    isRouteAllowed,
    navigateToPage,
    navigateToPath,
    pathname,
    routePage,
    setCurrentPage,
  ]);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <main data-motion={animationEnabled ? "on" : "off"} className="finova-shell lg:h-screen lg:overflow-hidden">
      <div className="finova-layout lg:h-screen">
        {!isDesktopViewport ? (
          <button
            aria-label="Close navigation menu"
            className={`fixed inset-0 z-30 bg-slate-950/30 transition duration-200 ${
              isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            type="button"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        <aside inert={!isDesktopViewport && !isSidebarOpen}
          className={`finova-sidebar fixed inset-y-0 left-0 z-40 w-[min(86vw,320px)] max-w-full transition-transform duration-300 ease-out lg:static lg:z-auto lg:w-auto lg:translate-x-0 lg:overflow-hidden ${
            isDesktopViewport || isSidebarOpen
              ? "translate-x-0 pointer-events-auto"
              : "-translate-x-full pointer-events-none lg:pointer-events-auto"
          }`}
        >
          <div className="flex h-full min-h-0 flex-col p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3 px-2 pt-1">
              <BrandLogo />

              {!isDesktopViewport ? (
                <button
                  aria-label="Close navigation menu"
                  className="finova-icon-button h-10 w-10 shrink-0"
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="mx-2 mt-4 h-px bg-[var(--finova-border)]" />

            <nav className="finova-scroll mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
              {accessiblePages.filter(page => page.id !== "profile").map((page) => (
                <button
                  key={page.id}
                  aria-current={activePage.id === page.id ? "page" : undefined}
                  className={`finova-nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium ${
                    activePage.id === page.id
                      ? "bg-[var(--finova-accent)] text-white shadow-[0_14px_24px_-22px_rgba(126,124,245,0.8)]"
                      : "text-[var(--finova-muted)] hover:bg-[var(--finova-accent-soft)] hover:text-[var(--finova-accent)]"
                  }`}
                  type="button"
                  onClick={() => {
                    navigateToPage(page.id);
                    setIsSidebarOpen(false);
                  }}
                >
                  <page.icon className="h-4 w-4" />
                  {page.label}
                </button>
              ))}
            </nav>

            <div className="mt-4 border-t border-[var(--finova-border)] pt-4">
              <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--finova-muted)]">
                Workspace Access
              </p>
              <div className="mt-2">
                <RoleSwitcher openProfile={() => { navigateToPage("profile"); setIsSidebarOpen(false); }} />
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 max-w-full overflow-x-hidden lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <header className="finova-topbar sticky top-0 z-20 px-4 py-4 sm:px-6 lg:px-8">
            <div className="workspace-toolbar">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {!isDesktopViewport ? (
                  <button
                    aria-label="Open navigation menu"
                    className="finova-icon-button h-11 w-11"
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                ) : null}

                <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-[var(--finova-accent-soft)] text-[var(--finova-accent)] sm:inline-flex">
                  <activePage.icon className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--finova-accent)]">
                    {activePage.label}
                  </p>

                </div>
              </div>

              <div className="workspace-tools">
                <label className="relative block">
                  <span className="sr-only">Search workspace data</span>
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--finova-muted)]" />
                  <input
                    className="h-12 w-full rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-surface)] pl-11 pr-4 text-sm text-[var(--finova-text)] outline-none transition focus:border-[var(--finova-accent)]"
                    placeholder="Search transactions…"
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </label>

                <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                  {headerActionButtons.map((actionButton) => (
                    <button
                      key={actionButton.label}
                      className="finova-icon-button gap-2 px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={actionButton.disabled}
                      type="button"
                      onClick={actionButton.onClick}
                      title={actionButton.label}
                      aria-label={actionButton.label}
                    >
                      {createElement(actionButton.icon, { className: "h-4 w-4" })}
                      <span className="toolbar-label">{actionButton.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-8 lg:py-6">
            <MotionSection
              key={currentUser.id + ":" + activePage.id}
              className="min-w-0 max-w-full overflow-x-hidden"
              {...getSectionMotion(0.04)}
            >
              <Suspense fallback={<p role="status">Loading workspace…</p>}>
                <PageComponent isDarkMode={isDarkMode} />
              </Suspense>
            </MotionSection>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <WorkspaceApp />
    </FinanceProvider>
  );
}
