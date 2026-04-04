# LedgerView

LedgerView is a modern finance workspace built with React, Vite, and Tailwind CSS. It combines a polished analytics dashboard with authentication, protected routes, role-based access control, admin workflows, and local persistence in a responsive product-style interface.

## Overview

LedgerView began as a finance dashboard assignment and evolved into a multi-page workspace that feels closer to a real finance product than a static UI demo.

The application includes:

- a responsive dashboard with charts, insights, filters, and transaction analytics
- sign in and sign up flows with local session persistence
- protected page access based on user role
- admin-only create, edit, and delete workflows across the workspace
- localStorage-backed data persistence for the full in-browser experience

## Highlights

| Area | What it includes |
| --- | --- |
| Dashboard | Balance cards, cashflow trends, spending breakdown, insights, filters, and transaction views |
| Authentication | Sign in, sign up, session persistence, and demo account support |
| Access Control | Viewer and admin role simulation with protected route handling |
| Workspace Tools | Events, asset workflows, finance notes, file manager, documents, reports, and admin center |
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
- Local storage persistence for registered users and active sessions
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
| Viewer | Dashboard, Asset Graph, Events, Finance, Members, File Manager, Document | Read-only access to reporting and workspace data |
| Admin | All viewer pages plus Asset Management, Reports, and Admin Center | Full create, update, delete, and management permissions |

## Assignment Requirement Mapping

| Assignment Requirement | Implementation in LedgerView | Key Files |
| --- | --- | --- |
| Modular React architecture | The app is split into reusable components, page-level views, shared context, data modules, and utility helpers. | `src/components/*`, `src/pages/*`, `src/context/FinanceContext.jsx`, `src/utils/*` |
| Realistic finance transaction dataset | The dashboard uses a seeded dataset with realistic accounts, categories, income, and expense records. | `src/data/transactions.js` |
| Dashboard summary cards | Balance, income, expense, and savings-rate cards are rendered as reusable dashboard metrics. | `src/components/DashboardCards.jsx` |
| Transaction table with search, sort, and filters | Transactions can be searched, filtered by category/type, sorted by date, and shown in desktop/mobile-specific layouts. | `src/components/TransactionTable.jsx`, `src/components/Filters.jsx` |
| Spending breakdown chart | Expense distribution is visualized with a doughnut chart plus a detailed "See all" category breakdown view. | `src/components/CategoryChart.jsx` |
| Monthly trend visualization | Income vs expense movement is displayed in monthly, quarterly, and yearly chart views. | `src/components/TrendChart.jsx` |
| Insights section | Top insights surface highest spending category, monthly expenses, ratio insights, and top transactions. | `src/components/Insights.jsx` |
| Responsive dashboard layout | The dashboard and workspace adapt across desktop, tablet, and mobile, including a hamburger drawer for smaller screens. | `src/pages/Dashboard.jsx`, `src/App.jsx`, `src/index.css` |
| Tailwind-based styling | All UI styling is built with Tailwind utility classes and a shared CSS variable theme layer. | `src/index.css`, `src/**/*.jsx` |
| Empty-state handling | The dashboard shows graceful placeholder UI when no transaction data exists. | `src/pages/Dashboard.jsx` |
| Role simulation | Viewer and admin behavior is modeled through shared role state and access-aware UI. | `src/context/FinanceContext.jsx`, `src/components/RoleSwitcher.jsx` |
| Viewer vs admin permissions | Viewer users are restricted to read-only flows, while admins can add, edit, and delete across the workspace. | `src/components/TransactionTable.jsx`, `src/pages/*`, `src/context/FinanceContext.jsx` |
| Sign in and sign up | The project includes an auth screen with sign in and sign up flows backed by persisted browser state. | `src/components/AuthScreen.jsx`, `src/context/FinanceContext.jsx` |
| Protected routes | URL-aware route guards redirect unauthenticated users and block restricted pages by role. | `src/App.jsx`, `src/data/workspacePages.js` |
| localStorage persistence | Users, sessions, filters, transactions, notes, files, and other workspace data persist between refreshes. | `src/context/FinanceContext.jsx`, `src/components/AuthScreen.jsx` |
| Optional enhancements | Dark mode, motion toggle, CSV export, branded logo integration, and admin workspace tooling are included as product-style enhancements. | `src/App.jsx`, `src/components/BrandLogo.jsx`, `src/components/TrendChart.jsx`, `src/components/CategoryChart.jsx` |

## Demo Accounts

Use the seeded accounts below to explore the product immediately.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@ledgerview.app` | `admin123` |
| Viewer | `viewer@ledgerview.app` | `viewer123` |

## Tech Stack

| Category | Tools |
| --- | --- |
| Frontend | React 19, React DOM 19 |
| Build tooling | Vite 8 |
| Styling | Tailwind CSS 4 |
| Charts | Chart.js, `react-chartjs-2` |
| Motion | Framer Motion |
| Icons | Lucide React |
| Code quality | ESLint |

## Project Structure

```text
src
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
|   `-- FinanceContext.jsx
|-- data
|   |-- transactions.js
|   |-- workspaceContent.js
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
|   `-- Reports.jsx
|-- utils
|   |-- calculateStats.js
|   `-- downloadFile.js
|-- App.jsx
|-- index.css
`-- main.jsx
```

### Key Modules

| Module | Responsibility |
| --- | --- |
| `src/context/FinanceContext.jsx` | Shared application state, auth handling, persistence, RBAC, and workspace actions |
| `src/data/workspacePages.js` | Central page registry and role access metadata |
| `src/pages/*` | Workspace-level views such as dashboard, reports, finance, and admin center |
| `src/components/*` | Reusable UI building blocks for charts, filters, auth, branding, and data views |
| `src/utils/*` | Formatting, statistics, and helper logic |

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm 9+ recommended

### Installation

```bash
git clone <your-repository-url>
cd finance-dashboard
npm install
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
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint checks |

## Persistence Model

LedgerView uses `localStorage` to preserve the in-browser workspace experience between refreshes.

Persisted data includes:

- registered users
- active session
- page preference
- transactions
- filters
- animation preference
- events
- asset workflows
- finance notes
- files
- documents
- reports
- auth screen mode and email hint

## Routing and Protection

The application uses URL-aware protected routing tied to authentication and role checks.

- Unauthenticated users are redirected to the auth screen.
- Authenticated users are redirected away from restricted pages they cannot access.
- Sidebar navigation updates the browser URL.
- Refreshing on a valid page preserves access rules and session-aware routing.

## Future Improvements

- Replace local-only persistence with a real backend and database
- Add secure server-side authentication and hashed credentials
- Introduce automated tests for auth, routing, and workspace flows
- Add budgeting, recurring transactions, and forecasting
- Expand reporting with scheduling and richer export formats
- Support cloud-backed file storage and multi-user synchronization

## License

This project is currently intended for educational and portfolio use.
