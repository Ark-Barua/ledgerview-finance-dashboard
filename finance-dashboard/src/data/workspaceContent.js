export const seedWorkspaceEvents = [
  {
    id: 1,
    title: "Quarterly planning sync scheduled",
    detail: "Leadership and finance operations alignment",
    amount: 0,
    date: "2026-04-01",
    createdBy: "Admin",
    type: "info",
  },
  {
    id: 2,
    title: "Budget approval recorded",
    detail: "Capital expansion budget approved by leadership",
    amount: 425000,
    date: "2026-03-29",
    createdBy: "Admin",
    type: "income",
  },
  {
    id: 3,
    title: "Vendor renewal reminder",
    detail: "Infrastructure vendor renewal due this week",
    amount: 89200,
    date: "2026-03-27",
    createdBy: "Finance Ops",
    type: "expense",
  },
];

export const seedAssetWorkflows = [
  {
    id: 1,
    title: "Commercial Property",
    status: "Under review",
    owner: "Admin",
    summary: "Downtown office acquisition review with compliance checks pending.",
  },
  {
    id: 2,
    title: "Treasury Allocation",
    status: "Approved",
    owner: "Finance Ops",
    summary: "Short-term reserve capital parked across approved instruments.",
  },
  {
    id: 3,
    title: "Growth Equity Basket",
    status: "Needs update",
    owner: "Portfolio Lead",
    summary: "Performance notes need revision before committee sign-off.",
  },
];

export const seedFinanceNotes = [
  {
    id: 1,
    title: "Month-end reminder",
    content:
      "Verify salary disbursement totals and rent postings before final close.",
    author: "Admin",
    createdAt: "2026-04-02",
  },
  {
    id: 2,
    title: "Expense watchlist",
    content:
      "Shopping and utilities categories have accelerated faster than planned.",
    author: "Finance Ops",
    createdAt: "2026-04-03",
  },
];

export const seedWorkspaceFiles = [
  {
    id: 1,
    name: "q1-board-report.txt",
    owner: "Finance Ops",
    size: "2.4 KB",
    updatedAt: "2026-04-02",
    content:
      "Q1 board report\n\nRevenue remained stable and controlled expense growth improved margin confidence.",
  },
  {
    id: 2,
    name: "asset-breakdown.csv",
    owner: "Analytics",
    size: "1.1 KB",
    updatedAt: "2026-04-01",
    content:
      "asset,value\nCommercial Property,4200000\nTreasury Allocation,1850000\nGrowth Equity Basket,2650000",
  },
  {
    id: 3,
    name: "member-access-matrix.txt",
    owner: "Admin",
    size: "1.0 KB",
    updatedAt: "2026-03-31",
    content:
      "Admin: all pages with edit rights\nViewer: reporting pages with read-only access",
  },
];

export const seedDocuments = [
  {
    id: 1,
    title: "Monthly finance playbook",
    summary: "Operational checklist for balance review and monthly close.",
    body:
      "1. Reconcile all accounts.\n2. Validate expense categories.\n3. Approve variance notes.\n4. Publish summary pack.",
    updatedAt: "2026-04-01",
  },
  {
    id: 2,
    title: "Investor narrative draft",
    summary: "A concise overview of performance highlights and risk notes.",
    body:
      "The portfolio closed the quarter with steady income growth and controlled expense exposure across core categories.",
    updatedAt: "2026-03-30",
  },
  {
    id: 3,
    title: "Expense approval guidelines",
    summary: "Decision matrix for reimbursements and discretionary spending.",
    body:
      "Any discretionary spend above INR 50,000 requires finance lead approval and supporting business context.",
    updatedAt: "2026-03-28",
  },
];

export const seedReports = [
  {
    id: 1,
    title: "Executive summary",
    cadence: "Weekly",
    audience: "Leadership",
    lastRunAt: "2026-04-01",
    runCount: 3,
    status: "Ready",
  },
  {
    id: 2,
    title: "Expense anomaly digest",
    cadence: "Daily",
    audience: "Finance Ops",
    lastRunAt: "2026-04-03",
    runCount: 6,
    status: "Ready",
  },
  {
    id: 3,
    title: "Investor update deck",
    cadence: "Monthly",
    audience: "Board",
    lastRunAt: null,
    runCount: 0,
    status: "Pending",
  },
];
