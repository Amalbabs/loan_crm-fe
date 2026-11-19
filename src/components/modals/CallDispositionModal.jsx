import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import {
  PhoneCall,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  X,
  Sparkles,
} from 'lucide-react';
import { logCallOutcome } from '../../context/Staff/index';
import { formatINR, getCurrentUser } from '../../utils/normalizers';

const CallDispositionModal = ({
  lead,
  isOpen,
  onClose,
  onSuccess,
  banks = [],
  initialDisposition = 'INTERESTED',
  initialDurationSeconds = 60,
  agentName = null,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentUser = getCurrentUser();
  const displayName = agentName || currentUser?.name || 'Staff Member';

  const formik = useFormik({
    initialValues: {
      disposition: 'INTERESTED',
      callDurationSeconds: initialDurationSeconds > 0 ? initialDurationSeconds : 60,
      callbackDate: '',
      rejectionReason: '',
      remarks: lead?.notes || '',
    },
    enableReinitialize: true,
    validate: (values) => {
      let errors = {};
      if (!values.disposition) {
        errors.disposition = 'Please select a call disposition';
      }
      if (values.disposition === 'CALLBACK_SCHEDULED' && !values.callbackDate) {
        errors.callbackDate = 'Please select a callback date & time';
      }
      if (values.disposition === 'NOT_INTERESTED' && !values.rejectionReason?.trim()) {
        errors.rejectionReason = 'Please enter a rejection reason';
      }
      if (!values.callDurationSeconds || Number(values.callDurationSeconds) <= 0) {
        errors.callDurationSeconds = 'Call duration must be at least 1 second';
      }
      if (!values.remarks || !values.remarks.trim()) {
        errors.remarks = 'Call remarks are required';
      }
      return errors;
    },
    onSubmit: (values) => {
      setIsSubmitting(true);
      setErrorMsg('');

      let isoCallbackDate = null;
      if (values.disposition === 'CALLBACK_SCHEDULED' && values.callbackDate) {
        const parsed = new Date(values.callbackDate);
        isoCallbackDate = !Number.isNaN(parsed.getTime())
          ? parsed.toISOString()
          : new Date().toISOString();
      }

      logCallOutcome({
        lead_id: lead.id,
        call_disposition: values.disposition,
        call_duration_seconds: Number(values.callDurationSeconds) || 60,
        callback_date: isoCallbackDate,
        rejection_reason: values.disposition === 'NOT_INTERESTED' ? values.rejectionReason : undefined,
        remarks: values.remarks,
      })((response) => {
        setIsSubmitting(false);
        if (response && (response.success || response.status === 201 || response.status === 200)) {
          if (onSuccess) onSuccess(response);
          onClose();
        } else {
          setErrorMsg(response?.message || 'Failed to log call outcome.');
        }
      });
    },
  });

  useEffect(() => {
    if (isOpen && lead) {
      setErrorMsg('');
      const normalized = (initialDisposition || lead.status || 'INTERESTED').toUpperCase();
      let initDisp = 'INTERESTED';
      if (normalized.includes('CALLBACK')) {
        initDisp = 'CALLBACK_SCHEDULED';
      } else if (normalized.includes('NOT')) {
        initDisp = 'NOT_INTERESTED';
      }

      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tomorrow.setHours(14, 30, 0, 0);
      const localIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      const initCallback = lead.followUpDate
        ? new Date(lead.followUpDate).toISOString().slice(0, 16)
        : localIso;

      formik.setValues({
        disposition: initDisp,
        callDurationSeconds: initialDurationSeconds > 0 ? initialDurationSeconds : 60,
        callbackDate: initCallback,
        rejectionReason: '',
        remarks: lead.notes || '',
      });
    }
  }, [isOpen, lead, initialDisposition, initialDurationSeconds]);

  if (!isOpen || !lead) return null;

  return (
    <div className="crm-modal-backdrop" onClick={onClose}>
      <div className="crm-modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="crm-modal-header">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
              <PhoneCall size={20} />
            </div>
            <div>
              <h5 className="mb-0 fw-bold">
                Log Call Disposition — {lead.fullName || lead.customerName}
              </h5>
              <span className="text-xs text-muted">
                Lead ID: #{lead.id} • {lead.phone} • Requested:{' '}
                {formatINR(lead.loanAmount || lead.requestedAmount)} ({lead.loanType})
              </span>
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-light rounded-circle p-2" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={formik.handleSubmit} className="d-flex flex-column flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
          <div className="crm-modal-body">
            {errorMsg && (
              <div className="alert alert-danger py-2 px-3 text-xs fw-semibold mb-3">
                {errorMsg}
              </div>
            )}

            {/* Quota Increment Banner */}
            <div className="alert alert-primary d-flex align-items-center justify-content-between py-2 px-3 mb-4 border-0">
              <div className="d-flex align-items-center gap-2 text-sm fw-semibold">
                <Sparkles size={16} />
                <span>
                  Logging this call increments <strong>{displayName}</strong>&apos;s daily quota toward the 100-call target.
                </span>
              </div>
              <span className="badge bg-primary">+1 Quota Credit</span>
            </div>

            {/* 1. Disposition Selector */}
            <label className="form-label fw-bold text-sm mb-2">
              1. Select Call Outcome / Disposition
            </label>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div
                  onClick={() => formik.setFieldValue('disposition', 'INTERESTED')}
                  className={`p-3 rounded-3 border cursor-pointer h-100 transition-all ${
                    formik.values.disposition === 'INTERESTED'
                      ? 'border-success bg-success bg-opacity-10 shadow-sm'
                      : 'border-light-subtle bg-light'
                  }`}
                >
                  <div className="d-flex align-items-center gap-2 fw-bold text-success mb-1">
                    <CheckCircle2 size={18} />
                    INTERESTED
                  </div>
                  <p className="text-xs text-secondary mb-0">
                    Customer is interested in loan offer and ready to share KYC documents.
                  </p>
                </div>
              </div>

              <div className="col-md-4">
                <div
                  onClick={() => formik.setFieldValue('disposition', 'CALLBACK_SCHEDULED')}
                  className={`p-3 rounded-3 border cursor-pointer h-100 transition-all ${
                    formik.values.disposition === 'CALLBACK_SCHEDULED'
                      ? 'border-warning bg-warning bg-opacity-10 shadow-sm'
                      : 'border-light-subtle bg-light'
                  }`}
                >
                  <div className="d-flex align-items-center gap-2 fw-bold text-warning-emphasis mb-1">
                    <Clock size={18} />
                    CALLBACK_SCHEDULED
                  </div>
                  <p className="text-xs text-secondary mb-0">
                    Customer requested a follow-up call at a scheduled date &amp; time.
                  </p>
                </div>
              </div>

              <div className="col-md-4">
                <div
                  onClick={() => formik.setFieldValue('disposition', 'NOT_INTERESTED')}
                  className={`p-3 rounded-3 border cursor-pointer h-100 transition-all ${
                    formik.values.disposition === 'NOT_INTERESTED'
                      ? 'border-danger bg-danger bg-opacity-10 shadow-sm'
                      : 'border-light-subtle bg-light'
                  }`}
                >
                  <div className="d-flex align-items-center gap-2 fw-bold text-danger mb-1">
                    <XCircle size={18} />
                    NOT_INTERESTED
                  </div>
                  <p className="text-xs text-secondary mb-0">
                    Customer declined the offer. Captures rejection reason &amp; remarks.
                  </p>
                </div>
              </div>
            </div>

            {/* Conditional Field: Callback Scheduled */}
            {formik.values.disposition === 'CALLBACK_SCHEDULED' && (
              <div className="mb-4 p-3 rounded-3 bg-warning bg-opacity-10 border border-warning-subtle">
                <label className="form-label fw-bold text-sm">
                  Callback Date &amp; Time <span className="text-danger">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="callbackDate"
                  className={`form-control ${formik.touched.callbackDate && formik.errors.callbackDate ? 'is-invalid' : ''}`}
                  value={formik.values.callbackDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.callbackDate && formik.errors.callbackDate && (
                  <div className="text-danger text-xs mt-1">{formik.errors.callbackDate}</div>
                )}
              </div>
            )}

            {/* Conditional Field: Not Interested Rejection Reason */}
            {formik.values.disposition === 'NOT_INTERESTED' && (
              <div className="mb-4 p-3 rounded-3 bg-danger bg-opacity-10 border border-danger-subtle">
                <label className="form-label fw-bold text-sm">
                  Rejection Reason <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="rejectionReason"
                  className={`form-control ${formik.touched.rejectionReason && formik.errors.rejectionReason ? 'is-invalid' : ''}`}
                  value={formik.values.rejectionReason}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g., Interest rate higher than expectation"
                />
                {formik.touched.rejectionReason && formik.errors.rejectionReason && (
                  <div className="text-danger text-xs mt-1">{formik.errors.rejectionReason}</div>
                )}
              </div>
            )}

            {/* Call Duration & Partner Bank Reference */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-bold text-sm">
                  2. Call Duration in Seconds <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  name="callDurationSeconds"
                  min="1"
                  className={`form-control ${formik.touched.callDurationSeconds && formik.errors.callDurationSeconds ? 'is-invalid' : ''}`}
                  value={formik.values.callDurationSeconds}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.callDurationSeconds && formik.errors.callDurationSeconds && (
                  <div className="text-danger text-xs mt-1">{formik.errors.callDurationSeconds}</div>
                )}
              </div>

              {banks.length > 0 && (
                <div className="col-md-6">
                  <label className="form-label fw-bold text-sm d-flex align-items-center gap-2">
                    <Building2 size={15} className="text-primary" />
                    Reference Partner Bank Scheme
                  </label>
                  <select className="form-select">
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.bankName} — {bank.schemeName} ({bank.interestRate})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Call Remarks */}
            <div>
              <label className="form-label fw-bold text-sm">
                3. Call Remarks <span className="text-danger">*</span>
              </label>
              <textarea
                rows="3"
                name="remarks"
                className={`form-control ${formik.touched.remarks && formik.errors.remarks ? 'is-invalid' : ''}`}
                value={formik.values.remarks}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Enter customer discussion summary, document readiness, or callback notes..."
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
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-cta fw-semibold px-4 shadow-cta"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging Call...' : 'Save Disposition & Increment Call Quota (+1)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CallDispositionModal;
