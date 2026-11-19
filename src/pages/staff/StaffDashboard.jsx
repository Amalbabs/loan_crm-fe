import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PhoneCall,
  CalendarClock,
  FileCheck2,
  RefreshCw,
  TrendingUp,
  Target,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import TargetGauge from '../../components/common/TargetGauge';
import StatusBadge from '../../components/common/StatusBadge';
import MetricCard from '../../components/common/MetricCard';
import { getPersonalPerformance, getAssignedLeads } from '../../context/Staff/index';
import { getCurrentUser, normalizeLeadItem, formatINR } from '../../utils/normalizers';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [personalPerformance, setPersonalPerformance] = useState(null);
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = useCallback((isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    let pending = 2;
    const checkDone = () => {
      pending -= 1;
      if (pending <= 0) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    // 1. Fetch personal performance
    getPersonalPerformance()((res) => {
      if (res && res.success && res.data) {
        setPersonalPerformance(res.data);
      }
      checkDone();
    });

    // 2. Fetch assigned leads (first page) for queue counts and recent callbacks
    getAssignedLeads({ page: 1, limit: 30 })((res) => {
      if (res && (res.success || res.status === 200) && res.data) {
        const rawList = Array.isArray(res.data.leads)
          ? res.data.leads
          : Array.isArray(res.data)
          ? res.data
          : [];
        setAssignedLeads(rawList.map(normalizeLeadItem));
      } else {
        setAssignedLeads([]);
      }
      checkDone();
    });
  }, []);

  useEffect(() => {
    loadDashboardData(false);
  }, [loadDashboardData]);

  const activeStaff = {
    id: currentUser?.id || 'STAFF',
    name: personalPerformance?.agentName || currentUser?.name || 'Staff Member',
    dailyTarget: Number(personalPerformance?.dailyTarget ?? currentUser?.dailyCallTarget ?? 100),
    callsCompleted: Number(personalPerformance?.callsCompletedToday ?? 0),
    callTargetDisplay:
      personalPerformance?.callTargetDisplay ||
      `${personalPerformance?.callsCompletedToday ?? 0} / ${personalPerformance?.dailyTarget ?? 100}`,
    remainingCallsNeeded: Number(personalPerformance?.remainingCallsNeeded ?? 0),
    progressPercentage: personalPerformance?.progressPercentage || '0%',
    status: personalPerformance?.quotaStatus || 'ON_TRACK',
    interestedCount: Number(
      personalPerformance?.breakdownToday?.interested ??
        personalPerformance?.pipelineStats?.interestedLeads ??
        0
    ),
    callbacksCount: Number(personalPerformance?.breakdownToday?.callbackScheduled ?? 0),
    totalAssignedLeads: Number(
      personalPerformance?.pipelineStats?.totalAssignedLeads ?? assignedLeads.length
    ),
    docsCollected: Number(personalPerformance?.pipelineStats?.approvedOrDisbursedLeads ?? 0),
  };

  const newLeadsCount = assignedLeads.filter((l) => l.status === 'NEW').length;
  const scheduledCallbacks = assignedLeads.filter(
    (l) => l.status === 'CALLBACK_SCHEDULED'
  );

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold mb-1">Staff Dashboard</h3>
          <p className="text-xs text-muted mb-0">
            Real-time daily calling targets, pipeline conversion velocity, and workbench overview
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            title="Refresh Dashboard"
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              size={15}
              className={isRefreshing ? 'spinner-border spinner-border-sm' : ''}
            />
          </button>
          <button
            type="button"
            className="btn btn-cta fw-semibold d-inline-flex align-items-center gap-2 shadow-cta"
            onClick={() => navigate('/staff/dialer')}
          >
            <PhoneCall size={16} />
            Start Calling Queue
          </button>
        </div>
      </div>

      {/* Top Executive Header + 100-Call Target Gauge (With Skeleton Loader) */}
      {isLoading ? (
        <div className="row g-4 align-items-stretch mb-4">
          {/* Skeleton Left: Call Centre Workbench Card */}
          <div className="col-lg-7 d-flex flex-column justify-content-between">
            <div className="crm-panel h-100 d-flex flex-column justify-content-between p-4">
              <div>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                  <div
                    className="crm-skeleton rounded-pill"
                    style={{ width: 220, height: 26 }}
                  />
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="crm-skeleton rounded-pill"
                      style={{ width: 100, height: 26 }}
                    />
                    <div
                      className="crm-skeleton rounded-2"
                      style={{ width: 28, height: 28 }}
                    />
                  </div>
                </div>
                <div
                  className="crm-skeleton mb-2"
                  style={{ width: 260, height: 32, borderRadius: 8 }}
                />
                <div
                  className="crm-skeleton mb-3"
                  style={{ width: 170, height: 16 }}
                />
              </div>

              <div className="row g-2 pt-3 border-top text-center">
                <div className="col-3 border-end">
                  <div
                    className="crm-skeleton mb-2"
                    style={{ width: '70%', height: 13 }}
                  />
                  <div
                    className="crm-skeleton"
                    style={{ width: '45%', height: 24, borderRadius: 6 }}
                  />
                </div>
                <div className="col-3 border-end">
                  <div
                    className="crm-skeleton mb-2"
                    style={{ width: '70%', height: 13 }}
                  />
                  <div
                    className="crm-skeleton"
                    style={{ width: '45%', height: 24, borderRadius: 6 }}
                  />
                </div>
                <div className="col-3 border-end">
                  <div
                    className="crm-skeleton mb-2"
                    style={{ width: '70%', height: 13 }}
                  />
                  <div
                    className="crm-skeleton"
                    style={{ width: '45%', height: 24, borderRadius: 6 }}
                  />
                </div>
                <div className="col-3">
                  <div
                    className="crm-skeleton mb-2"
                    style={{ width: '70%', height: 13 }}
                  />
                  <div
                    className="crm-skeleton"
                    style={{ width: '45%', height: 24, borderRadius: 6 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton Right: Target Gauge Card */}
          <div className="col-lg-5">
            <div className="target-gauge-card d-flex align-items-center justify-content-between gap-3 p-4">
              <div className="flex-grow-1">
                <div
                  className="crm-skeleton skeleton-dark mb-2"
                  style={{ width: 140, height: 16, borderRadius: 4 }}
                />
                <div
                  className="crm-skeleton skeleton-dark mb-2"
                  style={{ width: 120, height: 30, borderRadius: 6 }}
                />
                <div
                  className="crm-skeleton skeleton-dark mb-3"
                  style={{ width: 190, height: 14 }}
                />
                <div className="d-flex gap-2">
                  <div
                    className="crm-skeleton skeleton-dark rounded-pill"
                    style={{ width: 110, height: 24 }}
                  />
                  <div
                    className="crm-skeleton skeleton-dark rounded-pill"
                    style={{ width: 120, height: 24 }}
                  />
                </div>
              </div>
              <div
                className="crm-skeleton skeleton-dark rounded-circle flex-shrink-0"
                style={{ width: 90, height: 90 }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-4 align-items-stretch mb-4">
          <div className="col-lg-7 d-flex flex-column justify-content-between">
            <div className="crm-panel h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                  <span className="badge bg-primary-subtle text-primary fw-bold px-2 py-1">
                    Agent #{currentUser?.id} • Call Centre Workbench
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <StatusBadge status={activeStaff.status} type="agent" />
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-icon-sm"
                      title="Refresh Workbench"
                      onClick={() => loadDashboardData(true)}
                      disabled={isRefreshing}
                    >
                      <RefreshCw
                        size={14}
                        className={isRefreshing ? 'spinner-border spinner-border-sm' : ''}
                      />
                    </button>
                  </div>
                </div>
                <h3 className="fw-extrabold mb-1">
                  Welcome, {activeStaff.name}
                </h3>
              </div>

              <div className="row g-2 pt-2 border-top text-center">
                <div className="col-3 border-end">
                  <div className="text-xs text-muted fw-semibold">Assigned Leads</div>
                  <div className="fs-5 fw-extrabold text-dark">
                    {activeStaff.totalAssignedLeads}
                  </div>
                </div>
                <div className="col-3 border-end">
                  <div className="text-xs text-muted fw-semibold">New To Dial</div>
                  <div className="fs-5 fw-extrabold text-primary">{newLeadsCount}</div>
                </div>
                <div className="col-3 border-end">
                  <div className="text-xs text-muted fw-semibold">Interested Today</div>
                  <div className="fs-5 fw-extrabold text-success">
                    {activeStaff.interestedCount}
                  </div>
                </div>
                <div className="col-3">
                  <div className="text-xs text-muted fw-semibold">Callbacks Set</div>
                  <div className="fs-5 fw-extrabold text-warning-emphasis">
                    {activeStaff.callbacksCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <TargetGauge employee={activeStaff} />
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="row g-3 mb-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="col-sm-6 col-xl-3">
              <div className="crm-metric-card p-3">
                <div className="d-flex justify-content-between mb-3">
                  <div className="w-100">
                    <div
                      className="crm-skeleton mb-2"
                      style={{ width: '50%', height: 12 }}
                    />
                    <div
                      className="crm-skeleton"
                      style={{ width: '35%', height: 26, borderRadius: 6 }}
                    />
                  </div>
                  <div
                    className="crm-skeleton rounded-3"
                    style={{ width: 42, height: 42 }}
                  />
                </div>
                <div className="crm-skeleton" style={{ width: '75%', height: 12 }} />
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="col-sm-6 col-xl-3">
              <MetricCard
                label="Dialer Queue"
                value={newLeadsCount}
                subtext={`${activeStaff.totalAssignedLeads} total leads assigned`}
                icon={PhoneCall}
                tone="primary"
                badgeText={newLeadsCount > 0 ? `${newLeadsCount} Pending` : 'All Contacted'}
                badgeTone={newLeadsCount > 0 ? 'primary' : 'success'}
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <MetricCard
                label="Daily Call Quota"
                value={`${activeStaff.callsCompleted} / ${activeStaff.dailyTarget}`}
                subtext={`${activeStaff.remainingCallsNeeded} remaining to hit target`}
                icon={Target}
                tone="cyan"
                progressPercent={Math.min(
                  100,
                  Math.round(
                    (activeStaff.callsCompleted / (activeStaff.dailyTarget || 1)) * 100
                  )
                )}
                badgeText={activeStaff.progressPercentage}
                badgeTone="primary"
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <MetricCard
                label="Interested Conversions"
                value={activeStaff.interestedCount}
                subtext="Leads ready for document collection"
                icon={TrendingUp}
                tone="success"
                badgeText="Hot Pipeline"
                badgeTone="success"
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <MetricCard
                label="Scheduled Callbacks"
                value={activeStaff.callbacksCount}
                subtext="Prospective customer follow-ups"
                icon={CalendarClock}
                tone="warning"
                badgeText={
                  activeStaff.callbacksCount > 0
                    ? `${activeStaff.callbacksCount} Scheduled`
                    : 'Clear'
                }
                badgeTone={activeStaff.callbacksCount > 0 ? 'warning' : 'secondary'}
              />
            </div>
          </>
        )}
      </div>

      {/* Quick Navigation Cards & Scheduled Callback Preview */}
      <div className="row g-4">
        {/* Quick Launch Cards */}
        <div className="col-lg-6">
          <div className="crm-panel h-100">
            <h5 className="fw-extrabold mb-3 d-flex align-items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Quick Workspace Actions
            </h5>

            <div className="d-flex flex-column gap-3">
              <div
                className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3 cursor-pointer"
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onClick={() => navigate('/staff/dialer')}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 rounded-3 bg-primary text-white">
                    <PhoneCall size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0">Call Queue Dialer</h6>
                    <span className="text-xs text-muted">
                      Start one-click dialing assigned prospects &amp; log dispositions
                    </span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-primary flex-shrink-0" />
              </div>

              <div
                className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3 cursor-pointer"
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onClick={() => navigate('/staff/followups')}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 rounded-3 bg-warning text-dark">
                    <CalendarClock size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0">Follow-Up Schedule</h6>
                    <span className="text-xs text-muted">
                      Review customer callback reminders &amp; convert to interested
                    </span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-warning-emphasis flex-shrink-0" />
              </div>

              <div
                className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3 cursor-pointer"
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onClick={() => navigate('/staff/documents')}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 rounded-3 bg-success text-white">
                    <FileCheck2 size={20} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0">Document Collection Vault</h6>
                    <span className="text-xs text-muted">
                      Collect customer KYC docs &amp; track verification approval status
                    </span>
                  </div>
                </div>
                <ArrowRight size={18} className="text-success flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Callbacks Preview List */}
        <div className="col-lg-6">
          <div className="crm-panel h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="fw-extrabold mb-0 d-flex align-items-center gap-2">
                  <Clock size={18} className="text-warning" />
                  Upcoming Callbacks
                </h5>
                <button
                  type="button"
                  className="btn btn-sm btn-link text-primary fw-semibold p-0 text-decoration-none"
                  onClick={() => navigate('/staff/followups')}
                >
                  View All ({scheduledCallbacks.length})
                </button>
              </div>

              {isLoading ? (
                <div className="d-flex flex-column gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-2 border rounded-3 bg-light">
                      <div className="crm-skeleton mb-1" style={{ width: '40%', height: 14 }} />
                      <div className="crm-skeleton" style={{ width: '60%', height: 12 }} />
                    </div>
                  ))}
                </div>
              ) : scheduledCallbacks.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <CalendarClock size={32} className="mb-2 opacity-50" />
                  <div className="fw-bold text-sm">No Callbacks Scheduled</div>
                  <div className="text-xs">Schedule callbacks in the dialer console to populate reminders.</div>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {scheduledCallbacks.slice(0, 4).map((lead) => (
                    <div
                      key={lead.id}
                      className="p-2 border rounded-3 bg-light d-flex align-items-center justify-content-between gap-2"
                    >
                      <div className="overflow-hidden">
                        <div className="fw-bold text-sm text-truncate">{lead.fullName}</div>
                        <div className="text-xs text-muted">
                          {lead.phone} • {formatINR(lead.loanAmount)} ({lead.loanType})
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary fw-semibold py-1 px-2 text-xs flex-shrink-0"
                        onClick={() => navigate('/staff/dialer')}
                      >
                        Dial Now
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-top mt-3 text-center">
              <span className="text-xs text-muted">
                Need to call more leads? Check your{' '}
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 fw-semibold text-primary"
                  onClick={() => navigate('/staff/dialer')}
                >
                  Calling Queue ({newLeadsCount} new available)
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;

