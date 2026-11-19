import React, { useState } from 'react';
import {
  LuCloudUpload,
  LuFileSpreadsheet,
  LuUsers,
  LuX,
  LuFileDown,
  LuCheck,
  LuLoader,
  LuCircleAlert,
} from 'react-icons/lu';
import { bulkUploadLeads } from '../../context/Leads/index';

const CsvUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [autoDistribute, setAutoDistribute] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Download CSV Template with standard backend headers
  const handleDownloadSampleCsv = () => {
    const headers = [
      'full_name',
      'phone',
      'email',
      'loan_type',
      'loan_amount',
      'monthly_income',
      'credit_score',
      'notes',
    ];

    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leads_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  // POST /api/leads/bulk-upload
  const handleImport = () => {
    if (!selectedFile) {
      setErrorMsg('Please select a CSV or Excel (.xlsx/.xls) file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('auto_distribute', autoDistribute ? 'true' : 'false');

    bulkUploadLeads(formData)((response) => {
      setIsUploading(false);

      if (response && (response.success || response.status === 201 || response.status === 200)) {
        setSuccessMsg(
          response.message ||
            `Successfully imported ${response.data?.totalImported || ''} leads!`
        );
        setSelectedFile(null);
        if (onSuccess) onSuccess(response);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMsg(response?.message || 'Failed to upload leads file. Please verify the file format.');
      }
    });
  };

  return (
    <div className="crm-modal-backdrop" onClick={onClose}>
      <div className="crm-modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="crm-modal-header">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
              <LuFileSpreadsheet size={20} />
            </div>
            <div>
              <h5 className="mb-0 fw-bold">Bulk CSV / Excel Lead Upload</h5>
             
            </div>
          </div>
          <button type="button" className="btn btn-sm btn-light rounded-circle p-2" onClick={onClose}>
            <LuX size={16} />
          </button>
        </div>

        <div className="crm-modal-body">
          {errorMsg && (
            <div className="alert alert-danger py-2 px-3 text-xs fw-semibold d-flex align-items-center gap-2 mb-3">
              <LuCircleAlert size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success py-2 px-3 text-xs fw-semibold d-flex align-items-center gap-2 mb-3">
              <LuCheck size={16} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Top Banner: Download CSV Template Button */}
          <div className="d-flex flex-wrap align-items-center justify-content-between p-3 rounded-3 bg-light border mb-4">
            <div className="d-flex align-items-center gap-2">
              <LuFileSpreadsheet size={20} className="text-primary flex-shrink-0" />
              <div>
                <div className="fw-bold text-sm">Need a starter template?</div>
                <div className="text-xs text-muted">
                  Download the CSV header template (<code>full_name, phone, email, loan_type, loan_amount, monthly_income, credit_score, notes</code>)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className={`btn btn-sm fw-bold d-inline-flex align-items-center gap-2 mt-2 mt-sm-0 ${
                downloadSuccess ? 'btn-success text-white' : 'btn-outline-primary'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <LuCheck size={16} />
                  <span>Template Downloaded!</span>
                </>
              ) : (
                <>
                  <LuFileDown size={16} />
                  <span>Download CSV Template</span>
                </>
              )}
            </button>
          </div>

          {/* Dropzone Area */}
          <div className="p-4 rounded-4 border border-2 border-dashed text-center bg-light mb-4">
            <LuCloudUpload size={38} className="text-primary mb-2" />
            <h6 className="fw-bold mb-1">
              {selectedFile ? selectedFile.name : 'No file selected'}
            </h6>
            <p className="text-xs text-muted mb-3">
              Supported formats: <code>.csv, .xlsx, .xls</code>
            </p>
            <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
              <label className="btn btn-sm btn-outline-primary fw-semibold mb-0 cursor-pointer">
                Choose CSV / Excel File
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="d-none"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {/* Distribution Mode Toggle */}
          <div className="p-3 rounded-3 border bg-white mb-2 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <LuUsers size={22} className="text-primary" />
              <div>
                <div className="fw-bold text-sm">
                  Auto-Distribute Leads on Import
                </div>
                <div className="text-xs text-muted">
                  Automatically distribute imported leads across active staff members in round-robin fashion
                </div>
              </div>
            </div>
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input cursor-pointer"
                type="checkbox"
                role="switch"
                style={{ width: '2.5rem', height: '1.3rem' }}
                checked={autoDistribute}
                onChange={(e) => setAutoDistribute(e.target.checked)}
              />
            </div>
          </div>
        </div>

        <div className="crm-modal-footer">
          <button type="button" className="btn btn-outline-secondary fw-semibold px-4" onClick={onClose} disabled={isUploading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-cta fw-bold px-4 d-inline-flex align-items-center gap-2 shadow-cta"
            onClick={handleImport}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? (
              <>
                <LuLoader size={16} className="spinner-border spinner-border-sm" />
                <span>Uploading and importing leads...</span>
              </>
            ) : (
              <>
                <LuCloudUpload size={17} />
                <span>
                  Upload Leads {autoDistribute ? '& Auto-Distribute' : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CsvUploadModal;
