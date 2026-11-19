import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import PrivateRoutes from './PrivateRoutes';
import { LoginPage, LazyLoader } from './Routes/Routes';
import { getCurrentUser } from './utils/normalizers';
import ErrorBoundary from './components/common/ErrorBoundary';

// Role-Based Access Control Root Resolver (dashboard route: /)
const RoleBasedDashboard = () => {
  const currentUser = getCurrentUser();
  const token = localStorage.getItem('loancore_token') || localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const role = currentUser?.role ? currentUser.role.toLowerCase() : (localStorage.getItem('role') || 'staff').toLowerCase();
  return role === 'admin' ? (
    <Navigate to="/admin/dashboard" replace />
  ) : (
    <Navigate to="/staff/dialer" replace />
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Dashboard Route: / (Role-Based Resolver) */}
          <Route path="/" element={<RoleBasedDashboard />} />

          {/* Login Page Route: /login */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<LazyLoader message="Loading Authentication Gateway..." />}>
                <LoginPage />
              </Suspense>
            }
          />

          {/* Admin Portal Routing with RBAC Guard */}
          <Route path="/admin/*" element={<AdminLayout />} />

          {/* Staff Portal Routing with RBAC Guard */}
          <Route path="/staff/*" element={<PrivateRoutes />} />

          {/* Fallback to Dashboard Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
