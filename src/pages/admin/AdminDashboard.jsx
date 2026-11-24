import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  TrendingUp,
  Building2,
  UploadCloud,
  ArrowUpRight,
  Users,
  FileCheck2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import MetricCard from '../../components/common/MetricCard';
import StatusBadge from '../../components/common/StatusBadge';
import CsvUploadModal from '../../components/modals/CsvUploadModal';
import { LuSend, LuCircleCheck } from 'react-icons/lu';
import {
  getAdminDashboardStats,
  getEmployeesPerformance,
  getBankSchemes,
  distributeLeads,
} from '../../context/Admin/index';
import { getLeads } from '../../context/Leads/index';
import {
  normalizeLeadItem,
  normalizeStaffMember,
  normalizeBankScheme,
  formatCompactINR,
  formatINR,
} from '../../utils/normalizers';
import { FaRegFileAlt } from 'react-icons/fa';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [dashboardStats, setDashboardStats] = useState(null);
  const [staff, setStaff] = useState([]);
  const [leads, setLeads] = useState([]);
  const [banks, setBanks] = useState([]);

  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (title) => {
    setToastMessage(title);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadDashboardData = (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    let pending = 4;
    const checkDone = () => {
      pending -= 1;
      if (pending <= 0) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    // 1. GET /api/admin/dashboard-stats
    getAdminDashboardStats()((res) => {
      if (res && res.success && res.data) {
        setDashboardStats(res.data);
      }
      checkDone();
    });

    // 2. GET /api/admin/employees-performance
    getEmployeesPerformance()((res) => {
      if (res && res.success && Array.isArray(res.data)) {
        setStaff(res.data.map(normalizeStaffMember));
      }
      checkDone();
    });

    // 3. GET /api/admin/schemes
    getBankSchemes({})((res) => {
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.schemes)
        ? res.data.schemes
        : [];
      if (res && res.success) {
        setBanks(list.map(normalizeBankScheme));
      }
      checkDone();
    });

    // 4. GET /api/leads
    getLeads({ page: 1, limit: 100 })((res) => {
      if (res && res.success && res.data) {
        const rawList = Array.isArray(res.data.leads)
          ? res.data.leads
          : Array.isArray(res.data)
          ? res.data
          : [];
        setLeads(rawList.map(normalizeLeadItem));
      }
      checkDone();
    });
  };

  useEffect(() => {
    loadDashboardData(false);
  }, []);

  // Compute floor metrics
  const quota = dashboardStats?.floorWideQuota;
  const statusList = Array.isArray(dashboardStats?.statusBreakdown)
    ? dashboardStats.statusBreakdown
    : [];

  const getBreakdownCount = (statusKey) => {
    const found = statusList.find((item) => (item.status || '').toUpperCase() === statusKey);
    if (found) return Number(found.count || 0);
    return leads.filter((l) => (l.status || '').toUpperCase() === statusKey).length;
  };

  const totalCalls = Number(quota?.callsCompletedToday ?? 0);
  const totalTarget = Number(quota?.targetDailyQuota ?? 2000);
  const completionRate = quota?.quotaPercentage
    ? Math.round(parseFloat(quota.quotaPercentage))
    : totalTarget > 0
    ? Math.round((totalCalls / totalTarget) * 100)
    : 0;

  const breakdownCounts = {
    newLeads: getBreakdownCount('NEW'),
    interested: getBreakdownCount('INTERESTED'),
    callbackScheduled: getBreakdownCount('CALLBACK_SCHEDULED'),
    notInterested: getBreakdownCount('NOT_INTERESTED'),
    disbursed: Number(dashboardStats?.disbursedLeadsCount ?? getBreakdownCount('DISBURSED')),
  };

  const verifiedDocsCount = leads.reduce((acc, l) => {
    const docs = Array.isArray(l.documents) ? l.documents : [];
    const fromList = docs.filter((d) => (d.verificationStatus || d.status || '').toUpperCase() === 'APPROVED').length;
    return acc + (docs.length > 0 ? fromList : l.approvedDocuments || 0);
  }, 0);
  const verifiedDocsValue = Number(dashboardStats?.verifiedDocumentsCount ?? dashboardStats?.approvedDocumentsCount ?? verifiedDocsCount);

  const latestLeads = [...leads]
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0))
    .slice(0, 5);

  const topExecutives = [...staff]
    .sort((a, b) => (b.callsCompletedToday || 0) - (a.callsCompletedToday || 0))
    .slice(0, 5);

  // POST /api/admin/distribute-leads
  const handleAutoDistribute = () => {
    if (Number(breakdownCounts.newLeads || 0) <= 0) {
      showToast('No unassigned leads available in the pool.');
      return;
    }
    setIsDistributing(true);
    distributeLeads({
      mode: 'round_robin',
      batch_size: 200,
    })((res) => {
      setIsDistributing(false);
      if (res && res.success) {
        showToast(
          res.message ||
            `Distributed ${res.distributedCount || 200} leads across ${res.staffCount || ''} active staff.`
        );
        loadDashboardData();
      } else {
        showToast(res?.message || 'Failed to distribute leads.');
      }
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold mb-1">Executive Floor Command &amp; Analytics</h3>
          
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            title="Refresh Dashboard"
          >
            <RefreshCw size={15} className={isRefreshing ? 'spinner-border spinner-border-sm' : ''} />
          </button>
          <button
            type="button"
            className="btn btn-outline-primary fw-semibold d-inline-flex align-items-center gap-2"
            onClick={() => setCsvModalOpen(true)}
          >
            <UploadCloud size={17} />
            Bulk CSV Lead Upload
          </button>
          <button
            type="button"
            className="btn btn-cta fw-semibold d-inline-flex align-items-center gap-2 shadow-cta"
            onClick={handleAutoDistribute}
            disabled={isDistributing || Number(breakdownCounts.newLeads || 0) <= 0}
            title={
              Number(breakdownCounts.newLeads || 0) <= 0
                ? 'No unassigned leads available in the pool.'
                : 'Distribute unassigned leads across active staff'
            }
          >
            {isDistributing ? 'Distributing...' : 'Auto-Distribute Leads'}
            <LuSend size={17} />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="row g-3 mb-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="col-sm-6 col-xl-3">
              <div className="crm-metric-card p-3">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="w-100">
                    <div className="crm-skeleton mb-2" style={{ width: '55%', height: 12 }} />
                    <div className="crm-skeleton" style={{ width: '40%', height: 28, borderRadius: 6 }} />
                  </div>
                  <div className="crm-skeleton rounded-3 flex-shrink-0" style={{ width: 42, height: 42 }} />
                </div>
                <div className="d-flex align-items-center justify-content-between gap-2 pt-1 border-top">
                  <div className="crm-skeleton" style={{ width: '65%', height: 12 }} />
                  <div className="crm-skeleton rounded-pill" style={{ width: 45, height: 18 }} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="col-sm-6 col-xl-3">
              <MetricCard
                label="Floor Daily Call Quota"
                value={`${totalCalls} / ${totalTarget}`}
                subtext={`${staff.length || 20} Staff • ${quota?.remainingCallsNeeded || 0} Calls Remaining`}
                icon={PhoneCall}
                tone="primary"
                progressPercent={completionRate}
                badgeText={`${completionRate}% SLA`}
                badgeTone="primary"
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <MetricCard
                label="Interested Calls Today"
                value={dashboardStats?.interestedCallsToday || breakdownCounts.interested}
                subtext={`${breakdownCounts.callbackScheduled} Callbacks Scheduled`}
                icon={TrendingUp}
                tone="success"
                badgeText={dashboardStats?.conversionRate ? `${dashboardStats.conversionRate} Conv.` : `${completionRate}%`}
                badgeTone="success"
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <MetricCard
                label="Verified Documents"
                value={verifiedDocsValue}
                subtext={`${leads.reduce((a, l) => a + (l.totalDocuments || 0), 0)} Total Docs Uploaded`}
                icon={FileCheck2}
                tone="violet"
                badgeText={verifiedDocsValue > 0 ? 'Verified' : 'None Yet'}
                badgeTone={verifiedDocsValue > 0 ? 'success' : 'info'}
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <MetricCard
                label="Total Leads &amp; New Today"
                value={dashboardStats?.totalLeads || leads.length}
                subtext={`+${dashboardStats?.newLeadsToday || 0} New Leads Today`}
                icon={FaRegFileAlt }
                tone="warning"
                badgeText={dashboardStats?.newLeadsToday > 0 ? `+${dashboardStats.newLeadsToday} Today` : 'Synced'}
                badgeTone={dashboardStats?.newLeadsToday > 0 ? 'warning' : 'success'}
              />
            </div>
          </>
        )}
      </div>

      {/* Status Breakdown Funnel + Leaderboard */}
      <div className="row g-4 align-items-stretch mb-4">
        <div className="col-lg-7 d-flex flex-column">
          <div className="crm-panel h-100 d-flex flex-column">
            <div className="panel-header">
              <div>
                <h5 className="panel-title">
                  <FileCheck2 size={19} className="text-primary" />
                  Lead Disposition &amp; Underwriting Funnel Breakdown
                </h5>
                <p className="panel-subtitle">
                  Live status breakdown across all borrower pipeline stages
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-semibold"
                onClick={() => navigate('/admin/documents')}
              >
                Open Verification Vault <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="funnel-stepper mb-4">
              <div className="funnel-step current">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="step-index">1</span>
                  <span className="badge bg-primary-subtle text-primary">NEW</span>
                </div>
                {isLoading ? (
                  <div className="crm-skeleton my-1" style={{ width: 42, height: 26, borderRadius: 6 }} />
                ) : (
                  <div className="fs-4 fw-extrabold">{breakdownCounts.newLeads}</div>
                )}
                <div className="text-xs fw-bold text-uppercase text-muted">New Leads</div>
              </div>

              <div className="funnel-step current">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="step-index">2</span>
                  <span className="badge bg-success-subtle text-success">INTERESTED</span>
                </div>
                {isLoading ? (
                  <div className="crm-skeleton my-1" style={{ width: 42, height: 26, borderRadius: 6 }} />
                ) : (
                  <div className="fs-4 fw-extrabold">{breakdownCounts.interested}</div>
                )}
                <div className="text-xs fw-bold text-uppercase text-muted">Interested</div>
              </div>

              <div className="funnel-step current">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="step-index">3</span>
                  <span className="badge bg-warning-subtle text-warning-emphasis">CALLBACK</span>
                </div>
                {isLoading ? (
                  <div className="crm-skeleton my-1" style={{ width: 42, height: 26, borderRadius: 6 }} />
                ) : (
                  <div className="fs-4 fw-extrabold">{breakdownCounts.callbackScheduled}</div>
                )}
                <div className="text-xs fw-bold text-uppercase text-muted">Callbacks</div>
              </div>

              <div className="funnel-step completed">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="step-index">4</span>
                  <span className="badge bg-success text-white">DISBURSED</span>
                </div>
                {isLoading ? (
                  <div className="crm-skeleton my-1" style={{ width: 42, height: 26, borderRadius: 6 }} />
                ) : (
                  <div className="fs-4 fw-extrabold">{breakdownCounts.disbursed}</div>
                )}
                <div className="text-xs fw-bold text-uppercase text-muted">Disbursed</div>
              </div>
            </div>

            {/* Active Leads Snapshot */}
            <div className="crm-table-wrapper flex-grow-1">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Loan Type &amp; Amount</th>
                    <th>Income &amp; CIBIL</th>
                    <th>Status</th>
                    <th>Assigned Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [1, 2, 3, 4, 5,].map((i) => (
                      <tr key={i}>
                        <td>
                          <div className="crm-skeleton mb-1" style={{ width: 110, height: 14 }} />
                          <div className="crm-skeleton" style={{ width: 85, height: 11 }} />
                        </td>
                        <td>
                          <div className="crm-skeleton mb-1" style={{ width: 80, height: 14 }} />
                          <div className="crm-skeleton" style={{ width: 65, height: 11 }} />
                        </td>
                        <td>
                          <div className="crm-skeleton mb-1" style={{ width: 85, height: 12 }} />
                          <div className="crm-skeleton" style={{ width: 60, height: 11 }} />
                        </td>
                        <td>
                          <div className="crm-skeleton rounded-pill" style={{ width: 75, height: 22 }} />
                        </td>
                        <td>
                          <div className="crm-skeleton" style={{ width: 90, height: 14 }} />
                        </td>
                      </tr>
                    ))
                  ) : latestLeads.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No leads available yet. Upload leads via Bulk CSV or create a lead in Lead Distribution.
                      </td>
                    </tr>
                  ) : (
                    latestLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <div className="fw-bold">{lead.fullName || lead.customerName}</div>
                          <div className="text-xs text-muted">{lead.phone}</div>
                        </td>
                        <td>
                          <div className="fw-semibold">{formatINR(lead.loanAmount)}</div>
                          <div className="text-xs text-muted">{lead.loanType}</div>
                        </td>
                        <td>
                          <div className="text-xs fw-semibold">{formatINR(lead.monthlyIncome)}/mo</div>
                          <div className="text-xs text-muted">CIBIL: {lead.creditScore || 'N/A'}</div>
                        </td>
                        <td>
                          <StatusBadge status={lead.status} type="call" />
                        </td>
                        <td>
                          <span className="text-sm fw-medium">
                            {lead.assignedStaffName ||
                              staff.find((s) => String(s.id) === String(lead.assignedTo))?.name ||
                              'Unassigned'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Performing Call Centre Staff (100-Call Quota Leaderboard) */}
        <div className="col-lg-5 d-flex flex-column">
          <div className="crm-panel h-100 d-flex flex-column justify-content-between">
            <div className="d-flex flex-column flex-grow-1">
              <div className="panel-header">
                <div>
                  <h5 className="panel-title">
                    <Sparkles size={19} className="text-warning" />
                    100-Call Daily Quota Leaderboard
                  </h5>
                  <p className="panel-subtitle">
                    Daily calling progress and conversion metrics for active executives
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary fw-semibold"
                  onClick={() => navigate('/admin/targets')}
                >
                  View All Staff ({staff.length})
                </button>
              </div>

              <div className="d-flex flex-column gap-3 flex-grow-1 justify-content-start">
                {isLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-3 rounded-3 border bg-light bg-opacity-50">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <div className="crm-skeleton" style={{ width: 110, height: 16 }} />
                          <div className="crm-skeleton" style={{ width: 75, height: 12 }} />
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="crm-skeleton rounded-pill" style={{ width: 85, height: 20 }} />
                          <div className="crm-skeleton" style={{ width: 65, height: 14 }} />
                        </div>
                      </div>

                      <div className="mb-2">
                        <div className="crm-skeleton w-100" style={{ height: 8, borderRadius: 4 }} />
                      </div>

                      <div className="d-flex justify-content-between align-items-center text-xs">
                        <div className="crm-skeleton" style={{ width: 110, height: 12 }} />
                        <div className="crm-skeleton" style={{ width: 130, height: 12 }} />
                      </div>
                    </div>
                  ))
                ) : topExecutives.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    No staff members found. Register staff members in the Staff Target Tracker.
                  </div>
                ) : (
                  topExecutives.map((emp) => {
                    const pct = Math.min(
                      100,
                      Math.round(((emp.callsCompleted || 0) / (emp.dailyTarget || 100)) * 100)
                    );
                    return (
                      <div key={emp.id} className="p-3 rounded-3 border bg-light bg-opacity-50">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <span className="fw-bold">{emp.name}</span>
                            <span className="text-xs text-muted ms-2">
                              (#{emp.id} • {emp.email})
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <StatusBadge status={emp.performanceStatus || emp.status} type="agent" />
                            <button
                              type="button"
                              onClick={() => navigate('/staff/dialer')}
                              className="btn btn-xs btn-sm btn-link text-decoration-none p-0 fw-semibold"
                            >
                              Open Dialer →
                            </button>
                          </div>
                        </div>

                        <div className="progress progress-medium mb-2">
                          <div
                            className={`progress-bar ${pct >= 90 ? 'bg-success' : 'bg-primary'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="d-flex justify-content-between text-xs text-secondary fw-semibold">
                          <span>
                            Quota:{' '}
                            <strong className="text-dark">
                              {emp.callTargetDisplay || `${emp.callsCompleted}/${emp.dailyTarget}`}
                            </strong>{' '}
                            ({emp.progressPercentage || `${pct}%`})
                          </span>
                          <span>
                            Interested: <strong className="text-success">{emp.interestedCount}</strong> •{' '}
                            Converted: <strong className="text-primary">{emp.convertedLeadsCount}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-top mt-3 d-flex align-items-center justify-content-between text-xs text-muted">
              <span>Active floor staff: {staff.length} agents</span>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 fw-semibold text-primary text-decoration-none"
                onClick={() => navigate('/admin/targets')}
              >
                Manage Target SLA →
              </button>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div className="crm-toast">
            <LuCircleCheck size={18} className="flex-shrink-0" style={{ color: '#4ade80' }} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <CsvUploadModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};

export default AdminDashboard;

