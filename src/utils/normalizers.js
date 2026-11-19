// ============================================================================
// Normalization helpers for LoanCore CRM API models
// Used across pages to ensure consistent rendering
// ============================================================================

export const normalizeStaffMember = (emp) => {
  const id = emp.staffId ?? emp.id;
  const dailyTarget = Number(emp.dailyTarget ?? emp.daily_call_target ?? emp.dailyCallTarget ?? 100);
  const callsCompleted = Number(emp.callsCompletedToday ?? emp.callsCompleted ?? 0);
  const interestedCount = Number(emp.interestedCallsToday ?? emp.interestedCount ?? 0);
  const convertedLeadsCount = Number(emp.convertedLeadsCount ?? emp.docsCollected ?? 0);
  const totalAssignedLeads = Number(emp.totalAssignedLeads ?? 0);
  const progressPct =
    emp.progressPercentage ||
    `${dailyTarget > 0 ? Math.min(100, Math.round((callsCompleted / dailyTarget) * 100)) : 0}%`;

  return {
    id,
    staffId: id,
    name: emp.name || 'Staff Member',
    email: emp.email || '',
    phone: emp.phone || '',
    role: emp.role || 'STAFF',
    team: emp.team || 'Call Centre',
    isActive: emp.isActive !== undefined ? emp.isActive : true,
    dailyTarget,
    callsCompleted,
    callsCompletedToday: callsCompleted,
    callTargetDisplay: emp.callTargetDisplay || `${callsCompleted} / ${dailyTarget}`,
    progressPercentage: progressPct,
    interestedCount,
    interestedCallsToday: interestedCount,
    callbacksCount: Number(emp.callbacksCount ?? emp.callbackScheduled ?? 0),
    convertedLeadsCount,
    docsCollected: convertedLeadsCount,
    totalAssignedLeads,
    performanceStatus: emp.performanceStatus || 'ON_TRACK',
    status: emp.performanceStatus || (emp.isActive !== false ? 'Available' : 'Inactive'),
    avatarText: (emp.name || 'ST')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  };
};

export const normalizeBankScheme = (scheme) => {
  const roiVal = scheme.roi ?? scheme.interestRate ?? '';
  const feeVal = scheme.processingFee ?? scheme.processing_fee ?? '';
  const maxAmt = Number(scheme.maxAmount ?? scheme.max_amount ?? scheme.maxLoanAmount ?? 0);
  const minScore = Number(scheme.minCreditScore ?? scheme.min_credit_score ?? 700);
  const minTenure = Number(scheme.minTenureMonths ?? scheme.min_tenure_months ?? 12);
  const maxTenure = Number(scheme.maxTenureMonths ?? scheme.max_tenure_months ?? 60);
  const isActive = scheme.isActive !== undefined ? Boolean(scheme.isActive) : scheme.active !== false;

  return {
    id: scheme.id,
    bankName: scheme.bankName || scheme.bank_name || '',
    schemeName: scheme.schemeName || scheme.scheme_name || '',
    loanType: scheme.loanType || scheme.loan_type || scheme.loanCategory || 'Personal Loan',
    loanCategory: scheme.loanType || scheme.loan_type || scheme.loanCategory || 'Personal Loan',
    roi: roiVal,
    interestRate:
      typeof roiVal === 'number' || (typeof roiVal === 'string' && !roiVal.includes('%'))
        ? `${roiVal}% p.a.`
        : roiVal,
    processingFee:
      typeof feeVal === 'number' || (typeof feeVal === 'string' && feeVal !== '' && !feeVal.includes('%'))
        ? `${feeVal}%`
        : feeVal || '1.00%',
    rawRoi: parseFloat(roiVal) || 0,
    rawProcessingFee: parseFloat(feeVal) || 0,
    minCreditScore: minScore,
    minTenureMonths: minTenure,
    maxTenureMonths: maxTenure,
    maxAmount: maxAmt,
    maxLoanAmount: maxAmt,
    isActive,
    active: isActive,
    requiredDocs: Array.isArray(scheme.requiredDocs)
      ? scheme.requiredDocs
      : ['PAN', 'AADHAAR', 'BANK_STATEMENT', 'SALARY_SLIP', 'ITR'],
  };
};

