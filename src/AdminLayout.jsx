import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet, useOutlet } from 'react-router-dom';
import Loader from './components/helper/Loader';
import Layout from './Layout/Layout';
import { getAdminDashboardStats } from './context/Admin/index';
import { getCurrentUser, logoutUser } from './utils/normalizers';

// Lazy load admin components
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const LeadDistribution = lazy(() => import('./pages/admin/LeadDistribution'));
const StaffTargets = lazy(() => import('./pages/admin/StaffTargets'));
const BankSchemes = lazy(() => import('./pages/admin/BankSchemes'));
const DocumentVault = lazy(() => import('./pages/staff/DocumentVault'));

// Guard: only Admin role can access admin routes
export const AdminRoute = ({ children }) => {
  const role = localStorage.getItem('role') || 'Admin';
  return role?.toLowerCase() === 'admin' ? children : <Navigate to="/" replace />;
};

const AdminLayout = () => {
  const navigate = useNavigate();
  const hasOutlet = Boolean(useOutlet());
  const [dashboardStats, setDashboardStats] = useState(null);

  const currentUser = getCurrentUser();
  const rawRole = localStorage.getItem('role') || currentUser?.role || 'Admin';
  const role = rawRole?.toLowerCase();

  // Guard: check authentication and Admin access
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
      navigate('/login', { replace: true });
    } else if (role !== 'admin') {
      navigate('/staff/dialer', { replace: true });
    } else {
      // Load floor stats for sidebar telemetry
      getAdminDashboardStats()((res) => {
        if (res && res.success && res.data) {
          setDashboardStats(res.data);
        }
      });
    }
  }, [role, navigate]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <Layout
      variant="admin"
      dashboardStats={dashboardStats}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <Suspense fallback={<div className="d-flex justify-content-center align-items-center py-5"><Loader /></div>}>
        {hasOutlet ? (
          <Outlet />
        ) : (
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="distribution" element={<LeadDistribution />} />
            <Route path="targets" element={<StaffTargets />} />
            <Route path="banks" element={<BankSchemes />} />
            <Route path="documents" element={<DocumentVault />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        )}
      </Suspense>
    </Layout>
  );
};

export default AdminLayout;
