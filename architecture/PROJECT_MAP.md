# LoanCore CRM — Project Map & Source of Truth

## 1. System Overview
**LoanCore CRM** is a specialized Loan Sales & Call Centre CRM System acting as a high-velocity intermediary between retail/business customers and partner banks. It features dual portals (**Admin Portal** and **Staff / Call Centre Portal**) powered by a reactive local-storage-backed state engine.

---

## 2. Directory & Module Structure

```text
c:\Users\Public\Loan-CRM-fe\
├── architecture/
│   ├── PROJECT_MAP.md              # Source of Truth for schemas, state trees, and routing
│   └── ARCHITECTURE_SPEC.md        # Role-Based Access Control (RBAC) & Workflow SOPs
├── src/
│   ├── assets/
│   │   └── styles/
│   │       ├── _variables.scss     # Design tokens, fintech color palette, Bootstrap overrides
│   │       ├── _mixins.scss        # Glassmorphism, card elevation, custom scrollbars
│   │       ├── _layout.scss        # Sidebar, topbar, portal shells, responsive grids
│   │       ├── _components.scss    # Metric cards, status badges, gauges, dialer UI, pipeline
│   │       └── main.scss           # Root stylesheet importing Bootstrap + partials
│   ├── data/
│   │   └── mockData.js             # Seeded 20 staff members, leads pool, partner banks, doc pipelines
│   ├── context/
│   │   └── CRMContext.jsx          # Reactive state engine (lead distribution, call logging, doc funnel)
│   ├── components/
│   │   ├── common/
│   │   │   ├── MetricCard.jsx      # KPI display with trend indicators & progress bars
│   │   │   ├── StatusBadge.jsx     # Semantic badges for lead, call, and bank verification status
│   │   │   ├── TargetGauge.jsx     # Radial/Linear 100-call daily quota progress gauge
│   │   │   └── DataTable.jsx       # Reusable filterable/sortable table with quick actions
│   │   ├── modals/
│   │   │   ├── CallDispositionModal.jsx # Log call outcome (Interested, Callback, Not Interested)
│   │   │   ├── CsvUploadModal.jsx       # Bulk CSV lead import & auto-distribution preview
│   │   │   └── BankSchemeModal.jsx      # Add/Edit partner bank loan schemes
│   │   └── layouts/
│   │       ├── AdminLayout.jsx     # Admin navigation shell (/admin/*)
│   │       └── StaffLayout.jsx     # Call Centre executive shell (/staff/*) with active agent switcher
│   └── pages/
│       ├── admin/
│       │   ├── AdminDashboard.jsx      # Floor-wide analytics, 2,000 daily call velocity, conversion funnel
│       │   ├── LeadDistribution.jsx    # Unassigned pool, 100-call/day batch allocator across 20 staff
│       │   ├── StaffTargets.jsx        # Live 20-employee quota board (X/100 calls), efficiency metrics
│       │   └── BankSchemes.jsx         # Partner bank ROI, interest rates, doc checklist & verification pipeline
│       └── staff/
│           ├── CallQueueDialer.jsx     # Interactive dialer, script guide, customer 360, disposition trigger
│           ├── FollowUpSchedule.jsx    # Callback calendar, priority reminders, hot-lead conversion
│           └── DocumentVault.jsx       # KYC/Income doc upload, 4-stage bank verification funnel
```

---

## 3. Core Schemas

### 3.1 Employee (`staff`) Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier (`EMP-001` to `EMP-020`) |
| `name` | `string` | Full name of Call Centre Executive |
| `role` | `string` | `'Senior Tele-Sales'` \| `'Loan Specialist'` \| `'Relationship Associate'` |
| `team` | `string` | `'Retail Loans'` \| `'SME & Business'` \| `'Home & Mortgage'` |
| `dailyTarget` | `number` | Fixed daily call quota (Default: `100`) |
| `callsCompleted` | `number` | Calls completed today (`0` – `100+`) |
| `interestedCount` | `number` | Leads marked `'Interested'` today |
| `callbacksCount` | `number` | Leads marked `'Callback Scheduled'` today |
| `docsCollected` | `number` | Applications in document verification funnel |
| `avgCallDuration` | `string` | Formatted duration (e.g., `'03:18'`) |
| `status` | `string` | `'On Call'` \| `'Available'` \| `'Wrap-up'` \| `'Break'` |

