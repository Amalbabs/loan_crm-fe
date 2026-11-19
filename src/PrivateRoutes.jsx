import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Loader from './components/helper/Loader';
import Layout from './Layout/Layout';
import AdminLayout from './AdminLayout';
import {
  Home,
  AdminDashboardRoute,
  LeadDistributionRoute,
  StaffTargetsRoute,
  BankSchemesRoute,
  StaffDashboardRoute,
  StaffDialerRoute,
  StaffFollowupsRoute,
  StaffDocumentsRoute,
} from './Routes/Routes';
import { getPersonalPerformance } from './context/Staff/index';
import { getCurrentUser } from './utils/normalizers';

// Lazy load admin and staff components
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const LeadDistribution = lazy(() => import('./pages/admin/LeadDistribution'));
const StaffTargets = lazy(() => import('./pages/admin/StaffTargets'));
const BankSchemes = lazy(() => import('./pages/admin/BankSchemes'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const CallQueueDialer = lazy(() => import('./pages/staff/CallQueueDialer'));
const FollowUpSchedule = lazy(() => import('./pages/staff/FollowUpSchedule'));
const DocumentVault = lazy(() => import('./pages/staff/DocumentVault'));

// Guard: only Admin role can access admin routes
const AdminRoute = ({ children }) => {
  const role = (localStorage.getItem('role') || '').toLowerCase();
  return role === 'admin' ? children : <Navigate to="/" replace />;
};

// Staff Workbench Shell Layout
const StaffLayout = () => {
  const [personalPerformance, setPersonalPerformance] = useState(null);
  const [assignedCount, setAssignedCount] = useState(0);
  const [isRefreshingHeader, setIsRefreshingHeader] = useState(false);

  const currentUser = getCurrentUser();
  const isAdmin = (currentUser?.role || localStorage.getItem('role') || '').toUpperCase() === 'ADMIN';

  const fetchStaffHeaderData = (isManual = false) => {
    if (isManual) setIsRefreshingHeader(true);

    getPersonalPerformance()((res) => {
      setIsRefreshingHeader(false);
      if (res && res.success && res.data) {
        setPersonalPerformance(res.data);
        if (res.data.assignedCount !== undefined || res.data.totalAssignedLeads !== undefined) {
          setAssignedCount(res.data.assignedCount ?? res.data.totalAssignedLeads);
        }
      }
    });
  };

  useEffect(() => {
    fetchStaffHeaderData(false);
  }, []);

  const dailyTarget = Number(personalPerformance?.dailyTarget || currentUser?.dailyCallTarget || 100);
  const callsCompleted = Number(personalPerformance?.callsCompletedToday || 0);

  const activeStaff = {
    name: personalPerformance?.agentName || currentUser?.name || 'Staff Member',
    dailyTarget,
    callsCompleted,
    interestedCount: Number(personalPerformance?.breakdownToday?.interested || 0),
    callbacksCount: Number(personalPerformance?.breakdownToday?.callbackScheduled || 0),
    docsCollected: Number(personalPerformance?.pipelineStats?.approvedOrDisbursedLeads || 0),
  };

  return (
    <Layout
      variant="staff"
      activeStaff={activeStaff}
      personalPerformance={personalPerformance}
      assignedCount={assignedCount}
      currentUser={currentUser}
      onRefresh={fetchStaffHeaderData}
      isRefreshing={isRefreshingHeader}
    />
  );
};

const Privateroutes = () => {
  const navigate = useNavigate();

  const [, setIsLogged] = useState(
    () =>
      localStorage.getItem('is_logged') === 'true' ||
      Boolean(localStorage.getItem('loancore_token') || localStorage.getItem('token'))
  );
  const rawRole = localStorage.getItem('role') || 'Staff';
  const role = rawRole.toLowerCase() === 'admin' ? 'Admin' : 'Staff';

  useEffect(() => {
    const logged =
      localStorage.getItem('is_logged') === 'true' ||
      Boolean(localStorage.getItem('loancore_token') || localStorage.getItem('token'));
    const hasAuthParams =
      typeof window !== 'undefined' &&
      (window.location.hash.includes('code=') ||
        window.location.hash.includes('error=') ||
        window.location.search.includes('code=') ||
        window.location.search.includes('error='));

    if (!logged && window.location.pathname !== '/login' && !hasAuthParams) {
      setIsLogged(false);
      navigate('/login', { replace: true });
    } else {
      setIsLogged(true);
    }
  }, [navigate]);

  return (
    <div>
      <Suspense
        fallback={
          <div className="d-flex justify-content-center align-items-center vh-100 vw-100">
            <Loader />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={role === 'Admin' ? <AdminLayout /> : <StaffLayout />}>
            <Route exact path={Home} element={role === 'Admin' ? <AdminDashboard /> : <StaffDashboard />} />
            <Route
              exact
              path={AdminDashboardRoute}
              element={
                role === 'Admin' ? (
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                ) : (
                  <StaffDashboard />
                )
              }
            />
            <Route
              exact
              path={LeadDistributionRoute}
              element={
                <AdminRoute>
                  <LeadDistribution />
                </AdminRoute>
              }
            />
            <Route
              exact
              path={StaffTargetsRoute}
              element={
                <AdminRoute>
                  <StaffTargets />
                </AdminRoute>
              }
            />
            <Route
              exact
              path={BankSchemesRoute}
              element={
                <AdminRoute>
                  <BankSchemes />
                </AdminRoute>
              }
            />

            {/* Staff Routes */}
            <Route exact path={StaffDashboardRoute} element={<StaffDashboard />} />
            <Route exact path={StaffDialerRoute} element={<CallQueueDialer />} />
            <Route exact path={StaffFollowupsRoute} element={<FollowUpSchedule />} />
            <Route exact path={StaffDocumentsRoute} element={<DocumentVault />} />

            {/* Direct nested aliases */}
            <Route exact path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route exact path="/admin/distribution" element={<AdminRoute><LeadDistribution /></AdminRoute>} />
            <Route exact path="/admin/targets" element={<AdminRoute><StaffTargets /></AdminRoute>} />
            <Route exact path="/admin/banks" element={<AdminRoute><BankSchemes /></AdminRoute>} />
            <Route exact path="/admin/documents" element={<AdminRoute><DocumentVault /></AdminRoute>} />
            <Route exact path="/staff/dashboard" element={<StaffDashboard />} />
            <Route exact path="/staff/dialer" element={<CallQueueDialer />} />
            <Route exact path="/staff/followups" element={<FollowUpSchedule />} />
            <Route exact path="/staff/documents" element={<DocumentVault />} />
          </Route>

          <Route exact path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default Privateroutes;
