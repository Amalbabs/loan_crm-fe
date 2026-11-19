# LoanCore CRM — Architecture Specification & Standard Operating Procedures (SOPs)

## 1. Role-Based Access Control (RBAC) Matrix

| Capability / Module | Admin Controller (`/admin/*`) | Call Centre Staff (`/staff/*`) |
| :--- | :---: | :---: |
| **Floor-Wide Analytics & 2,000-Call Quota Tracking** | Full Access | Restricted |
| **Bulk CSV Lead Ingestion & Pool Validation** | Full Access | Restricted |
| **100-Call Daily Quota Distribution Across 20 Staff** | Full Access | Restricted |
| **Partner Bank Scheme & ROI Configuration** | Full Access | Read-Only (In Dialer) |
| **Personal Daily Call Queue & Interactive Dialer** | View-As / Audit | Full Access |
| **Call Disposition Logging (`Interested`, `Callback`, `Not Interested`)** | Audit Logs | Full Access |
| **Customer KYC & Financial Document Upload** | Verification Override | Upload & Submit |
| **Multi-Bank Document Verification Funnel Advancement** | Approve / Sanction | Stage Tracking & Re-upload |

---

## 2. Core Business Workflow SOPs

### SOP 1: Daily 100-Call Target Allocation (20 Employees = 2,000 Calls/Day)
1. **Ingestion**: Admin uploads daily prospect batches via the **Bulk CSV Upload Mock** or generates fresh leads into the Unassigned Pool.
2. **Equal Quota Distribution**: Admin triggers **"Auto-Distribute to 20 Staff (100 Quota Cap)"** or assigns custom batches by loan vertical (`Personal`, `Business`, `Home`, `LAP`).
3. **Target Enforcement**: Each of the 20 employees carries a strict `100 calls/day` target. The engine computes real-time deficits (`100 - callsCompleted`) and prioritizes agents who are below their daily allocation.

### SOP 2: Call Execution & Disposition Lifecycle
1. **Queue Selection**: Staff member selects the next pending lead in `/staff/dialer` (or switches active staff profile in the header to test any of the 20 employees).
2. **Active Call & Eligibility Check**: Staff reviews prospect income, CIBIL score, and auto-matched Partner Bank schemes.
3. **Call Disposition**:
   - **Interested**: Increments agent's `callsCompleted` (+1) and `interestedCount` (+1), assigns preferred Partner Bank scheme, and automatically initializes the **Document Verification Pipeline** (`KYC Uploaded` / `Pending Docs`).
   - **Callback Scheduled**: Increments `callsCompleted` (+1) and `callbacksCount` (+1), captures exact callback date/time slot and notes, and routes the lead to `/staff/followups`.
   - **Not Interested**: Increments `callsCompleted` (+1), records rejection reason (e.g., *ROI too high*, *Already availed*, *CIBIL ineligible*), and archives the lead from the active queue.

### SOP 3: Multi-Bank Document Verification Funnel
Once a lead is marked **Interested**, it enters a 4-stage intermediary bank funnel:
1. **Stage 1 — KYC & Income Docs Uploaded**: PAN, Aadhaar, 6-Month Bank Statement, Salary Slips / ITR uploaded by Staff.
2. **Stage 2 — Partner Bank Login & Verification**: Submitted to partner bank (HDFC, ICICI, Axis, SBI, Kotak) for credit & field verification.
3. **Stage 3 — Sanctioned**: Credit underwriting approved; sanction letter generated with final ROI and tenure.
4. **Stage 4 — Disbursed**: Loan agreement signed and funds disbursed to customer account; DSA commission unlocked.

