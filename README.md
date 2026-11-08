# LedgerView

LedgerView is a modern finance workspace built with React, Vite, and Tailwind CSS. It combines a polished analytics dashboard with authentication, protected routes, role-based access control, admin workflows, and SQLite persistence in a responsive product-style interface.

## Live Deployment

| Environment | Details |
| --- | --- |
| **Production Domain** | [ledgerview-finance-dashboard.vercel.app](https://ledgerview-finance-dashboard.vercel.app/) |
| **Deployment Preview** | [ledgerview-finance-dashboard-38p7n57fy-pro5765s-projects.vercel.app](https://ledgerview-finance-dashboard-38p7n57fy-pro5765s-projects.vercel.app/) |
| **Vercel Dashboard** | [Inspect Deployment (`pro5765s-projects`)](https://vercel.com/pro5765s-projects/ledgerview-finance-dashboard/H7pc31nGBbrk9Woix5xvZGyVbWff) |
| **Status** | Ready · Hosted on Vercel |

## Overview

LedgerView began as a finance dashboard assignment and evolved into a multi-page workspace that feels closer to a real finance product than a static UI demo.

The application includes:

- a responsive dashboard with charts, insights, filters, and transaction analytics
- sign in and sign up flows with server-managed sessions
- protected page access based on user role
- admin-only create, edit, and delete workflows across the workspace
- a Node API backed by SQLite

## Highlights

| Area | What it includes |
| --- | --- |
| Dashboard | Balance cards, cashflow trends, spending breakdown, insights, filters, and transaction views |
| Authentication | Sign in, sign up, server-managed sessions, and isolated workspaces |
| Access Control | Server-enforced viewer and admin roles with protected route handling |
| Workspace Tools | Planning, profile card, events, asset workflows, finance notes, file manager, documents, reports, and admin center |
| UX | Dark mode, motion toggle, mobile sidebar, responsive layout, and branded UI |

## Features

### Dashboard Experience

- Summary cards for balance, income, expenses, and savings rate
- Search, category, and transaction type filters
- Sortable transaction list
- Monthly, quarterly, and yearly cashflow views
- Spending breakdown chart with detailed category modal
- Insight cards for key spending signals and top transactions
- CSV export for the active transaction set
- Empty-state handling for missing data

### Authentication and RBAC

- Sign in and sign up flows
- Salted password hashes and expiring server-side sessions
- URL-aware protected route handling
- Role-based access control for `viewer` and `admin`
- Viewer-safe read-only experience
- Admin editing and management controls

### Admin Operations

- Add, edit, and delete transactions
- Create and remove events
- Create, update, and delete asset workflows
- Add and delete finance notes
- Invite and remove workspace members
- Upload and delete files
- View, edit, and delete documents
- Run and delete reports

### User Experience Enhancements

- Responsive layouts for desktop, tablet, and mobile
- Mobile drawer navigation with hamburger menu
- Dark mode toggle
- Optional motion toggle powered by Framer Motion
- Branded logo integration across the product shell and auth screens

## Access Model

| Role | Accessible pages | Capabilities |
| --- | --- | --- |
| Viewer | Dashboard, Planning, Profile, Asset Graph, Events, Finance, Members, File Manager, Document | Read-only access to reporting and workspace data, plus personal profile management |
| Admin | All viewer pages plus Asset Management, Reports, and Admin Center | Full create, update, delete, budget/recurring/report scheduling, and management permissions |

## Assignment Requirement Mapping

| Assignment Requirement | Implementation in LedgerView | Key Files |
| --- | --- | --- |
| Modular React architecture | The app is split into reusable components, page-level views, shared context, data modules, and utility helpers. | `src/components/*`, `src/pages/*`, `src/context/FinanceContext.jsx`, `src/utils/*` |
| Dashboard summary cards | Balance, income, expense, and savings-rate cards are rendered as reusable dashboard metrics. | `src/components/DashboardCards.jsx` |
| Transaction table with search, sort, and filters | Transactions can be searched, filtered by category/type, sorted by date, and shown in desktop/mobile-specific layouts. | `src/components/TransactionTable.jsx`, `src/components/Filters.jsx` |
| Spending breakdown chart | Expense distribution is visualized with a doughnut chart plus a detailed "See all" category breakdown view. | `src/components/CategoryChart.jsx` |
| Monthly trend visualization | Income vs expense movement is displayed in monthly, quarterly, and yearly chart views. | `src/components/TrendChart.jsx` |
| Insights section | Top insights surface highest spending category, monthly expenses, ratio insights, and top transactions. | `src/components/Insights.jsx` |
| Responsive dashboard layout | The dashboard and workspace adapt across desktop, tablet, and mobile, including a hamburger drawer for smaller screens. | `src/pages/Dashboard.jsx`, `src/App.jsx`, `src/index.css` |
| Tailwind-based styling | All UI styling is built with Tailwind utility classes and a shared CSS variable theme layer. | `src/index.css`, `src/**/*.jsx` |
| Empty-state handling | The dashboard shows graceful placeholder UI when no transaction data exists. | `src/pages/Dashboard.jsx` |
| Role enforcement | Viewer and admin behavior is modeled through shared role state and access-aware UI. | `src/context/FinanceContext.jsx`, `src/components/RoleSwitcher.jsx` |
| Viewer vs admin permissions | Viewer users are restricted to read-only flows, while admins can add, edit, and delete across the workspace. | `src/components/TransactionTable.jsx`, `src/pages/*`, `src/context/FinanceContext.jsx` |
| Sign in and sign up | The project includes an auth screen with sign in and sign up flows backed by the workspace API. | `src/components/AuthScreen.jsx`, `src/context/FinanceContext.jsx` |
| Protected routes | URL-aware route guards redirect unauthenticated users and block restricted pages by role. | `src/App.jsx`, `src/data/workspacePages.js` |
| Database persistence | The server stores accounts, sessions and workspace records in SQLite. | server/database.mjs |
| Optional enhancements | Dark mode, motion toggle, CSV export, branded logo integration, and admin workspace tooling are included as product-style enhancements. | `src/App.jsx`, `src/components/BrandLogo.jsx`, `src/components/TrendChart.jsx`, `src/components/CategoryChart.jsx` |

## Planning and reports

Open Planning to set monthly category limits, compare posted expenses with each limit, and schedule daily, weekly or monthly transactions. Forecasts show projected balances at 30, 60 and 90 days. The historical option also extrapolates the previous 90 calendar days of non-recurring net cash flow.

Schedules use UTC calendar dates. The server checks for due entries every minute and catches up on startup. A monthly rule that starts on the 31st uses the last day of shorter months and returns to the 31st when available. Stopping a rule preserves posted transactions.

Admins can schedule reports in Reports. Each run saves a cumulative financial summary through its scheduled date, with transaction counts and amounts by category and type. Download a saved run as CSV, JSON or printable HTML.

## Profile card

Select your membership card at the foot of the sidebar to edit your portrait, name, job title and sign-in email. On mobile, open the navigation drawer first. Changing email requires your current password and revokes previous sessions. Deleting your account also requires your current password. The last admin in a shared workspace selects a successor. A sole member explicitly confirms workspace deletion.

## Accounts

Choose **Sign Up** to create a private workspace with empty financial collections. Its creator becomes the administrator. Use **Members** to add viewer and admin accounts. Passwords must contain 12 to 256 characters.

When signing up from a browser that used the old app, select the import option to bring saved financial records into the new workspace. Use the original hostname and port to access that browser storage. Create fresh credentials for each member.

## Tech Stack

| Category | Tools |
| --- | --- |
| Frontend | React 19, React DOM 19 |
| Build tooling | Vite 8 |
| Transaction state | Redux Toolkit and React Redux |
| Styling | Tailwind CSS 4 |
| Charts | Chart.js, `react-chartjs-2` |
| Motion | Framer Motion |
| Icons | Lucide React |
| Backend & Database | Node.js HTTP API, built-in SQLite (`node:sqlite`) |
| Code quality | ESLint |

## Project Structure

```text
ledgerview-finance-dashboard
|-- package.json
|-- README.md
`-- finance-dashboard
    |-- package.json
    |-- vite.config.js
    |-- server
    |   |-- api.mjs
    |   |-- api.test.mjs
    |   |-- auth.mjs
    |   |-- database.mjs
    |   |-- legacy-samples.mjs
    |   |-- profile.mjs
    |   |-- records.mjs
    |   |-- scheduler.mjs
    |   `-- start.mjs
    `-- src
        |-- assets
        |   `-- logo.png
        |-- components
        |   |-- AuthScreen.jsx
        |   |-- BrandLogo.jsx
        |   |-- CategoryChart.jsx
        |   |-- DashboardCards.jsx
        |   |-- Filters.jsx
        |   |-- Insights.jsx
        |   |-- RoleSwitcher.jsx
        |   |-- TransactionTable.jsx
        |   `-- TrendChart.jsx
        |-- context
        |   |-- FinanceContext.jsx
        |   `-- useWorkspace.js
        |-- data
        |   `-- workspacePages.js
        |-- pages
        |   |-- AdminCenter.jsx
        |   |-- AssetGraph.jsx
        |   |-- AssetManagement.jsx
        |   |-- Dashboard.jsx
        |   |-- Document.jsx
        |   |-- Events.jsx
        |   |-- FileManager.jsx
        |   |-- Finance.jsx
        |   |-- Members.jsx
        |   |-- Planning.jsx
        |   |-- Profile.jsx
        |   `-- Reports.jsx
        |-- store
        |   `-- ledger.js
        |-- utils
        |   |-- calculateStats.js
        |   |-- downloadFile.js
        |   |-- legacyWorkspace.js
        |   |-- reportExport.js
        |   `-- schedule.js
        |-- App.jsx
        |-- index.css
        `-- main.jsx
```

### Key Modules

| Module | Responsibility |
| --- | --- |
| `finance-dashboard/server/*` | Node HTTP API, SQLite schema/persistence, scrypt auth & sessions, UTC scheduler, and standalone static server |
| `src/context/FinanceContext.jsx` & `src/context/useWorkspace.js` | Shared application state, queued API synchronization, RBAC, and workspace actions |
| `src/store/ledger.js` | Redux Toolkit store holding the active workspace snapshot |
| `src/data/workspacePages.js` | Central page registry and role access metadata |
| `src/pages/*` | Workspace views such as dashboard, planning, profile, reports, finance, and admin center |
| `src/components/*` | Reusable UI building blocks for charts, filters, auth, branding, and data views |
| `src/utils/*` | Formatting, statistics, forecast/recurrence scheduling, report export, and legacy import helpers |

## Getting Started

### Prerequisites

- Node.js 22.13 or newer with built-in SQLite support
- npm 9+ recommended

### Installation

```bash
# From the cloned repository root
npm run setup
```

### Start the Development Server

```bash
npm run dev
```

The app will usually be available at:

```text
http://localhost:5173
```

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run setup` | Install dependencies inside `finance-dashboard` |
| `npm run dev` | Start the local development server |
| `npm run build` | Build and serve the app. Open the Local URL printed in the terminal. |
| `npm run build:only` | Create a production build and exit |
| `npm run preview` | Preview the production build locally |
| `npm start` | Start the standalone production API and static server |
| `npm test` | Run backend API, authentication, RBAC, and persistence tests |
| `npm run lint` | Run ESLint checks |

## Database and server

The Node API serves development, preview and standalone builds on the frontend's origin. SQLite stores workspace records, members, password hashes, and expiring sessions in `~/.ledgerview/ledger.sqlite`. Set `LEDGERVIEW_DB` to a private persistent file outside web-served directories to change the location. Use SQLite's backup facilities for live backups.

For deployment, run `npm run build:only` followed by `npm start`. The standalone server listens on `127.0.0.1:3000` by default. Set `HOST` and `PORT` as needed. Behind an HTTPS reverse proxy, set `LEDGERVIEW_ORIGIN` to the exact public HTTPS origin without a trailing slash. This enables Secure cookies and validates browser write origins.

Sessions expire after eight hours. Signing out revokes the current session. Removing a member revokes all of that member's sessions. Redux holds the current workspace snapshot. Browser storage keeps display and filter preferences.

Run `npm test` for authentication, access control and database persistence checks.

## Routing and Protection

The application uses URL-aware protected routing tied to authentication and role checks.

- Unauthenticated users are redirected to the auth screen.
- Authenticated users are redirected away from restricted pages they cannot access.
- Sidebar navigation updates the browser URL.
- Refreshing on a valid page preserves access rules and session-aware routing.

## Future Improvements

- Expand automated tests beyond the backend API suite to cover frontend routing and UI workspace flows
- Support cloud-backed file storage and multi-user synchronization

## License

This project is currently intended for educational and portfolio use.
