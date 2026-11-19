import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import {
  PhoneOutgoing,
  Users,
  CheckCircle2,
  FileCheck2,
  Award,
  Search,
  UserPlus,
  RefreshCw,
  X,
} from 'lucide-react';
import { LuCircleCheck } from 'react-icons/lu';
import StatusBadge from '../../components/common/StatusBadge';
import MetricCard from '../../components/common/MetricCard';
import { getEmployeesPerformance, getAdminDashboardStats } from '../../context/Admin/index';
import { registerUser } from '../../context/Auth/Index';
import { normalizeStaffMember } from '../../utils/normalizers';

const INITIAL_USER_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'STAFF',
  phone: '',
  daily_call_target: 100,
};

const StaffTargets = () => {
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (title) => {
    setToastMessage(title);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Register Staff / Admin Modal State (POST /api/auth/register)
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [userForm, setUserForm] = useState(INITIAL_USER_FORM);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRefresh = (isManual = false) => {
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

    getAdminDashboardStats()((res) => {
      if (res && res.success && res.data) {
        setDashboardStats(res.data);
      }
      checkDone();
    });

    getEmployeesPerformance()((res) => {
      if (res && res.success && Array.isArray(res.data)) {
        setStaff(res.data.map(normalizeStaffMember));
      }
      checkDone();
    });
  };

  useEffect(() => {
    handleRefresh(false);
  }, []);

  const filteredStaff = staff.filter((emp) => {
    if (statusFilter !== 'ALL' && (emp.performanceStatus || '') !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        (emp.name || '').toLowerCase().includes(q) ||
        String(emp.id).toLowerCase().includes(q) ||
        (emp.email || '').toLowerCase().includes(q) ||
        (emp.phone || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const targetAchievedCount = staff.filter(
    (s) => s.callsCompleted >= (s.dailyTarget || 100) || s.performanceStatus === 'TARGET_ACHIEVED'
  ).length;

  const totalCallsCompleted = staff.reduce((acc, s) => acc + (s.callsCompleted || 0), 0);
  const totalDailyTarget = staff.reduce((acc, s) => acc + (s.dailyTarget || 100), 0);
  const completionRate = totalDailyTarget > 0 ? Math.round((totalCallsCompleted / totalDailyTarget) * 100) : 0;

  const totalConvertedCount = staff.reduce(
    (acc, s) => acc + (s.convertedLeadsCount || 0),
    0
  );

  const totalInterestedCount = staff.reduce(
    (acc, s) => acc + (s.interestedCount || 0),
    0
  );

  const openStaffDialer = (empId) => {
    navigate('/staff/dialer');
  };

  const formik = useFormik({
    initialValues: userForm,
    enableReinitialize: true,
    validate: (values) => {
      let errors = {};
      if (!values.name || !values.name.trim()) {
        errors.name = 'Full name is required';
      }
      if (!values.email || !values.email.trim()) {
        errors.email = 'Work email is required';
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email.trim())) {
        errors.email = 'Invalid email address';
      }
      if (!values.password || values.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      if (!values.phone || !values.phone.trim()) {
        errors.phone = 'Phone number is required';
      }
      if (values.role === 'STAFF' && (!values.daily_call_target || Number(values.daily_call_target) < 1)) {
        errors.daily_call_target = 'Daily call target must be at least 1';
      }
      return errors;
    },
    onSubmit: (values) => {
      setIsRegistering(true);
      registerUser(values)((response) => {
        setIsRegistering(false);
        if (response && (response.success || response.status === 201 || response.status === 200)) {
          showToast(response.message || `${values.role} account created successfully.`);
          setRegisterModalOpen(false);
          setUserForm(INITIAL_USER_FORM);
          handleRefresh();
        } else {
          showToast(response?.message || 'Failed to register user.');
        }
      });
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="fw-extrabold mb-1">Employees Performance &amp; Daily 100-Call Quota Tracker</h3>
        
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-icon"
            onClick={() => handleRefresh(true)}
            disabled={isRefreshing}
            title="Refresh Targets"
          >
            <RefreshCw size={15} className={isRefreshing ? 'spinner-border spinner-border-sm' : ''} />
          </button>

          <button
            type="button"
            className="btn btn-outline-primary fw-semibold d-inline-flex align-items-center gap-2"
            onClick={() => {
              setUserForm(INITIAL_USER_FORM);
              setRegisterModalOpen(true);
            }}
          >
            <UserPlus size={17} />
            Register Staff / Admin
          </button>

          <div
            className="btn btn-cta fw-semibold d-inline-flex align-items-center gap-2 shadow-cta"
            style={{ pointerEvents: 'none' }}
          >
            Floor Quota: {totalCallsCompleted} / {totalDailyTarget || 2000} Calls ({completionRate}%)
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <MetricCard
            label="Active Tele-Callers"
            value={`${staff.length} Staff`}
            subtext="100 Calls/Day Target Each"
            icon={Users}
            tone="primary"
            badgeText="Active Roster"
            badgeTone="primary"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <MetricCard
            label="Target Achieved Today"
            value={`${targetAchievedCount} / ${staff.length}`}
            subtext="Completed 100+ daily calls"
            icon={Award}
            tone="success"
            progressPercent={staff.length > 0 ? (targetAchievedCount / staff.length) * 100 : 0}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <MetricCard
            label="Interested Calls Today"
            value={dashboardStats?.interestedCallsToday || totalInterestedCount}
            subtext="High-intent prospects today"
            icon={CheckCircle2}
            tone="violet"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <MetricCard
            label="Converted Leads"
            value={totalConvertedCount || dashboardStats?.disbursedLeadsCount || 0}
            subtext="Total converted across staff"
            icon={FileCheck2}
            tone="warning"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="crm-panel">
        <div className="panel-header">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="input-group input-group-sm" style={{ width: '260px' }}>
              <span className="input-group-text bg-white">
                <Search size={15} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, phone, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="btn-group btn-group-sm">
              {[
                { key: 'ALL', label: `All Staff (${staff.length})` },
                { key: 'TARGET_ACHIEVED', label: 'TARGET_ACHIEVED' },
                { key: 'ON_TRACK', label: 'ON_TRACK' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`btn ${
                    statusFilter === tab.key ? 'btn-primary fw-semibold' : 'btn-outline-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="crm-table-wrapper">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Executive Name &amp; Contact</th>
                <th>Account Status</th>
                <th>Performance Status</th>
                <th style={{ minWidth: '230px' }}>100-Call Daily Target Progress</th>
                <th>Interested Today</th>
                <th>Converted Leads</th>
                <th>Assigned Leads</th>
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
                    <div className="text-xs text-muted fw-semibold">Loading staff target roster...</div>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-5">
                    No staff members found. Click &ldquo;Register Staff / Admin&rdquo; to create a new staff caller account.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((emp) => {
                  const pct = Math.min(
                    100,
                    Math.round(((emp.callsCompleted || 0) / (emp.dailyTarget || 100)) * 100)
                  );
                  const deficit = Math.max(0, (emp.dailyTarget || 100) - (emp.callsCompleted || 0));
                  return (
                    <tr key={emp.id}>
                      <td className="font-mono fw-bold text-xs text-primary">#{emp.id}</td>
                      <td>
                        <div className="fw-bold">{emp.name}</div>
                        <div className="text-xs text-muted">
                          {emp.email} {emp.phone ? `• ${emp.phone}` : ''}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            emp.isActive !== false
                              ? 'bg-success-subtle text-success'
                              : 'bg-secondary-subtle text-secondary'
                          }`}
                        >
                          {emp.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={emp.performanceStatus || emp.status} type="agent" />
                      </td>
                      <td>
                        <div className="d-flex justify-content-between text-xs fw-bold mb-1">
                          <span>
                            {emp.callTargetDisplay || `${emp.callsCompleted} / ${emp.dailyTarget}`} (
                            {emp.progressPercentage || `${pct}%`})
                          </span>
                          <span className={deficit === 0 ? 'text-success' : 'text-muted'}>
                            {deficit === 0 ? 'Target Met!' : `${deficit} left`}
                          </span>
                        </div>
                        <div className="progress progress-thin">
                          <div
                            className={`progress-bar ${
                              pct >= 90 ? 'bg-success' : pct >= 65 ? 'bg-primary' : 'bg-warning'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-success-subtle text-success fw-bold px-2 py-1">
                          {emp.interestedCount}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-info-subtle text-info-emphasis fw-bold px-2 py-1">
                          <FileCheck2 size={12} className="me-1" />
                          {emp.convertedLeadsCount}
                        </span>
                      </td>
                      <td>
                        <span className="fw-bold text-sm">{emp.totalAssignedLeads}</span>
                      </td>
                      
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register User Modal (POST /api/auth/register) */}
      {registerModalOpen && (
        <div className="crm-modal-backdrop" onClick={() => setRegisterModalOpen(false)}>
          <div className="crm-modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="crm-modal-header">
              <div>
                <h5 className="mb-0 fw-bold">Register New Staff / Admin Account</h5>
                <span className="text-xs text-muted">
                  Set up employee credentials and operational access
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-light rounded-circle p-2"
                onClick={() => setRegisterModalOpen(false)}
              >
                <X size={16} />
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
                      name="name"
                      className={`form-control ${formik.touched.name && formik.errors.name ? 'is-invalid' : ''}`}
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., Rajesh Sharma"
                    />
                    {formik.touched.name && formik.errors.name && (
                      <div className="text-danger text-xs mt-1">{formik.errors.name}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-sm fw-bold">
                      Work Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`}
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., rajesh.staff@loancrm.com"
                    />
                    {formik.touched.email && formik.errors.email && (
                      <div className="text-danger text-xs mt-1">{formik.errors.email}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-sm fw-bold">
                      Password <span className="text-danger">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      className={`form-control ${formik.touched.password && formik.errors.password ? 'is-invalid' : ''}`}
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="e.g., Password@123"
                    />
                    {formik.touched.password && formik.errors.password && (
                      <div className="text-danger text-xs mt-1">{formik.errors.password}</div>
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
                      placeholder="e.g., +919876543210"
                    />
                    {formik.touched.phone && formik.errors.phone && (
                      <div className="text-danger text-xs mt-1">{formik.errors.phone}</div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-sm fw-bold">
                      Role
                    </label>
                    <select
                      name="role"
                      className="form-select"
                      value={formik.values.role}
                      onChange={(e) => {
                        const nextRole = e.target.value;
                        formik.setFieldValue('role', nextRole);
                        formik.setFieldValue('daily_call_target', nextRole === 'ADMIN' ? 0 : 100);
                      }}
                      onBlur={formik.handleBlur}
                    >
                      <option value="STAFF">STAFF (Employee / Caller)</option>
                      <option value="ADMIN">ADMIN (Manager / Floor Leader)</option>
                    </select>
                  </div>
                  {formik.values.role === 'STAFF' && (
                    <div className="col-md-6">
                      <label className="form-label text-sm fw-bold">
                        Daily Call Target <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        name="daily_call_target"
                        min="1"
                        className={`form-control ${formik.touched.daily_call_target && formik.errors.daily_call_target ? 'is-invalid' : ''}`}
                        value={formik.values.daily_call_target}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.daily_call_target && formik.errors.daily_call_target && (
                        <div className="text-danger text-xs mt-1">{formik.errors.daily_call_target}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="crm-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary fw-semibold px-4"
                  onClick={() => setRegisterModalOpen(false)}
                  disabled={isRegistering}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-cta fw-semibold px-4 shadow-cta"
                  disabled={isRegistering}
                >
                  {isRegistering ? 'Creating Account...' : `Create ${formik.values.role} Account`}
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

export default StaffTargets;