### 3.2 Lead (`leads`) Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique lead ID (`LD-1001`, etc.) |
| `customerName` | `string` | Prospect full name |
| `phone` | `string` | Contact phone number |
| `email` | `string` | Contact email address |
| `city` | `string` | City / Region |
| `employmentType` | `string` | `'Salaried'` \| `'Self-Employed'` \| `'Business Owner'` |
| `monthlyIncome` | `number` | Monthly net income / turnover in INR |
| `creditScore` | `number` | CIBIL / Credit bureau score (`620` – `840`) |
| `loanType` | `string` | `'Personal Loan'` \| `'Business Loan'` \| `'Home Loan'` \| `'LAP'` |
| `requestedAmount` | `number` | Requested loan principal |
| `preferredBankId` | `string` | Linked Partner Bank ID (`BNK-01`, etc.) |
| `assignedTo` | `string \| null` | `EMP-XXX` or `null` if in unassigned pool |
| `callStatus` | `string` | `'Pending'` \| `'Interested'` \| `'Callback Scheduled'` \| `'Not Interested'` |
| `callbackDateTime`| `string \| null` | ISO string or formatted slot for scheduled follow-up |
| `notes` | `string` | Tele-caller disposition remarks |
| `lastCalledAt` | `string \| null` | Timestamp of most recent call |
| `docStage` | `string` | `'Not Started'` \| `'KYC Uploaded'` \| `'Bank Verification'` \| `'Sanctioned'` \| `'Disbursed'` |
| `documents` | `Array<Doc>` | List of required KYC/Financial documents & upload statuses |

### 3.3 Partner Bank Scheme (`banks`) Schema
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique Bank Scheme ID (`BNK-01`, etc.) |
| `bankName` | `string` | Partner Bank Name (e.g., HDFC Bank, ICICI Bank, Axis Bank, SBI, Kotak) |
| `schemeName` | `string` | Specific product title |
| `loanCategory` | `string` | `'Personal Loan'` \| `'Business Loan'` \| `'Home Loan'` \| `'LAP'` |
| `interestRate` | `string` | ROI range (e.g., `'10.49% - 13.25% p.a.'`) |
| `maxTenureMonths` | `number` | Maximum tenure in months |
| `maxLoanAmount` | `number` | Maximum ticket size |
| `minCreditScore` | `number` | Cutoff bureau score |
| `processingFee` | `string` | Processing fee percentage |
| `payoutCommission`| `string` | DSA / CRM intermediary payout % |
| `requiredDocs` | `Array<string>` | Mandatory document checklist |
| `active` | `boolean` | Scheme availability status |

---

## 4. Routing & Bifurcation Map

- `/` → Redirects to `/admin/dashboard` (with persistent top-level Portal Switcher between Admin & Staff views)
- **Admin Portal (`/admin/*`)**
  - `/admin/dashboard` → Floor KPI overview, 20-agent call velocity (out of 2,000 daily calls), bank pipeline funnel
  - `/admin/distribution` → Lead Pool Distribution Engine (Auto-distribute 100-call targets across 20 employees + Bulk CSV Upload mock)
  - `/admin/targets` → Employee Target Tracker (20 employees, live progress bars toward 100 calls/day, conversion metrics)
  - `/admin/banks` → Partner Bank Scheme Controller & Verification SLA rules
- **Staff / Call Centre Portal (`/staff/*`)**
  - `/staff/dialer` → Daily Call Queue & Interactive Dialer, Call Disposition Modal, Live 100-call quota gauge
  - `/staff/followups` → Callback Scheduled Queue & Hot Lead Conversion actions
  - `/staff/documents` → Multi-Bank Document Upload & 4-Stage Verification Pipeline

