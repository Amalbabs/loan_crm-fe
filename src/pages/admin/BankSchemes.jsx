import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import {
  Building2,
  PlusCircle,
  Edit3,
  Trash2,
  Search,
  RefreshCw,
  X,
} from 'lucide-react';
import { LuCircleCheck } from 'react-icons/lu';
import {
  getBankSchemes,
  createBankScheme,
  updateBankScheme,
  deleteBankScheme,
} from '../../context/Admin/index';
import { normalizeBankScheme, formatCompactINR } from '../../utils/normalizers';

const INITIAL_SCHEME_FORM = {
  id: null,
  bank_name: '',
  scheme_name: '',
  loan_type: 'Personal Loan',
  roi: 10.49,
  processing_fee: 1.0,
  min_credit_score: 720,
  min_tenure_months: 12,
  max_tenure_months: 60,
  max_amount: 4000000,
};

const BankSchemes = () => {
  const [banks, setBanks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState(INITIAL_SCHEME_FORM);
  const [bankNameFilter, setBankNameFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (title) => {
    setToastMessage(title);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadSchemes = (bankFilter = bankNameFilter, isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    const query = bankFilter.trim() ? { bank_name: bankFilter.trim() } : {};
    getBankSchemes(query)((res) => {
      setIsLoading(false);
      setIsRefreshing(false);
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.schemes)
        ? res.data.schemes
        : [];
      if (res && res.success) {
        setBanks(list.map(normalizeBankScheme));
      }
    });
  };

  useEffect(() => {
    loadSchemes('', false);
  }, []);

  const openCreateModal = () => {
    setFormState(INITIAL_SCHEME_FORM);
    setModalOpen(true);
  };

  const openEditModal = (scheme) => {
    setFormState({
      id: scheme.id,
      bank_name: scheme.bankName || '',
      scheme_name: scheme.schemeName || '',
      loan_type: scheme.loanType || scheme.loanCategory || 'Personal Loan',
      roi: scheme.rawRoi || parseFloat(scheme.roi) || 10.49,
      processing_fee: scheme.rawProcessingFee || parseFloat(scheme.processingFee) || 1.0,
      min_credit_score: scheme.minCreditScore || 720,
      min_tenure_months: scheme.minTenureMonths || 12,
      max_tenure_months: scheme.maxTenureMonths || 60,
      max_amount: scheme.maxAmount || scheme.maxLoanAmount || 4000000,
    });
    setModalOpen(true);
  };

  const formik = useFormik({
    initialValues: formState,
    enableReinitialize: true,
    validate: (values) => {
      let errors = {};
      if (!values.bank_name || !values.bank_name.trim()) {
        errors.bank_name = 'Bank name is required';
      }
      if (!values.scheme_name || !values.scheme_name.trim()) {
        errors.scheme_name = 'Scheme title is required';
      }
      if (!values.roi || Number(values.roi) <= 0) {
        errors.roi = 'ROI must be greater than 0';
      }
      if (values.processing_fee === '' || Number(values.processing_fee) < 0) {
        errors.processing_fee = 'Processing fee cannot be negative';
      }
      if (!values.min_credit_score || Number(values.min_credit_score) < 300) {
        errors.min_credit_score = 'Min CIBIL must be at least 300';
      }
      if (!values.min_tenure_months || Number(values.min_tenure_months) < 1) {
        errors.min_tenure_months = 'Min tenure must be at least 1 month';
      }
      if (!values.max_tenure_months || Number(values.max_tenure_months) < Number(values.min_tenure_months)) {
        errors.max_tenure_months = 'Max tenure must be >= min tenure';
      }
      if (!values.max_amount || Number(values.max_amount) <= 0) {
        errors.max_amount = 'Max loan amount must be greater than 0';
      }
      return errors;
    },
    onSubmit: (values) => {
      setIsSaving(true);
      const apiAction = values.id ? updateBankScheme : createBankScheme;
      apiAction({
        ...(values.id ? { id: values.id } : {}),
        bank_name: values.bank_name,
        scheme_name: values.scheme_name,
        loan_type: values.loan_type,
        roi: Number(values.roi),
        processing_fee: Number(values.processing_fee),
        min_credit_score: Number(values.min_credit_score),
        min_tenure_months: Number(values.min_tenure_months),
        max_tenure_months: Number(values.max_tenure_months),
        max_amount: Number(values.max_amount),
      })((response) => {
        setIsSaving(false);
        if (response && (response.success || response.status === 200 || response.status === 201)) {
          showToast(response.message || `Bank scheme "${values.scheme_name}" saved!`);
          setModalOpen(false);
          loadSchemes(bankNameFilter);
        } else {
          showToast(response?.message || 'Failed to save bank scheme.');
        }
      });
    },
  });

  const handleDelete = (scheme) => {
    deleteBankScheme(scheme.id)((response) => {
      if (response && (response.success || response.status === 200)) {
        showToast(response.message || 'Partner bank scheme deleted.');
        loadSchemes(bankNameFilter);
      } else {
        showToast(response?.message || 'Failed to delete bank scheme.');
      }
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold mb-1">Partner Bank Scheme Controller</h3>
          
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <div className="input-group input-group-sm" style={{ width: '240px' }}>
            <span className="input-group-text bg-white">
              <Search size={14} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by bank_name (e.g. HDFC)..."
              value={bankNameFilter}
              onChange={(e) => setBankNameFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadSchemes(bankNameFilter);
              }}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => loadSchemes(bankNameFilter)}
            >
              Filter
            </button>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            onClick={() => {
              setBankNameFilter('');
              loadSchemes('', true);
            }}
            disabled={isRefreshing}
            title="Refresh Schemes"
          >
            <RefreshCw size={15} className={isRefreshing ? 'spinner-border spinner-border-sm' : ''} />
          </button>

          <button
            type="button"
            className="btn btn-cta fw-semibold d-inline-flex align-items-center gap-2 shadow-cta"
            onClick={openCreateModal}
          >
            <PlusCircle size={17} />
            Add Partner Bank Scheme
          </button>
        </div>
      </div>

      {/* Bank Scheme Cards Grid */}
      {isLoading || isRefreshing ? (
        <div className="crm-panel text-center py-5">
          <div
            className="spinner-border mb-2"
            role="status"
            style={{ width: '2rem', height: '2rem', color: '#153298' }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-xs text-muted fw-semibold">Loading bank schemes...</div>
        </div>
      ) : banks.length === 0 ? (
        <div className="crm-panel text-center py-5">
          <Building2 size={40} className="text-muted mb-2" />
          <h5 className="fw-bold">No Partner Bank Schemes Configured</h5>
     
          <button
            type="button"
            className="btn btn-primary fw-semibold d-inline-flex align-items-center gap-2"
            onClick={openCreateModal}
          >
            <PlusCircle size={16} />
            Add Partner Bank Scheme
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {banks.map((bank) => (
            <div key={bank.id} className="col-md-6 col-xl-4">
              <div
                className={`crm-panel h-100 d-flex flex-column justify-content-between ${
                  !bank.isActive ? 'opacity-75' : ''
                }`}
              >
                <div>
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                        <Building2 size={22} />
                      </div>
                      <div>
                        <span className="text-xs font-mono fw-bold text-muted">ID #{bank.id}</span>
                        <h5 className="fw-extrabold mb-0">{bank.bankName}</h5>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        bank.isActive
                          ? 'bg-success-subtle text-success'
                          : 'bg-secondary-subtle text-secondary'
                      }`}
                    >
                      {bank.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="fw-bold text-primary mb-1">{bank.schemeName}</div>
                    <span className="badge bg-light text-dark border me-2">{bank.loanType}</span>
                    <span className="badge bg-info-subtle text-info-emphasis">
                      Min CIBIL: {bank.minCreditScore}+
                    </span>
                  </div>

                  <div className="row g-2 p-2 rounded-3 bg-light border mb-3 text-center">
                    <div className="col-4 border-end">
                      <div className="text-xs text-muted">ROI</div>
                      <div className="fw-bold text-xs text-dark">{bank.roi}% p.a.</div>
                    </div>
                    <div className="col-4 border-end">
                      <div className="text-xs text-muted">Max Amount</div>
                      <div className="fw-bold text-xs text-dark">
                        {formatCompactINR(bank.maxAmount)}
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-xs text-muted">Proc. Fee</div>
                      <div className="fw-bold text-xs text-success">{bank.processingFee}</div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between text-xs text-muted mb-2">
                    <span>
                      Min Tenure: <strong>{bank.minTenureMonths} Months</strong>
                    </span>
                    <span>
                      Max Tenure: <strong>{bank.maxTenureMonths} Months</strong>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                  <span className="text-xs text-muted">
                    Scheme ID: <strong>#{bank.id}</strong>
                  </span>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary fw-semibold d-inline-flex align-items-center gap-1"
                      onClick={() => openEditModal(bank)}
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger fw-semibold d-inline-flex align-items-center gap-1"
                      onClick={() => handleDelete(bank)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Bank Scheme Modal */}
      {modalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="crm-modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h5 className="mb-0 fw-bold">
                  {formState.id
                    ? `Edit Scheme #${formState.id} — ${formState.bank_name}`
                    : 'Add Partner Bank Scheme'}
                </h5>
                <span className="text-xs text-muted">
                  Configure partner underwriting criteria and loan parameters
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-light rounded-circle p-2"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={formik.handleSubmit}>
              <div className="crm-modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-sm fw-bold">
                      Partner Bank Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      className={`form-control ${formik.touched.bank_name && formik.errors.bank_name ? 'is-invalid' : ''}`}
                      value={formik.values.bank_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., HDFC"
                    />
                    {formik.touched.bank_name && formik.errors.bank_name && (
                      <div className="text-danger text-xs mt-1">{formik.errors.bank_name}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-sm fw-bold">
                      Scheme Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="scheme_name"
                      className={`form-control ${formik.touched.scheme_name && formik.errors.scheme_name ? 'is-invalid' : ''}`}
                      value={formik.values.scheme_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., HDFC Salaried Personal Loan"
                    />
                    {formik.touched.scheme_name && formik.errors.scheme_name && (
                      <div className="text-danger text-xs mt-1">{formik.errors.scheme_name}</div>
                    )}
                  </div>
                  <div className="col-md-4">
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
                      Annual Interest Rate (ROI %) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="roi"
                      className={`form-control ${formik.touched.roi && formik.errors.roi ? 'is-invalid' : ''}`}
                      value={formik.values.roi}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.roi && formik.errors.roi && (
                      <div className="text-danger text-xs mt-1">{formik.errors.roi}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-sm fw-bold">
                      Processing Fee (%) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="processing_fee"
                      className={`form-control ${formik.touched.processing_fee && formik.errors.processing_fee ? 'is-invalid' : ''}`}
                      value={formik.values.processing_fee}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.processing_fee && formik.errors.processing_fee && (
                      <div className="text-danger text-xs mt-1">{formik.errors.processing_fee}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-sm fw-bold">
                      Min CIBIL Score <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="min_credit_score"
                      className={`form-control ${formik.touched.min_credit_score && formik.errors.min_credit_score ? 'is-invalid' : ''}`}
                      value={formik.values.min_credit_score}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.min_credit_score && formik.errors.min_credit_score && (
                      <div className="text-danger text-xs mt-1">{formik.errors.min_credit_score}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-sm fw-bold">
                      Min Tenure (Months) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="min_tenure_months"
                      className={`form-control ${formik.touched.min_tenure_months && formik.errors.min_tenure_months ? 'is-invalid' : ''}`}
                      value={formik.values.min_tenure_months}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.min_tenure_months && formik.errors.min_tenure_months && (
                      <div className="text-danger text-xs mt-1">{formik.errors.min_tenure_months}</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-sm fw-bold">
                      Max Tenure (Months) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="max_tenure_months"
                      className={`form-control ${formik.touched.max_tenure_months && formik.errors.max_tenure_months ? 'is-invalid' : ''}`}
                      value={formik.values.max_tenure_months}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.max_tenure_months && formik.errors.max_tenure_months && (
                      <div className="text-danger text-xs mt-1">{formik.errors.max_tenure_months}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-sm fw-bold">
                      Max Loan Amount (₹) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="max_amount"
                      className={`form-control ${formik.touched.max_amount && formik.errors.max_amount ? 'is-invalid' : ''}`}
                      value={formik.values.max_amount}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.max_amount && formik.errors.max_amount && (
                      <div className="text-danger text-xs mt-1">{formik.errors.max_amount}</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary fw-semibold px-4"
                  onClick={() => setModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-cta fw-semibold px-4 shadow-cta"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Partner Bank Scheme'}
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

export default BankSchemes;