export const normalizeLeadItem = (lead) => {
  const rawStatus = (lead.status || lead.callStatus || 'NEW').toUpperCase();
  const loanAmt = Number(lead.loanAmount ?? lead.loan_amount ?? lead.requestedAmount ?? 0);
  const income = Number(lead.monthlyIncome ?? lead.monthly_income ?? 0);
  const score = Number(lead.creditScore ?? lead.credit_score ?? 0);

  const rawDocs = Array.isArray(lead.documents)
    ? lead.documents
    : Array.isArray(lead.customer_documents)
    ? lead.customer_documents
    : Array.isArray(lead.customerDocuments)
    ? lead.customerDocuments
    : Array.isArray(lead.Documents)
    ? lead.Documents
    : [];

  const docs = rawDocs.map((d) => {
    const docType = (d.docType || d.doc_type || d.document_type || d.type || 'OTHER').toUpperCase();
    const verificationStatus = (
      d.verificationStatus ||
      d.verification_status ||
      d.status ||
      'PENDING'
    ).toUpperCase();
    return {
      id: d.id,
      leadId: d.leadId ?? d.lead_id ?? lead.id,
      docType,
      doc_type: docType,
      fileName: d.fileName || d.file_name || d.original_name || d.name || '',
      fileUrl: d.fileUrl || d.file_url || d.document_url || d.docUrl || d.doc_url || '',
      docUrl: d.fileUrl || d.file_url || d.document_url || d.docUrl || d.doc_url || '',
      status: verificationStatus,
      verificationStatus,
      verification_status: verificationStatus,
      verificationRemarks: d.verificationRemarks || d.verification_remarks || d.remarks || '',
      verification_remarks: d.verificationRemarks || d.verification_remarks || d.remarks || '',
      createdAt: d.createdAt || d.created_at || null,
      updatedAt: d.updatedAt || d.updated_at || null,
    };
  });

  const totalDocs = Number(lead.totalDocuments ?? lead.documentsCount ?? docs.length ?? 0);
  const totalCalls = Number(lead.totalCalls ?? lead.totalCallsLogged ?? 0);

  return {
    id: lead.id,
    fullName: lead.fullName || lead.full_name || lead.customerName || '',
    customerName: lead.fullName || lead.full_name || lead.customerName || '',
    phone: lead.phone || '',
    email: lead.email || '',
    city: lead.city || '',
    employmentType: lead.employmentType || lead.employment_type || '',
    companyName: lead.companyName || lead.company_name || '',
    loanType: lead.loanType || lead.loan_type || 'Personal Loan',
    loanAmount: loanAmt,
    requestedAmount: loanAmt,
    monthlyIncome: income,
    creditScore: score,
    status: rawStatus,
    callStatus: rawStatus,
    assignedTo: lead.assignedTo ?? lead.assigned_to ?? null,
    assignedStaffName: lead.assignedStaffName || '',
    followUpDate: lead.followUpDate || lead.callbackDateTime || null,
    callbackDateTime: lead.followUpDate || lead.callbackDateTime || null,
    totalCalls,
    totalCallsLogged: totalCalls,
    totalDocuments: totalDocs,
    documentsCount: totalDocs,
    documents: docs,
    pendingDocuments: Number(lead.pendingDocuments ?? lead.pendingDocs ?? lead.pending_documents ?? 0),
    approvedDocuments: Number(
      lead.approvedDocuments ?? lead.verifiedDocuments ?? lead.approvedDocs ?? lead.approved_documents ?? 0
    ),
    rejectedDocuments: Number(lead.rejectedDocuments ?? lead.rejectedDocs ?? lead.rejected_documents ?? 0),
    docVerificationStatus: (
      lead.documentVerificationStatus ||
      lead.document_verification_status ||
      lead.verificationStatus ||
      lead.verification_status ||
      ''
    ).toUpperCase(),
    notes: lead.notes || lead.remarks || '',
    createdAt: lead.createdAt || null,
    updatedAt: lead.updatedAt || null,
  };
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('loancore_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const logoutUser = () => {
  try {
    localStorage.removeItem('loancore_token');
    localStorage.removeItem('loancore_user');
    localStorage.removeItem('token');
    localStorage.removeItem('is_logged');
    localStorage.removeItem('role');
  } catch (e) {
    console.error('Storage clear error:', e);
  }
};

export const formatINR = (amount) => {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

export const formatCompactINR = (amount) => {
  const num = Number(amount);
  if (!num || Number.isNaN(num)) return '₹0';
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return formatINR(num);
};

