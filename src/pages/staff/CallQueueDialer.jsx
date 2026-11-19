import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  PhoneOff,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  User,
  RefreshCw,
} from 'lucide-react';
import { LuCircleCheck } from 'react-icons/lu';
import StatusBadge from '../../components/common/StatusBadge';
import CallDispositionModal from '../../components/modals/CallDispositionModal';
import { getAssignedLeads, getPersonalPerformance } from '../../context/Staff/index';
import { getBankSchemes } from '../../context/Admin/index';
import { getLeads } from '../../context/Leads/index';
import { normalizeLeadItem, normalizeBankScheme, getCurrentUser, formatINR } from '../../utils/normalizers';

const CallQueueDialer = () => {
  const currentUser = getCurrentUser();
  const isAdmin = (currentUser?.role || '').toUpperCase() === 'ADMIN';

  const [queueLeads, setQueueLeads] = useState([]);
  const [personalPerformance, setPersonalPerformance] = useState(null);
  const [banks, setBanks] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (title) => {
    setToastMessage(title);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [isCalling, setIsCalling] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [lastCallDuration, setLastCallDuration] = useState(60);
  const [modalInitialDisposition, setModalInitialDisposition] = useState('INTERESTED');
  const [dispositionModalOpen, setDispositionModalOpen] = useState(false);

  const loadPerformanceAndSchemes = useCallback(() => {
    getPersonalPerformance()((res) => {
      if (res && res.success && res.data) {
        setPersonalPerformance(res.data);
      }
    });

    getBankSchemes({})((res) => {
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.schemes)
        ? res.data.schemes
        : [];
      if (res && res.success) {
        setBanks(list.map(normalizeBankScheme));
      }
    });
  }, []);

  const loadQueue = useCallback(
    (statusFilter = queueFilter, page = 1) => {
      setIsLoading(true);
      const params = {
        page,
        limit: 20,
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      };

      const fetcher = isAdmin ? getLeads : getAssignedLeads;
      fetcher(params)((response) => {
        setIsLoading(false);
        if (response && (response.success || response.status === 200) && response.data) {
          const rawList = Array.isArray(response.data.leads)
            ? response.data.leads
            : Array.isArray(response.data)
            ? response.data
            : [];
          const normalized = rawList.map(normalizeLeadItem);
          setQueueLeads(normalized);
          if (response.data.pagination) {
            setPagination(response.data.pagination);
          }
          setSelectedLeadId((prev) => {
            if (prev && normalized.some((l) => l.id === prev)) return prev;
            const firstNew = normalized.find((l) => l.status === 'NEW');
            return firstNew?.id || normalized[0]?.id || null;
          });
        } else {
          setQueueLeads([]);
        }
      });
    },
    [queueFilter, isAdmin]
  );

  useEffect(() => {
    loadPerformanceAndSchemes();
    loadQueue(queueFilter, 1);
  }, [loadPerformanceAndSchemes, loadQueue, queueFilter]);

  // Live Call Timer
  useEffect(() => {
    if (!isCalling) return undefined;
    const interval = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCalling]);

  const formatTimer = (secs) => {
    const mins = String(Math.floor(secs / 60)).padStart(2, '0');
    const rem = String(secs % 60).padStart(2, '0');
    return `${mins}:${rem}`;
  };

  const activeLead =
    queueLeads.find((l) => l.id === selectedLeadId) || queueLeads[0] || null;
  const matchedBank =
    banks.find((b) => b.loanType === activeLead?.loanType) || banks[0] || null;

  const estimatedEmi = activeLead
    ? Math.round(((activeLead.loanAmount || 500000) * 1.24) / 48)
    : 0;

  const handleOpenDisposition = (presetDisposition = 'INTERESTED') => {
    if (!activeLead) return;
    setLastCallDuration(callSeconds > 0 ? callSeconds : 60);
    setIsCalling(false);
    setCallSeconds(0);
    setModalInitialDisposition(presetDisposition);
    setDispositionModalOpen(true);
  };

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
    totalAssignedLeads: Number(personalPerformance?.pipelineStats?.totalAssignedLeads ?? queueLeads.length),
  };

  const newLeadsCount = queueLeads.filter((l) => l.status === 'NEW').length;

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    let pending = 2;
    const checkDone = () => {
      pending -= 1;
      if (pending <= 0) {
        setIsRefreshing(false);
      }
    };

    loadPerformanceAndSchemes();
    checkDone();

    const params = {
      page: pagination.page || 1,
      limit: 20,
      ...(queueFilter !== 'ALL' ? { status: queueFilter } : {}),
    };
    const fetcher = isAdmin ? getLeads : getAssignedLeads;
    fetcher(params)((response) => {
      if (response && (response.success || response.status === 200) && response.data) {
        const rawList = Array.isArray(response.data.leads)
          ? response.data.leads
          : Array.isArray(response.data)
          ? response.data
          : [];
        setQueueLeads(rawList.map(normalizeLeadItem));
      }
      checkDone();
    });
  };

  return (
    <div>
      {/* Dialer Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold mb-1">Call Queue Dialer</h3>
          <p className="text-xs text-muted mb-0">
            Assigned calling queue ({pagination.total || queueLeads.length} leads) • Review financial profiles and log instant call dispositions
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            title="Refresh Queue"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={15} className={isRefreshing ? 'spinner-border spinner-border-sm' : ''} />
          </button>
        </div>
      </div>

      {/* Interactive Dialer Console */}
      {activeLead ? (
        <div className="dialer-console mb-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 mb-3 border-bottom">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 rounded-4 bg-primary text-white">
                <PhoneCall size={24} />
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className="font-mono text-xs fw-bold text-primary">#{activeLead.id}</span>
                  <StatusBadge status={activeLead.status} type="call" />
                  <span className="badge bg-light text-dark border">
                    Calls: {activeLead.totalCallsLogged} • Docs: {activeLead.documentsCount}
                  </span>
                </div>
                <h4 className="fw-extrabold mb-0 mt-1">{activeLead.fullName}</h4>
                <span className="text-xs text-muted">
                  {activeLead.email || 'Verified Loan Prospect'}
                </span>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="dialer-phone-pill">
                <PhoneCall size={16} className="text-primary" />
                {activeLead.phone}
              </div>

              {isCalling ? (
                <>
                  <div className="call-timer-live">
                    <span className="pulse-dot" />
                    Connected • {formatTimer(callSeconds)}
                  </div>
                  <button
                    type="button"
                    className="btn btn-cta fw-semibold d-inline-flex align-items-center gap-2 shadow-cta"
                    onClick={() => handleOpenDisposition('INTERESTED')}
                  >
                    <PhoneOff size={16} />
                    End &amp; Log Disposition
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline-primary fw-semibold d-inline-flex align-items-center gap-2"
                    onClick={() => {
                      setCallSeconds(0);
                      setIsCalling(true);
                    }}
                  >
                    <PhoneCall size={16} />
                    Dial Prospect Now
                  </button>
                  <button
                    type="button"
                    className="btn btn-cta fw-semibold d-inline-flex align-items-center gap-2 shadow-cta"
                    onClick={() => handleOpenDisposition('INTERESTED')}
                  >
                    Log Call Outcome (+1 Quota)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Customer 360 + Matched Bank Pitch Card */}
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="p-3 rounded-3 bg-light border h-100">
                <div className="text-xs fw-bold text-uppercase text-muted mb-2">
                  <User size={13} className="me-1" />
                  Prospect Financial &amp; Bureau Profile
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-xs text-muted">Requested Loan</div>
                    <div className="fw-extrabold fs-5 text-primary">
                      {formatINR(activeLead.loanAmount)}
                    </div>
                    <span className="badge bg-white text-dark border">{activeLead.loanType}</span>
                  </div>
                  <div className="col-6">
                    <div className="text-xs text-muted">Bureau / CIBIL Score</div>
                    <div
                      className={`fw-extrabold fs-5 ${
                        activeLead.creditScore >= 750 ? 'text-success' : 'text-primary'
                      }`}
                    >
                      {activeLead.creditScore ? `${activeLead.creditScore} / 900` : 'Pending Bureau'}
                    </div>
                    <span className="text-xs text-success fw-semibold">
                      {activeLead.totalCallsLogged} Calls Logged
                    </span>
                  </div>
                  <div className="col-6">
                    <div className="text-xs text-muted">Monthly Income</div>
                    <div className="fw-bold">
                      {activeLead.monthlyIncome ? `${formatINR(activeLead.monthlyIncome)} / mo` : 'N/A'}
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-xs text-muted">Est. Monthly EMI (48m)</div>
                    <div className="fw-bold">{formatINR(estimatedEmi)} / mo</div>
                  </div>
                </div>
                {activeLead.notes && (
                  <div className="mt-3 pt-2 border-top text-xs text-secondary">
                    <strong>Remarks:</strong> {activeLead.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-6">
              <div className="p-3 rounded-3 border border-primary-subtle bg-primary bg-opacity-10 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-xs fw-bold text-uppercase text-primary">
                      <Building2 size={14} className="me-1" />
                      Recommended Partner Bank Pitch
                    </span>
                    {matchedBank && (
                      <span className="badge bg-primary">{matchedBank.bankName}</span>
                    )}
                  </div>
                  {matchedBank ? (
                    <>
                      <h6 className="fw-extrabold mb-1">{matchedBank.schemeName}</h6>
                      <p className="text-xs text-secondary mb-2">
                        ROI: <strong>{matchedBank.interestRate}</strong> • Max Tenure:{' '}
                        <strong>{matchedBank.maxTenureMonths} Months</strong> • Processing Fee:{' '}
                        <strong>{matchedBank.processingFee}</strong>
                      </p>
                      <div className="p-2 rounded bg-white border text-xs mb-3">
                        <strong>Tele-Sales Script Prompt:</strong> &ldquo;Hello {activeLead.fullName}, you are
                        pre-qualified for <strong>{matchedBank.bankName}&apos;s {matchedBank.schemeName}</strong>{' '}
                        up to {formatINR(activeLead.loanAmount)} at {matchedBank.interestRate}.&rdquo;
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-secondary mb-3">
                      Pitch eligible {activeLead.loanType} offer up to {formatINR(activeLead.loanAmount)} and log disposition below.
                    </p>
                  )}
                </div>

                {/* One-Click Disposition Bar */}
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDisposition('INTERESTED')}
                    className="btn btn-sm btn-success fw-semibold flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1"
                  >
                    <CheckCircle2 size={15} />
                    Mark Interested
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDisposition('CALLBACK_SCHEDULED')}
                    className="btn btn-sm btn-warning fw-semibold flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1"
                  >
                    <Clock size={15} />
                    Schedule Callback
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDisposition('NOT_INTERESTED')}
                    className="btn btn-sm btn-outline-danger bg-white fw-semibold d-inline-flex align-items-center justify-content-center gap-1"
                  >
                    <XCircle size={15} />
                    Not Interested
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="crm-panel text-center py-5 mb-4">
          <h5 className="fw-bold">No Assigned Leads in Current Queue</h5>
        
        </div>
      )}

      {/* Personal Call Queue Table */}
      <div className="crm-panel">
        <div className="panel-header">
          <div>
            <h5 className="panel-title">
              Assigned Calling Queue ({pagination.total || queueLeads.length} Leads)
            </h5>
            <p className="panel-subtitle">
              Click any prospect row to load into the interactive dialer console above
            </p>
          </div>
          <div className="btn-group btn-group-sm">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'NEW', label: 'NEW' },
              { key: 'INTERESTED', label: 'INTERESTED' },
              { key: 'CALLBACK_SCHEDULED', label: 'CALLBACK' },
              { key: 'NOT_INTERESTED', label: 'NOT INTERESTED' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setQueueFilter(t.key)}
                className={`btn ${
                  queueFilter === t.key ? 'btn-primary fw-semibold' : 'btn-outline-secondary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="crm-table-wrapper">
          <table className="crm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Loan Type &amp; Amount</th>
                <th>Calls Logged</th>
                <th>Documents</th>
                <th>Follow-Up Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading || isRefreshing ? (
                <tr>
                  <td colSpan="9" className="text-center py-5">
                    <div
                      className="spinner-border mb-2"
                      role="status"
                      style={{ width: '2rem', height: '2rem', color: '#153298' }}
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="text-sm text-muted fw-semibold">Loading assigned call queue...</div>
                  </td>
                </tr>
              ) : queueLeads.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-muted">
                    No assigned leads found for status filter: {queueFilter}
                  </td>
                </tr>
              ) : (
                queueLeads.map((lead) => {
                  const isSelected = activeLead?.id === lead.id;
                  return (
                    <tr
                      key={lead.id}
                      className={`cursor-pointer ${isSelected ? 'row-selected' : ''}`}
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      <td className="font-mono text-xs fw-bold text-primary">#{lead.id}</td>
                      <td>
                        <div className="fw-bold">{lead.fullName}</div>
                        {lead.email && <div className="text-xs text-muted">{lead.email}</div>}
                      </td>
                      <td className="font-mono text-xs fw-semibold">{lead.phone}</td>
                      <td>
                        <div className="fw-bold">{formatINR(lead.loanAmount)}</div>
                        <div className="text-xs text-muted">{lead.loanType}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {lead.totalCallsLogged}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-info-subtle text-info-emphasis">
                          {lead.documentsCount} Docs
                        </span>
                      </td>
                      <td className="text-xs text-muted">
                        {lead.followUpDate
                          ? new Date(lead.followUpDate).toLocaleString()
                          : '—'}
                      </td>
                      <td>
                        <StatusBadge status={lead.status} type="call" />
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                        style={{width:"100px"}}
                          type="button"
                          className="btn btn-sm btn-primary fw-semibold"
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setLastCallDuration(callSeconds > 0 ? callSeconds : 60);
                            setModalInitialDisposition(lead.status === 'NEW' ? 'INTERESTED' : lead.status);
                            setDispositionModalOpen(true);
                          }}
                        >
                          Log Call
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

      <CallDispositionModal
        lead={activeLead}
        isOpen={dispositionModalOpen}
        onClose={() => setDispositionModalOpen(false)}
        initialDisposition={modalInitialDisposition}
        initialDurationSeconds={lastCallDuration}
        banks={banks}
        agentName={activeStaff.name}
        onSuccess={() => {
          showToast('Call disposition logged successfully!');
          loadPerformanceAndSchemes();
          loadQueue(queueFilter, pagination.page);
        }}
      />
    </div>
  );
};

export default CallQueueDialer;
