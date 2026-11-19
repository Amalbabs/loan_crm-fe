import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  PhoneCall,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { LuCircleCheck } from 'react-icons/lu';
import StatusBadge from '../../components/common/StatusBadge';
import CallDispositionModal from '../../components/modals/CallDispositionModal';
import { getAssignedLeads, logCallOutcome } from '../../context/Staff/index';
import { getLeads } from '../../context/Leads/index';
import { normalizeLeadItem, getCurrentUser, formatINR } from '../../utils/normalizers';

const FollowUpSchedule = () => {
  const currentUser = getCurrentUser();
  const isAdmin =
    (currentUser?.role || localStorage.getItem('role') || '').toUpperCase() === 'ADMIN' ||
    (typeof window !== 'undefined' && window.location.pathname.includes('/admin'));

  const [showFloorWide, setShowFloorWide] = useState(isAdmin);
  const [callbackLeads, setCallbackLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (title) => {
    setToastMessage(title);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadCallbacks = useCallback((isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    const params = {
      status: 'CALLBACK_SCHEDULED',
      page: 1,
      limit: 50,
    };

    const fetcher = showFloorWide ? getLeads : getAssignedLeads;
    fetcher(params)((response) => {
      setIsLoading(false);
      setIsRefreshing(false);
      if (response && (response.success || response.status === 200) && response.data) {
        const rawList = Array.isArray(response.data.leads)
          ? response.data.leads
          : Array.isArray(response.data)
          ? response.data
          : [];
        setCallbackLeads(rawList.map(normalizeLeadItem));
      } else if (!showFloorWide) {
        getLeads(params)((fallbackRes) => {
          if (fallbackRes && fallbackRes.success && fallbackRes.data) {
            const rawList = Array.isArray(fallbackRes.data.leads)
              ? fallbackRes.data.leads
              : [];
            setCallbackLeads(rawList.map(normalizeLeadItem));
          } else {
            setCallbackLeads([]);
          }
        });
      } else {
        setCallbackLeads([]);
      }
    });
  }, [showFloorWide]);

  useEffect(() => {
    loadCallbacks(false);
  }, [loadCallbacks]);

  const handleQuickConvertInterested = (lead) => {
    logCallOutcome({
      lead_id: lead.id,
      call_disposition: 'INTERESTED',
      call_duration_seconds: 120,
      remarks: `${lead.notes ? lead.notes + ' | ' : ''}Follow-up call completed: Customer confirmed interest & ready to share KYC documents.`,
    })((res) => {
      if (res && (res.success || res.status === 201 || res.status === 200)) {
        showToast('Converted to INTERESTED (+1 Call Logged)');
        loadCallbacks();
      } else {
        showToast(res?.message || 'Failed to update call disposition.');
      }
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold mb-1">Scheduled Callbacks &amp; Follow-Up Queue</h3>
          
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            onClick={() => loadCallbacks(true)}
            disabled={isRefreshing}
            title="Refresh Callbacks"
          >
            <RefreshCw size={15} className={isRefreshing ? 'spinner-border spinner-border-sm' : ''} />
          </button>

          <div className="btn-group">
            <button
              type="button"
              className={`btn fw-semibold ${!showFloorWide ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setShowFloorWide(false)}
            >
              My Scheduled Callbacks
            </button>
            {isAdmin && (
              <button
                type="button"
                className={`btn fw-semibold ${showFloorWide ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setShowFloorWide(true)}
              >
                All Floor Callbacks
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading || isRefreshing ? (
        <div className="crm-panel text-center py-5">
          <div
            className="spinner-border mb-2"
            role="status"
            style={{ width: '2rem', height: '2rem', color: '#153298' }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-xs text-muted fw-semibold">Loading scheduled callbacks...</div>
        </div>
      ) : callbackLeads.length === 0 ? (
        <div className="crm-panel text-center py-5">
          <CalendarClock size={40} className="text-muted mb-2" />
          <h5 className="fw-bold">No Scheduled Callbacks in This View</h5>
          <p className="text-muted text-sm mb-0">
            Schedule callbacks from the Call Queue Dialer to populate this reminder board.
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {callbackLeads.map((lead) => (
            <div key={lead.id} className="col-md-6">
              <div className="crm-panel h-100 d-flex flex-column justify-content-between border-start border-4 border-warning">
                <div>
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <div>
                      <span className="font-mono text-xs fw-bold text-primary me-2">#{lead.id}</span>
                      <StatusBadge status={lead.status} type="call" />
                    </div>
                    <span className="badge bg-warning text-dark fw-bold d-inline-flex align-items-center gap-1 px-2 py-1">
                      <Clock size={13} />
                      {lead.followUpDate
                        ? new Date(lead.followUpDate).toLocaleString()
                        : 'Scheduled Callback'}
                    </span>
                  </div>

                  <h5 className="fw-extrabold mb-1">{lead.fullName}</h5>
                  <div className="text-xs text-muted mb-3">
                    {lead.phone} {lead.email ? `• ${lead.email}` : ''}{' '}
                    {lead.assignedStaffName ? `• Assigned: ${lead.assignedStaffName}` : ''}
                  </div>

                  <div className="row g-2 p-2 rounded-3 bg-light border mb-3">
                    <div className="col-4 border-end">
                      <div className="text-xs text-muted">Loan Amount</div>
                      <div className="fw-bold text-sm">{formatINR(lead.loanAmount)}</div>
                    </div>
                    <div className="col-4 border-end">
                      <div className="text-xs text-muted">Loan Type</div>
                      <div className="fw-bold text-sm">{lead.loanType}</div>
                    </div>
                    <div className="col-4">
                      <div className="text-xs text-muted">Calls Logged</div>
                      <div className="fw-bold text-sm text-primary">{lead.totalCallsLogged}</div>
                    </div>
                  </div>

                  {lead.notes && (
                    <p className="text-xs text-secondary bg-warning bg-opacity-10 p-2 rounded border border-warning-subtle mb-3">
                      <strong>Remarks:</strong> {lead.notes}
                    </p>
                  )}
                </div>

                <div className="d-flex flex-wrap gap-2 pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-cta fw-semibold flex-grow-1 d-inline-flex align-items-center justify-content-center gap-2 shadow-cta"
                    onClick={() => handleQuickConvertInterested(lead)}
                  >
                    <CheckCircle2 size={16} />
                    Convert to INTERESTED (+1 Call)
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary fw-semibold d-inline-flex align-items-center gap-2"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <PhoneCall size={15} />
                    Re-Dial / Log Disposition
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toastMessage && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
          <div className="crm-toast">
            <LuCircleCheck size={18} className="flex-shrink-0" style={{ color: '#4ade80' }} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <CallDispositionModal
        lead={selectedLead}
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        initialDisposition="INTERESTED"
        onSuccess={() => {
          showToast('Call outcome updated successfully!');
          loadCallbacks();
        }}
      />
    </div>
  );
};

export default FollowUpSchedule;
