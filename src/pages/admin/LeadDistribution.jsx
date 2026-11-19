import React, { useState, useEffect, useCallback } from 'react';
import { useFormik } from 'formik';
import {
  LuCloudUpload,
  LuFilter,
  LuSearch,
  LuRotateCcw,
  LuChevronLeft,
  LuChevronRight,
  LuSend,
  LuPlus,
  LuPencil,
  LuX,
  LuCircleCheck,
} from 'react-icons/lu';
import StatusBadge from '../../components/common/StatusBadge';
import CsvUploadModal from '../../components/modals/CsvUploadModal';
import { getLeads, createLead } from '../../context/Leads/index';
import { distributeLeads, getEmployeesPerformance, getAdminDashboardStats } from '../../context/Admin/index';
import { normalizeLeadItem, normalizeStaffMember, formatINR } from '../../utils/normalizers';

const INITIAL_LEAD_FORM = {
  id: null,
  full_name: '',
  phone: '',
  email: '',
  loan_type: 'Personal Loan',
  loan_amount: 500000,
  monthly_income: 65000,
  credit_score: 730,
  status: 'NEW',
  notes: '',
};

const LeadDistribution = () => {
  const [staff, setStaff] = useState([]);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadForm, setLeadForm] = useState(INITIAL_LEAD_FORM);
  const [isSavingLead, setIsSavingLead] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [unassignedCount, setUnassignedCount] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (title) => {
    setToastMessage(title);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterLoanType, setFilterLoanType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leadsList, setLeadsList] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Load staff list for manual assign dropdown
  useEffect(() => {
    getEmployeesPerformance()((res) => {
      if (res && res.success && Array.isArray(res.data)) {
        setStaff(res.data.map(normalizeStaffMember));
      }
    });
  }, []);

  // 1. Fetch leads from GET /api/leads
  const fetchLeadsFromApi = useCallback(
    (page = 1, isManual = false) => {
      setIsLoading(true);
      if (isManual) {
        setIsRefreshing(true);
      }

      const queryProps = {
        page,
        limit: 10,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        loan_type: filterLoanType !== 'ALL' ? filterLoanType : undefined,
        search: searchQuery.trim() || undefined,
      };

      getLeads(queryProps)((response) => {
        setIsLoading(false);
        setIsRefreshing(false);

        if (response && (response.success || response.status === 200) && response.data) {
          const rawList = Array.isArray(response.data.leads)
            ? response.data.leads
            : Array.isArray(response.data)
            ? response.data
            : [];
          const normalized = rawList.map(normalizeLeadItem);
          setLeadsList(normalized);

          if (response.data.pagination) {
            setPagination(response.data.pagination);
          } else {
            setPagination({
              total: normalized.length,
              page,
              limit: 10,
              totalPages: Math.max(1, Math.ceil(normalized.length / 10)),
            });
          }
        } else {
          setLeadsList([]);
          setPagination({
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 1,
          });
        }
      });

      // Sync unassigned leads count from stats
      getAdminDashboardStats()((res) => {
        if (res && res.success && res.data) {
          const newStatus = (res.data.statusBreakdown || []).find(
            (s) => (s.status || '').toUpperCase() === 'NEW'
          );
          setUnassignedCount(newStatus?.count !== undefined ? Number(newStatus.count) : 0);
        }
      });
    },
    [filterStatus, filterLoanType, searchQuery]
  );

  useEffect(() => {
    fetchLeadsFromApi(currentPage);
  }, [fetchLeadsFromApi, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 2. Round-Robin Lead Distribution via POST /api/admin/distribute-leads
  const handleRoundRobinDistribute = () => {
    if (unassignedCount === 0) {
      showToast('No unassigned leads available in the pool.');
      return;
    }
    setIsDistributing(true);
    distributeLeads({
      mode: 'round_robin',
    })((response) => {
      setIsDistributing(false);
      if (response && response.success) {
        showToast(
          response.message ||
            `Distributed ${response.distributedCount || 'new'} leads across ${response.staffCount || ''} active staff.`
        );
        fetchLeadsFromApi(currentPage);
      } else {
        showToast(response?.message || 'Failed to distribute leads.');
      }
    });
  };

  // 3. Manual Lead Assignment via POST /api/admin/distribute-leads
  const handleManualAssign = (leadId, staffId) => {
    if (!staffId) return;
    distributeLeads({
      mode: 'manual',
      staff_id: Number(staffId),
      lead_ids: [Number(leadId)],
    })((response) => {
      if (response && response.success) {
        showToast(response.message || `Lead #${leadId} assigned to staff #${staffId}`);
        fetchLeadsFromApi(currentPage);
      } else {
        showToast(response?.message || 'Failed to assign lead.');
      }
    });
  };

  // 4. Open Create / Edit Lead Modal (POST /api/leads)
  const openCreateLeadModal = () => {
    setLeadForm(INITIAL_LEAD_FORM);
    setLeadModalOpen(true);
  };

  const openEditLeadModal = (lead) => {
    setLeadForm({
      id: lead.id,
      full_name: lead.fullName || lead.customerName || '',
      phone: lead.phone || '',
      email: lead.email || '',
      loan_type: lead.loanType || 'Personal Loan',
      loan_amount: lead.loanAmount || lead.requestedAmount || 500000,
      monthly_income: lead.monthlyIncome || 65000,
      credit_score: lead.creditScore || 730,
      status: lead.status || 'NEW',
      notes: lead.notes || '',
    });
    setLeadModalOpen(true);
  };

  const formik = useFormik({
    initialValues: leadForm,
    enableReinitialize: true,
    validate: (values) => {
      let errors = {};
      if (!values.full_name || !values.full_name.trim()) {
        errors.full_name = 'Customer full name is required';
      }
      if (!values.phone || !values.phone.trim()) {
        errors.phone = 'Phone number is required';
      }
      if (!values.loan_amount || Number(values.loan_amount) <= 0) {
        errors.loan_amount = 'Please enter a valid loan amount';
      }
      if (values.credit_score && (Number(values.credit_score) < 300 || Number(values.credit_score) > 900)) {
        errors.credit_score = 'Credit score must be between 300 and 900';
      }
      return errors;
    },
    onSubmit: (values) => {
      setIsSavingLead(true);
      createLead(values)((response) => {
        setIsSavingLead(false);
        if (response && (response.success || response.status === 200 || response.status === 201)) {
          showToast(
            response.message ||
              (values.id ? 'Lead updated successfully.' : 'Lead created successfully.')
          );
          setLeadModalOpen(false);
          fetchLeadsFromApi(currentPage);
        } else {
          showToast(response?.message || 'Failed to save lead.');
        }
      });
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold mb-1">Lead Pool Distribution &amp; Management</h3>
        
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            onClick={() => fetchLeadsFromApi(currentPage, true)}
            title="Refresh Leads"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
                style={{ width: 15, height: 15, borderWidth: 2 }}
              />
            ) : (
              <LuRotateCcw size={15} />
            )}
          </button>

          <button
            type="button"
            className="btn btn-outline-primary fw-semibold d-inline-flex align-items-center gap-2"
            onClick={openCreateLeadModal}
          >
            <LuPlus size={17} />
            Create Lead
          </button>

          <button
            type="button"
            className="btn btn-outline-primary fw-semibold d-inline-flex align-items-center gap-2"
            onClick={() => setCsvModalOpen(true)}
          >
            <LuCloudUpload size={17} />
            Bulk CSV Lead Upload
          </button>

          <button
            type="button"
            className="btn btn-cta fw-semibold d-inline-flex align-items-center gap-2 shadow-cta"
            onClick={handleRoundRobinDistribute}
            disabled={isDistributing || unassignedCount === 0}
            title={
              unassignedCount === 0
                ? 'No unassigned leads available in the pool.'
                : 'Distribute new leads across active staff'
            }
          >
            <span>{isDistributing ? 'Distributing...' : 'Round-Robin Distribute'}</span>
            <LuSend size={15} />
          </button>
        </div>
      </div>

      {/* Filters & Lead Pool Table */}
      <div className="crm-panel">
        <div className="panel-header d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="input-group input-group-sm" style={{ width: '260px' }}>
              <span className="input-group-text bg-white">
                <LuSearch size={15} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search name, phone, email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="btn-group btn-group-sm">
              {[
                { key: 'ALL', label: `All (${pagination.total})` },
                { key: 'NEW', label: 'NEW' },
                { key: 'INTERESTED', label: 'INTERESTED' },
                { key: 'CALLBACK_SCHEDULED', label: 'CALLBACK' },
                { key: 'NOT_INTERESTED', label: 'NOT INTERESTED' },
                { key: 'DISBURSED', label: 'DISBURSED' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setFilterStatus(tab.key);
                    setCurrentPage(1);
                  }}
                  className={`btn ${
                    filterStatus === tab.key ? 'btn-primary fw-semibold' : 'btn-outline-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <LuFilter size={15} className="text-muted" />
            <select
              className="form-select form-select-sm"
              style={{ width: '190px' }}
              value={filterLoanType}
              onChange={(e) => {
                setFilterLoanType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Loan Categories</option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Business Loan">Business Loan</option>
              <option value="Home Loan">Home Loan</option>
              <option value="Loan Against Property">Loan Against Property</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="crm-table-wrapper" style={{ minHeight: '260px' }}>
          {isLoading || isRefreshing ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <div
                className="spinner-border mb-2"
                role="status"
                style={{ width: '2rem', height: '2rem', color: '#153298' }}
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <span className="text-xs text-muted fw-semibold">Loading leads...</span>
            </div>
          ) : leadsList.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-2">No leads found matching current filter criteria.</p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setFilterStatus('ALL');
                    setFilterLoanType('ALL');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={openCreateLeadModal}
                >
                  + Create Lead
                </button>
              </div>
            </div>
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer Profile</th>
                  <th>Loan Type &amp; Amount</th>
                  <th>Income &amp; CIBIL</th>
                  <th>Calls &amp; Docs</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leadsList.map((lead) => (
                  <tr key={lead.id}>
                    <td className="font-mono fw-bold text-xs text-primary">#{lead.id}</td>
                    <td>
                      <div className="fw-bold">{lead.fullName}</div>
                      <div className="text-xs text-muted">{lead.phone}</div>
                      {lead.email && (
                        <div className="text-xs text-secondary" style={{ fontSize: '0.72rem' }}>
                          {lead.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="fw-bold">{formatINR(lead.loanAmount)}</div>
                      <span className="badge bg-light text-dark border">{lead.loanType}</span>
                    </td>
                    <td>
                      <div className="text-xs fw-semibold">
                        Income: {formatINR(lead.monthlyIncome)}/mo
                      </div>
                      <div className="text-xs">
                        CIBIL:{' '}
                        <span
                          className={`fw-bold ${
                            lead.creditScore >= 750
                              ? 'text-success'
                              : lead.creditScore >= 700
                              ? 'text-primary'
                              : 'text-warning-emphasis'
                          }`}
                        >
                          {lead.creditScore || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="text-xs">
                        Calls: <strong>{lead.totalCalls}</strong> • Docs:{' '}
                        <strong>{lead.totalDocuments}</strong>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={lead.status} type="call" />
                    </td>
                    <td style={{ minWidth: '220px' }}>
                      <select
                        disabled
                        className="form-select form-select-sm bg-light text-secondary"
                        value={lead.assignedTo || ''}
                        title="Assigned staff (read-only)"
                      >
                        <option value="">
                          {lead.assignedStaffName
                            ? `Assigned: ${lead.assignedStaffName}`
                            : '-- Unassigned --'}
                        </option>
                        {staff.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            #{emp.id}: {emp.name} ({emp.callTargetDisplay})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1"
                        onClick={() => openEditLeadModal(lead)}
                        title="Edit Lead"
                      >
                        <LuPencil size={13} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="panel-footer d-flex flex-wrap align-items-center justify-content-between p-3 border-top gap-2 bg-light bg-opacity-50">
          <div className="text-xs text-muted">
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>{' '}
            (<strong>{pagination.total}</strong> total leads)
          </div>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <LuChevronLeft size={15} />
              <span>Previous</span>
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`btn btn-sm px-3 ${
                    pagination.page === pageNum ? 'btn-primary fw-bold' : 'btn-outline-secondary'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <span>Next</span>
              <LuChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Lead Modal (POST /api/leads) */}
      {leadModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setLeadModalOpen(false)}>
          <div className="crm-modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h5 className="mb-0 fw-bold">
                  {leadForm.id ? `Edit Lead #${leadForm.id}` : 'Create New Lead'}
                </h5>
                
              </div>
              <button
                type="button"
                className="btn btn-sm btn-light rounded-circle p-2"
                onClick={() => setLeadModalOpen(false)}
              >
                <LuX size={16} />
              </button>
            </div>

            <form onSubmit={formik.handleSubmit}>
              <div className="crm-modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-sm fw-bold">
                      Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      className={`form-control ${formik.touched.full_name && formik.errors.full_name ? 'is-invalid' : ''}`}
                      value={formik.values.full_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., Vikram Sethi"
                    />
                    {formik.touched.full_name && formik.errors.full_name && (
                      <div className="text-danger text-xs mt-1">{formik.errors.full_name}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-sm fw-bold">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      className={`form-control ${formik.touched.phone && formik.errors.phone ? 'is-invalid' : ''}`}
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., +919822334455"
                    />
                    {formik.touched.phone && formik.errors.phone && (
                      <div className="text-danger text-xs mt-1">{formik.errors.phone}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-sm fw-bold">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., vikram.sethi@gmail.com"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-sm fw-bold">
                      Loan Type
                    </label>
                    <select
                      name="loan_type"
                      className="form-select"
                      value={formik.values.loan_type}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="Personal Loan">Personal Loan</option>
                      <option value="Business Loan">Business Loan</option>
                      <option value="Home Loan">Home Loan</option>
                      <option value="Loan Against Property">Loan Against Property</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-sm fw-bold">
                      Loan Amount <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="loan_amount"
                      className={`form-control ${formik.touched.loan_amount && formik.errors.loan_amount ? 'is-invalid' : ''}`}
                      value={formik.values.loan_amount}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.loan_amount && formik.errors.loan_amount && (
                      <div className="text-danger text-xs mt-1">{formik.errors.loan_amount}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-sm fw-bold">
                      Monthly Income
                    </label>
                    <input
                      type="number"
                      name="monthly_income"
                      className="form-control"
                      value={formik.values.monthly_income}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-sm fw-bold">
                      Credit Score
                    </label>
                    <input
                      type="number"
                      name="credit_score"
                      className={`form-control ${formik.touched.credit_score && formik.errors.credit_score ? 'is-invalid' : ''}`}
                      value={formik.values.credit_score}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.credit_score && formik.errors.credit_score && (
                      <div className="text-danger text-xs mt-1">{formik.errors.credit_score}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-sm fw-bold">
                      Lead Status
                    </label>
                    <select
                      name="status"
                      className="form-select"
                      value={formik.values.status}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      <option value="NEW">NEW</option>
                      <option value="INTERESTED">INTERESTED</option>
                      <option value="CALLBACK_SCHEDULED">CALLBACK_SCHEDULED</option>
                      <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                      <option value="DISBURSED">DISBURSED</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label text-sm fw-bold">
                      Notes
                    </label>
                    <textarea
                      rows="2"
                      name="notes"
                      className="form-control"
                      value={formik.values.notes}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., Walk-in inquiry"
                    />
                  </div>
                </div>
              </div>
              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary fw-semibold px-4"
                  onClick={() => setLeadModalOpen(false)}
                  disabled={isSavingLead}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-cta fw-semibold px-4 shadow-cta"
                  disabled={isSavingLead}
                >
                  {isSavingLead
                    ? 'Saving...'
                    : formik.values.id
                    ? 'Update Lead'
                    : 'Create Lead'}
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

      <CsvUploadModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onSuccess={() => fetchLeadsFromApi(currentPage)}
      />
    </div>
  );
};

export default LeadDistribution;
