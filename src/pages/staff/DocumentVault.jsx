import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFormik } from 'formik';
import {
  FileCheck2,
  Upload,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  X,
  Search,
  Plus,
  FileText,
} from 'lucide-react';
import { LuCircleCheck } from 'react-icons/lu';
import StatusBadge from '../../components/common/StatusBadge';
import { getAssignedLeads, uploadCustomerDocument } from '../../context/Staff/index';
import { getLeads, createLead } from '../../context/Leads/index';
import { verifyDocument } from '../../context/Admin/index';
import { normalizeLeadItem, getCurrentUser, formatINR } from '../../utils/normalizers';

const ALLOWED_DOC_TYPES = [
  { key: 'PAN', label: 'PAN Card' },
  { key: 'AADHAAR', label: 'Aadhaar Card' },
  { key: 'BANK_STATEMENT', label: 'Bank Statement' },
  { key: 'SALARY_SLIP', label: 'Salary Slip' },
  { key: 'ITR', label: 'ITR / Financials' },
  { key: 'OTHER', label: 'Other Document' },
];

const DocumentVault = () => {
  const currentUser = getCurrentUser();
  const isAdmin =
    (currentUser?.role || localStorage.getItem('role') || '').toUpperCase() === 'ADMIN' ||
    (typeof window !== 'undefined' && window.location.pathname.includes('/admin'));

  const [viewScope, setViewScope] = useState(isAdmin ? 'ALL_FLOOR' : 'MY_FILES');
  const [pipelineLeads, setPipelineLeads] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sessionDocsByLead, setSessionDocsByLead] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Collect Document Modal State
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectLeadId, setCollectLeadId] = useState('');
  const [collectDocType, setCollectDocType] = useState('PAN');
  const [collectFile, setCollectFile] = useState(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const showToast = (title) => {
    setToastMessage(title);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Verify Document Modal state (PUT /api/admin/verify-document/:id)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyForm, setVerifyForm] = useState({
    docId: '',
    leadId: null,
    docType: 'PAN',
    status: 'APPROVED',
    remarks: 'PAN card name and DOB matches NSDL database.',
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const loadPipelineLeads = useCallback((isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    const fetcher = viewScope === 'ALL_FLOOR' ? getLeads : getAssignedLeads;

    fetcher({ page: 1, limit: 100 })((response) => {
      setIsLoading(false);
      setIsRefreshing(false);
      if (response && (response.success || response.status === 200) && response.data) {
        const rawList = Array.isArray(response.data.leads)
          ? response.data.leads
          : Array.isArray(response.data)
          ? response.data
          : [];
        const normalized = rawList.map(normalizeLeadItem);
        setAllLeads(normalized);
        const filtered = normalized.filter(
          (l) =>
            l.status === 'INTERESTED' ||
            l.status === 'DISBURSED' ||
            l.totalDocuments > 0
        );
        setPipelineLeads(filtered.length > 0 ? filtered : normalized);
      } else if (viewScope === 'MY_FILES') {
        getLeads({ page: 1, limit: 100 })((fallbackRes) => {
          if (fallbackRes && fallbackRes.success && fallbackRes.data) {
            const rawList = Array.isArray(fallbackRes.data.leads)
              ? fallbackRes.data.leads
              : [];
            const normalized = rawList.map(normalizeLeadItem);
            setAllLeads(normalized);
            setPipelineLeads(normalized);
          } else {
            setAllLeads([]);
            setPipelineLeads([]);
          }
        });
      } else {
        setAllLeads([]);
        setPipelineLeads([]);
      }
    });
  }, [viewScope]);

  useEffect(() => {
    loadPipelineLeads(false);
  }, [loadPipelineLeads]);

  // Upload document via POST /api/staff/upload-document/:leadId
  const handleFileSelect = (leadId, docType, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const key = `${leadId}-${docType}`;
    setUploadingKey(key);

    uploadCustomerDocument({
      leadId,
      document: file,
      doc_type: docType,
    })((response) => {
      setUploadingKey(null);
      if (response && (response.success || response.status === 201 || response.status === 200)) {
        showToast(response.message || `${docType} document uploaded successfully!`);
        const uploadedDoc = response.data || {
          id: Date.now(),
          leadId,
          docType,
          originalName: file.name,
          verificationStatus: 'PENDING',
        };
        setSessionDocsByLead((prev) => ({
          ...prev,
          [leadId]: {
            ...(prev[leadId] || {}),
            [docType]: uploadedDoc,
          },
        }));
        loadPipelineLeads();
      } else {
        showToast(response?.message || 'Failed to upload document.');
      }
    });
  };

  // Collect & Upload document from modal
  const handleCollectSubmit = (e) => {
    e.preventDefault();
    if (!collectLeadId) {
      showToast('Please select or enter a Lead ID');
      return;
    }
    if (!collectFile) {
      showToast('Please select a document file to upload');
      return;
    }

    setIsCollecting(true);
    uploadCustomerDocument({
      leadId: collectLeadId,
      document: collectFile,
      doc_type: collectDocType,
    })((response) => {
      setIsCollecting(false);
      if (response && (response.success || response.status === 201 || response.status === 200)) {
        showToast(response.message || `${collectDocType} document collected and uploaded successfully!`);
        const uploadedDoc = response.data || {
          id: Date.now(),
          leadId: collectLeadId,
          docType: collectDocType,
          originalName: collectFile.name,
          verificationStatus: 'PENDING',
        };
        setSessionDocsByLead((prev) => ({
          ...prev,
          [collectLeadId]: {
            ...(prev[collectLeadId] || {}),
            [collectDocType]: uploadedDoc,
          },
        }));
        setCollectModalOpen(false);
        setCollectFile(null);
        loadPipelineLeads();
      } else {
        showToast(response?.message || 'Failed to collect document.');
      }
    });
  };

  // Open Verify Document Modal (PUT /api/admin/verify-document/:id)
  const openVerifyModal = (docObj = {}) => {
    setVerifyForm({
      docId: docObj.id || docObj._id || docObj.document_id || '',
      leadId: docObj.leadId || docObj.lead_id || null,
      docType: docObj.docType || docObj.doc_type || 'PAN',
      status: 'APPROVED',
      remarks:
        docObj.verificationRemarks ||
        docObj.remarks ||
        'Document verified and matches customer application details.',
    });
    setVerifyModalOpen(true);
  };

  const formik = useFormik({
    initialValues: verifyForm,
    enableReinitialize: true,
    validate: (values) => {
      let errors = {};
      if (!values.docId) {
        errors.docId = 'Document ID is required';
      }
      if (!values.status) {
        errors.status = 'Please choose verification status';
      }
      if (!values.remarks || !values.remarks.trim()) {
        errors.remarks = 'Verification remarks are required';
      }
      return errors;
    },
    onSubmit: (values) => {
      if (!values.docId) return;

      setIsVerifying(true);
      verifyDocument({
        id: values.docId,
        status: values.status,
        remarks: values.remarks,
      })((response) => {
        setIsVerifying(false);
        if (response && (response.success || response.status === 200)) {
          showToast(response.message || `Document status updated to ${values.status}.`);
          const updatedDoc = response.data;
          if (updatedDoc && (updatedDoc.leadId || values.leadId)) {
            const targetLeadId = updatedDoc.leadId || values.leadId;
            const targetDocType = updatedDoc.docType || values.docType;
            setSessionDocsByLead((prev) => ({
              ...prev,
              [targetLeadId]: {
                ...(prev[targetLeadId] || {}),
                [targetDocType]: {
                  ...(prev[targetLeadId]?.[targetDocType] || {}),
                  ...updatedDoc,
                  verificationStatus: values.status,
                  verificationRemarks: values.remarks,
                },
              },
            }));
          }
          setVerifyModalOpen(false);
          loadPipelineLeads();
        } else {
          showToast(response?.message || 'Failed to verify document.');
        }
      });
    },
  });

  const handleLeadStatusUpdate = (lead, nextStatus) => {
    createLead({
      id: lead.id,
      full_name: lead.fullName,
      loan_amount: lead.loanAmount,
      status: nextStatus,
      notes: lead.notes,
    })((res) => {
      if (res && (res.success || res.status === 200 || res.status === 201)) {
        showToast(res.message || `Lead status updated to ${nextStatus}.`);
        loadPipelineLeads();
      } else {
        showToast(res?.message || 'Failed to update lead status.');
      }
    });
  };

  const getLeadDocList = useCallback(
    (lead) => {
      if (!lead) return [];
      const leadSessionDocs = sessionDocsByLead[lead.id] || {};
      const apiDocsMap = {};
      if (Array.isArray(lead.documents)) {
        lead.documents.forEach((d) => {
          const type = (d.docType || d.doc_type || '').toUpperCase();
          if (type) apiDocsMap[type] = d;
        });
      }
      return ALLOWED_DOC_TYPES.map((dm) => leadSessionDocs[dm.key] || apiDocsMap[dm.key]).filter(Boolean);
    },
    [sessionDocsByLead]
  );

  // Per-lead document verification stats (works with full documents[] or summary counts)
  const getLeadDocStats = useCallback(
    (lead) => {
      const docs = getLeadDocList(lead);
      const statusOf = (d) =>
        (d.verificationStatus || d.verification_status || d.status || 'PENDING').toUpperCase();
      let pending = docs.filter((d) => statusOf(d) === 'PENDING').length;
      let approved = docs.filter((d) => statusOf(d) === 'APPROVED').length;
      let rejected = docs.filter((d) => statusOf(d) === 'REJECTED').length;
      let total = Math.max(docs.length, lead.totalDocuments || 0);

      // Fallback to summary fields when the list API doesn't embed documents[]
      if (docs.length === 0) {
        pending = lead.pendingDocuments || 0;
        approved = lead.approvedDocuments || 0;
        rejected = lead.rejectedDocuments || 0;
        const summary = lead.docVerificationStatus;
        if (summary === 'APPROVED' && approved === 0) approved = 1;
        if (summary === 'REJECTED' && rejected === 0) rejected = 1;
        if (summary === 'PENDING' && pending === 0) pending = 1;
        if (total > 0 && pending + approved + rejected === 0) pending = total;
        total = Math.max(total, pending + approved + rejected);
      }
      return { total, pending, approved, rejected };
    },
    [getLeadDocList]
  );

  const matchesFilter = useCallback(
    (lead, key) => {
      const s = getLeadDocStats(lead);
      switch (key) {
        case 'ALL':
          return (
            ['INTERESTED', 'DISBURSED', 'CALLBACK_SCHEDULED'].includes(lead.status) || s.total > 0
          );
        case 'PENDING_VERIFY':
          return s.pending > 0;
        case 'APPROVED':
          return s.approved > 0;
        case 'REJECTED':
          return s.rejected > 0;
        case 'WITH_DOCS':
          return s.total > 0;
        case 'INTERESTED':
          return lead.status === 'INTERESTED';
        case 'ALL_LEADS':
        default:
          return true;
      }
    },
    [getLeadDocStats]
  );

  const displayedLeads = useMemo(() => {
    let list = allLeads.filter((l) => matchesFilter(l, statusFilter));

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((l) => {
        const haystack = [
          l.fullName,
          l.customerName,
          l.phone,
          String(l.id || ''),
          l.loanType,
          l.city,
          l.assignedStaffName,
          l.email,
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    return list;
  }, [allLeads, statusFilter, searchTerm, matchesFilter]);

  const filterCounts = useMemo(() => {
    const keys = ['ALL', 'PENDING_VERIFY', 'APPROVED', 'REJECTED', 'WITH_DOCS', 'INTERESTED', 'ALL_LEADS'];
    const counts = {};
    keys.forEach((k) => {
      counts[k] = allLeads.filter((l) => matchesFilter(l, k)).length;
    });
    return counts;
  }, [allLeads, matchesFilter]);

  const interestedCount = filterCounts.INTERESTED;
  const disbursedCount = (allLeads.length > 0 ? allLeads : pipelineLeads).filter(
    (l) => l.status === 'DISBURSED'
  ).length;
  const totalDocsCount = (allLeads.length > 0 ? allLeads : pipelineLeads).reduce(
    (acc, l) => acc + (l.totalDocuments || 0),
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold mb-1">
            {isAdmin
              ? 'Document Collection & Verification Vault'
              : 'Customer Document Collection & Verification Tracker'}
          </h3>
          <p className="text-secondary text-sm mb-0">
            {isAdmin
              ? 'Floor-wide KYC collection, document compliance review, and verification control'
              : 'Collect & upload customer KYC documents and track admin verification in real-time'}
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            onClick={() => loadPipelineLeads(true)}
            disabled={isRefreshing}
            title="Refresh Vault"
          >
            <RefreshCw size={15} className={isRefreshing ? 'spinner-border spinner-border-sm' : ''} />
          </button>

          {/* Collect Document Button */}
          <button
            type="button"
            className="btn btn-primary fw-semibold d-inline-flex align-items-center gap-2"
            onClick={() => {
              setCollectLeadId(displayedLeads[0]?.id || allLeads[0]?.id || '');
              setCollectDocType('PAN');
              setCollectFile(null);
              setCollectModalOpen(true);
            }}
          >
            <Plus size={16} />
            Collect Document
          </button>

          {isAdmin && (
            <button
              type="button"
              className="btn btn-outline-primary fw-semibold d-inline-flex align-items-center gap-2"
              onClick={() => openVerifyModal({})}
            >
              <ShieldCheck size={16} />
              Verify Document by ID
            </button>
          )}

          <div className="btn-group">
            <button
              type="button"
              className={`btn fw-semibold ${viewScope === 'MY_FILES' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewScope('MY_FILES')}
            >
              My Assigned Files
            </button>
            <button
              type="button"
              className={`btn fw-semibold ${viewScope === 'ALL_FLOOR' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewScope('ALL_FLOOR')}
            >
              All Floor Pipeline
            </button>
          </div>
        </div>
      </div>

      {/* Funnel Overview Cards */}
      <div className="funnel-stepper mb-4">
        <div className="funnel-step current">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="step-index">1</span>
            <span className="text-xs fw-bold text-muted">Active Pipeline</span>
          </div>
          <div className="fs-4 fw-extrabold">{displayedLeads.length}</div>
          <div className="text-xs fw-bold text-uppercase text-secondary">Total Files</div>
        </div>

        <div className="funnel-step current">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="step-index">2</span>
            <span className="text-xs fw-bold text-muted">KYC Collection</span>
          </div>
          <div className="fs-4 fw-extrabold">{interestedCount}</div>
          <div className="text-xs fw-bold text-uppercase text-secondary">Interested Leads</div>
        </div>

        <div className="funnel-step current">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="step-index">3</span>
            <span className="text-xs fw-bold text-muted">Uploaded Docs</span>
          </div>
          <div className="fs-4 fw-extrabold">{totalDocsCount}</div>
          <div className="text-xs fw-bold text-uppercase text-secondary">Documents Logged</div>
        </div>

        <div className="funnel-step completed">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="step-index">4</span>
            <span className="text-xs fw-bold text-muted">Sanctioned</span>
          </div>
          <div className="fs-4 fw-extrabold">{disbursedCount}</div>
          <div className="text-xs fw-bold text-uppercase text-secondary">Disbursed</div>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="crm-panel mb-4 p-3">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <Search size={15} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search borrower by name, phone, loan type, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-md-7">
            <div className="d-flex flex-wrap gap-1 justify-content-md-end">
              {[
                { key: 'ALL', label: 'Active Pipeline' },
                { key: 'PENDING_VERIFY', label: 'Pending Verification' },
                { key: 'APPROVED', label: 'Verified & Approved' },
                { key: 'REJECTED', label: 'Rejected (Action Needed)' },
                { key: 'WITH_DOCS', label: 'With Documents' },
                { key: 'INTERESTED', label: 'Interested' },
                { key: 'ALL_LEADS', label: 'All Floor Leads' },
              ].map((tab) => {
                const count = filterCounts[tab.key];
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                      isActive ? 'btn-primary fw-bold' : 'btn-outline-secondary'
                    }`}
                    onClick={() => setStatusFilter(tab.key)}
                  >
                    <span>{tab.label}</span>
                    {count !== undefined && (
                      <span
                        className={`badge rounded-pill text-xs ms-1 ${
                          isActive ? 'bg-white text-primary' : 'bg-secondary bg-opacity-25 text-dark'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Active Loan Application Files */}
      {isLoading ? (
        <div className="d-flex flex-column gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="crm-panel p-4">
              <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
                <div className="d-flex align-items-center gap-2">
                  <div className="crm-skeleton" style={{ width: 50, height: 20 }} />
                  <div className="crm-skeleton rounded-pill" style={{ width: 85, height: 20 }} />
                  <div className="crm-skeleton rounded-pill" style={{ width: 110, height: 20 }} />
                </div>
                <div className="crm-skeleton" style={{ width: 120, height: 16 }} />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-md-3">
                  <div className="crm-skeleton mb-1" style={{ width: '60%', height: 14 }} />
                  <div className="crm-skeleton" style={{ width: '40%', height: 12 }} />
                </div>
                <div className="col-md-3">
                  <div className="crm-skeleton mb-1" style={{ width: '50%', height: 14 }} />
                  <div className="crm-skeleton" style={{ width: '70%', height: 12 }} />
                </div>
                <div className="col-md-3">
                  <div className="crm-skeleton mb-1" style={{ width: '50%', height: 14 }} />
                  <div className="crm-skeleton" style={{ width: '60%', height: 12 }} />
                </div>
                <div className="col-md-3">
                  <div className="crm-skeleton mb-1" style={{ width: '60%', height: 14 }} />
                  <div className="crm-skeleton" style={{ width: '50%', height: 12 }} />
                </div>
              </div>
              <div className="row g-2">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="col-6 col-md-4 col-lg-2">
                    <div className="p-2 border rounded-3 bg-light text-center">
                      <div className="crm-skeleton mb-1" style={{ width: '70%', height: 12 }} />
                      <div className="crm-skeleton rounded-pill" style={{ width: '50%', height: 16 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : displayedLeads.length === 0 ? (
        <div className="crm-panel text-center py-5">
          <FileCheck2 size={40} className="text-muted mb-2" />
          <h5 className="fw-bold">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No Matching Leads Found'
              : 'No Leads in Document Pipeline'}
          </h5>
          <p className="text-muted text-sm mb-3">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No borrowers match your active search or filter criteria. Try resetting your search.'
              : 'Use the "Collect Document" button above or mark a prospect as Interested to start KYC document collection.'}
          </p>
          <div className="d-flex justify-content-center gap-2">
            {(searchTerm || statusFilter !== 'ALL') && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
              >
                Reset Filters
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary btn-sm fw-semibold d-inline-flex align-items-center gap-1"
              onClick={() => {
                setCollectLeadId(allLeads[0]?.id || '');
                setCollectDocType('PAN');
                setCollectFile(null);
                setCollectModalOpen(true);
              }}
            >
              <Plus size={14} />
              Collect Document
            </button>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {displayedLeads.map((lead) => {
            const leadSessionDocs = sessionDocsByLead[lead.id] || {};
            const apiDocsMap = {};
            if (Array.isArray(lead.documents)) {
              lead.documents.forEach((d) => {
                if (d.docType || d.doc_type) {
                  apiDocsMap[(d.docType || d.doc_type).toUpperCase()] = d;
                }
              });
            }

            const allDocValues = ALLOWED_DOC_TYPES.map((dm) => leadSessionDocs[dm.key] || apiDocsMap[dm.key]).filter(Boolean);
            const hasRejected = allDocValues.some((d) => (d.verificationStatus || d.verification_status || d.status || '').toUpperCase() === 'REJECTED');
            const hasPending = allDocValues.some((d) => (d.verificationStatus || d.verification_status || d.status || '').toUpperCase() === 'PENDING');
            const approvedCount = allDocValues.filter((d) => (d.verificationStatus || d.verification_status || d.status || '').toUpperCase() === 'APPROVED').length;

            return (
              <div key={lead.id} className="crm-panel">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 pb-3 mb-3 border-bottom">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs fw-bold text-primary">#{lead.id}</span>
                      <StatusBadge status={lead.status} type="call" />
                      <span className="badge bg-info-subtle text-info-emphasis">
                        {lead.totalDocuments} Uploaded Docs
                      </span>
                      {/* Verification Tracker Badges */}
                      {hasRejected ? (
                        <span className="badge bg-danger text-white">
                          ⚠️ Action Needed: Rejected Docs
                        </span>
                      ) : hasPending ? (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                          ⏳ Verification Pending
                        </span>
                      ) : approvedCount > 0 ? (
                        <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">
                          ✓ {approvedCount} Verified
                        </span>
                      ) : null}

                      {lead.assignedStaffName && (
                        <span className="badge bg-light text-dark border">
                          Staff: {lead.assignedStaffName}
                        </span>
                      )}
                    </div>
                    <h5 className="fw-extrabold mb-0">
                      {lead.fullName} — {formatINR(lead.loanAmount)} ({lead.loanType})
                    </h5>
                    <span className="text-xs text-muted">
                      {lead.phone} {lead.email ? `• ${lead.email}` : ''} • CIBIL:{' '}
                      {lead.creditScore || 'N/A'}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary fw-semibold d-inline-flex align-items-center gap-1"
                      onClick={() => {
                        setCollectLeadId(lead.id);
                        setCollectDocType('PAN');
                        setCollectFile(null);
                        setCollectModalOpen(true);
                      }}
                    >
                      <Plus size={13} />
                      Collect Doc
                    </button>
                    {['INTERESTED', 'DISBURSED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleLeadStatusUpdate(lead, st)}
                        className={`btn btn-sm ${
                          lead.status === st
                            ? 'btn-primary fw-bold'
                            : 'btn-outline-secondary'
                        }`}
                      >
                        Mark {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mandatory Documents Checklist Grid (PAN, AADHAAR, BANK_STATEMENT, SALARY_SLIP, ITR, OTHER) */}
                <div className="row g-3">
                  {ALLOWED_DOC_TYPES.map((docMeta) => {
                    const existingDoc =
                      leadSessionDocs[docMeta.key] || apiDocsMap[docMeta.key] || null;
                    const verificationStatus = (
                      existingDoc?.verificationStatus ||
                      existingDoc?.verification_status ||
                      existingDoc?.status ||
                      'NOT_UPLOADED'
                    ).toUpperCase();
                    const isUploadingThis = uploadingKey === `${lead.id}-${docMeta.key}`;

                    return (
                      <div key={docMeta.key} className="col-md-6 col-xl-4">
                        <div
                          className={`p-3 rounded-3 border h-100 d-flex flex-column justify-content-between ${
                            verificationStatus === 'APPROVED'
                              ? 'bg-success bg-opacity-10 border-success-subtle'
                              : verificationStatus === 'REJECTED'
                              ? 'bg-danger bg-opacity-10 border-danger-subtle'
                              : verificationStatus === 'PENDING'
                              ? 'bg-primary bg-opacity-10 border-primary-subtle'
                              : 'bg-light'
                          }`}
                        >
                          <div>
                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                              <div>
                                <span className="fw-bold text-sm d-block">{docMeta.label}</span>
                                <code className="text-xs text-muted">doc_type: {docMeta.key}</code>
                              </div>
                              <span
                                className={`badge ${
                                  verificationStatus === 'APPROVED'
                                    ? 'bg-success text-white'
                                    : verificationStatus === 'REJECTED'
                                    ? 'bg-danger text-white'
                                    : verificationStatus === 'PENDING'
                                    ? 'bg-primary text-white'
                                    : 'bg-secondary-subtle text-secondary'
                                }`}
                              >
                                {existingDoc
                                  ? `#${existingDoc.id} • ${verificationStatus}`
                                  : 'Awaiting Upload'}
                              </span>
                            </div>

                            {existingDoc?.originalName && (
                              <div className="text-xs text-dark fw-semibold mb-2 text-truncate">
                                File: {existingDoc.originalName}
                              </div>
                            )}

                            {/* Real-time Verification Tracking for Staff & Admin */}
                            {verificationStatus === 'APPROVED' && (
                              <div className="rounded p-2 text-xs mb-2 border border-success-subtle bg-success bg-opacity-10 text-success-emphasis">
                                <div className="d-flex align-items-center gap-1 fw-bold mb-1">
                                  <CheckCircle2 size={13} className="text-success flex-shrink-0" />
                                  <span>Verified &amp; Approved</span>
                                </div>
                                <div className="text-secondary">
                                  Remarks: {existingDoc?.verificationRemarks || existingDoc?.verification_remarks || existingDoc?.remarks || 'Verified against compliance checklist.'}
                                </div>
                              </div>
                            )}

                            {verificationStatus === 'REJECTED' && (
                              <div className="rounded p-2 text-xs mb-2 border border-danger-subtle bg-danger bg-opacity-10 text-danger-emphasis">
                                <div className="d-flex align-items-center gap-1 fw-bold mb-1">
                                  <XCircle size={13} className="text-danger flex-shrink-0" />
                                  <span>Verification Rejected — Re-Upload Needed</span>
                                </div>
                                <div>
                                  Reason: {existingDoc?.verificationRemarks || existingDoc?.verification_remarks || existingDoc?.remarks || 'Document did not pass verification criteria.'}
                                </div>
                              </div>
                            )}

                            {verificationStatus === 'PENDING' && (
                              <div className="rounded p-2 text-xs mb-2 border border-primary-subtle bg-primary bg-opacity-10 text-primary-emphasis">
                                <div className="d-flex align-items-center gap-1 fw-bold mb-1">
                                  <RefreshCw size={13} className="text-primary flex-shrink-0" />
                                  <span>Under Admin Verification</span>
                                </div>
                                <div className="text-secondary">
                                  Document submitted. Tracking review status...
                                </div>
                              </div>
                            )}

                            {verificationStatus === 'NOT_UPLOADED' && (
                              <div className="text-xs text-muted mb-2">
                                Awaiting customer document. Click upload below to collect.
                              </div>
                            )}
                          </div>

                          <div className="d-flex flex-wrap gap-2 mt-2 pt-2 border-top">
                            <label className={`btn btn-sm flex-grow-1 fw-semibold d-inline-flex align-items-center justify-content-center gap-1 mb-0 cursor-pointer ${
                              verificationStatus === 'REJECTED' ? 'btn-danger' : 'btn-primary'
                            }`}>
                              <Upload size={13} />
                              <span>
                                {isUploadingThis
                                  ? 'Uploading...'
                                  : verificationStatus === 'REJECTED'
                                  ? 'Re-Upload Fixed File'
                                  : existingDoc
                                  ? 'Re-Upload'
                                  : 'Upload Document'}
                              </span>
                              <input
                                type="file"
                                className="d-none"
                                disabled={isUploadingThis}
                                onChange={(e) => handleFileSelect(lead.id, docMeta.key, e)}
                              />
                            </label>

                            {isAdmin && (existingDoc?.id || existingDoc?._id || existingDoc?.document_id) && (
                              <button
                                type="button"
                                className="btn btn-sm btn-success fw-semibold d-inline-flex align-items-center justify-content-center gap-1"
                                onClick={() =>
                                  openVerifyModal({
                                    ...existingDoc,
                                    id: existingDoc.id || existingDoc._id || existingDoc.document_id,
                                    leadId: lead.id,
                                    docType: docMeta.key,
                                  })
                                }
                              >
                                <ShieldCheck size={14} />
                                Verify
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Collect Customer Document Modal */}
      {collectModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setCollectModalOpen(false)}>
          <div className="crm-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h5 className="mb-0 fw-bold">Collect Customer Document</h5>
                <span className="text-xs text-muted">
                  Upload customer KYC or income verification files
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-light rounded-circle p-2"
                onClick={() => setCollectModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCollectSubmit}>
              <div className="crm-modal-body">
                <div className="mb-3">
                  <label className="form-label text-sm fw-bold">
                    Target Lead / Borrower <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={collectLeadId}
                    onChange={(e) => setCollectLeadId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Borrower --</option>
                    {(allLeads.length > 0 ? allLeads : pipelineLeads).map((l) => (
                      <option key={l.id} value={l.id}>
                        #{l.id} — {l.fullName} ({l.phone}) • {l.loanType}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label text-sm fw-bold">
                    Document Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={collectDocType}
                    onChange={(e) => setCollectDocType(e.target.value)}
                  >
                    {ALLOWED_DOC_TYPES.map((dt) => (
                      <option key={dt.key} value={dt.key}>
                        {dt.label} ({dt.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label text-sm fw-bold">
                    Select Document File <span className="text-danger">*</span>
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    required
                    onChange={(e) => setCollectFile(e.target.files?.[0] || null)}
                  />
                  <span className="text-xs text-muted mt-1 d-block">
                    Accepted formats: PDF, JPG, PNG, JPEG. Max size: 10MB.
                  </span>
                </div>
              </div>

              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary fw-semibold px-4"
                  onClick={() => setCollectModalOpen(false)}
                  disabled={isCollecting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary fw-semibold px-4 shadow-cta d-inline-flex align-items-center gap-2"
                  disabled={isCollecting}
                >
                  <Upload size={15} />
                  {isCollecting ? 'Uploading...' : 'Upload & Collect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Verify Document Modal (PUT /api/admin/verify-document/:id) */}
      {isAdmin && verifyModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setVerifyModalOpen(false)}>
          <div className="crm-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h5 className="mb-0 fw-bold">Verify Customer KYC / Financial Document</h5>
                <span className="text-xs text-muted">
                  Review borrower compliance and document authenticity
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-light rounded-circle p-2"
                onClick={() => setVerifyModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={formik.handleSubmit}>
              <div className="crm-modal-body">
                <div className="mb-3">
                  <label className="form-label text-sm fw-bold">
                    Document ID <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="docId"
                    className={`form-control ${formik.touched.docId && formik.errors.docId ? 'is-invalid' : ''}`}
                    value={formik.values.docId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="e.g., 15"
                  />
                  {formik.touched.docId && formik.errors.docId && (
                    <div className="text-danger text-xs mt-1">{formik.errors.docId}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label text-sm fw-bold">
                    Verification Status
                  </label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        formik.setFieldValue('status', 'APPROVED');
                        if (!formik.values.remarks || formik.values.remarks.includes('older than')) {
                          formik.setFieldValue(
                            'remarks',
                            'PAN card name and DOB matches NSDL database.'
                          );
                        }
                      }}
                      className={`btn btn-sm flex-grow-1 fw-bold d-inline-flex align-items-center justify-content-center gap-1 ${
                        formik.values.status === 'APPROVED'
                          ? 'btn-success'
                          : 'btn-outline-secondary'
                      }`}
                    >
                      <CheckCircle2 size={15} />
                      APPROVED
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        formik.setFieldValue('status', 'REJECTED');
                        formik.setFieldValue(
                          'remarks',
                          'Bank statement is older than 3 months. Upload latest statement.'
                        );
                      }}
                      className={`btn btn-sm flex-grow-1 fw-bold d-inline-flex align-items-center justify-content-center gap-1 ${
                        formik.values.status === 'REJECTED'
                          ? 'btn-danger'
                          : 'btn-outline-secondary'
                      }`}
                    >
                      <XCircle size={15} />
                      REJECTED
                    </button>
                  </div>
                  {formik.touched.status && formik.errors.status && (
                    <div className="text-danger text-xs mt-1">{formik.errors.status}</div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label text-sm fw-bold">
                    Verification Remarks <span className="text-danger">*</span>
                  </label>
                  <textarea
                    rows="3"
                    name="remarks"
                    className={`form-control ${formik.touched.remarks && formik.errors.remarks ? 'is-invalid' : ''}`}
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Enter verification remarks..."
                  />
                  {formik.touched.remarks && formik.errors.remarks && (
                    <div className="text-danger text-xs mt-1">{formik.errors.remarks}</div>
                  )}
                </div>
              </div>

              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary fw-semibold px-4"
                  onClick={() => setVerifyModalOpen(false)}
                  disabled={isVerifying}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn fw-semibold px-4 shadow-cta ${
                    formik.values.status === 'APPROVED' ? 'btn-success' : 'btn-danger'
                  }`}
                  disabled={isVerifying}
                >
                  {isVerifying ? 'Updating...' : `Submit ${formik.values.status}`}
                </button>
              </div>
            </form>
          </div>
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
    </div>
  );
};

export default DocumentVault;
