import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './Adminsidebar';
import StaffSidebar from './StaffSidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { getCurrentUser } from '../utils/normalizers';

const Layout = ({
  variant, // 'admin' | 'staff' (auto-detected if omitted)
  children,
  // Optional controlled sidebar states
  collapsed: propCollapsed,
  setCollapsed: propSetCollapsed,
  mobileOpen: propMobileOpen,
  setMobileOpen: propSetMobileOpen,
  // Admin props
  dashboardStats = null,
  // Staff props
  activeStaff = null,
  personalPerformance = null,
  assignedCount = 0,
  newLeadsCount = 0,
  callbacksCount = 0,
  // Header props
  currentUser: propCurrentUser,
  onRefresh = null,
  isRefreshing = false,
  onLogout = null,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const collapsed = propCollapsed !== undefined ? propCollapsed : internalCollapsed;
  const setCollapsed = propSetCollapsed || setInternalCollapsed;

  const mobileOpen = propMobileOpen !== undefined ? propMobileOpen : internalMobileOpen;
  const setMobileOpen = propSetMobileOpen || setInternalMobileOpen;

  const currentUser = propCurrentUser || getCurrentUser();
  const rawRole = (currentUser?.role || localStorage.getItem('role') || 'staff').toLowerCase();
  const activeVariant = variant ? variant.toLowerCase() : (rawRole === 'admin' ? 'admin' : 'staff');
  const isAdmin = rawRole === 'admin';

  return (
    <div className="crm-app-shell">
      {/* Dynamic Navigation Rail (Admin or Staff) */}
      {activeVariant === 'admin' ? (
        <AdminSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          dashboardStats={dashboardStats}
        />
      ) : (
        <StaffSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          activeStaff={activeStaff}
          personalPerformance={personalPerformance}
          assignedCount={assignedCount}
          newLeadsCount={newLeadsCount}
          callbacksCount={callbacksCount}
        />
      )}

      {/* Main Content Area */}
      <div className={`crm-main-wrapper ${collapsed ? 'collapsed' : ''}`}>
        <Header
          setMobileOpen={setMobileOpen}
          currentUser={currentUser}
          role={activeVariant}
          isAdmin={isAdmin}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onLogout={onLogout}
        />

        {/* Scrollable Content Viewport */}
        <main className="crm-content-area">
          <ErrorBoundary>
            {children || <Outlet />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile App Style Bottom Navigation Rail */}
      <MobileBottomNav
        role={activeVariant}
        setMobileOpen={setMobileOpen}
        dashboardStats={dashboardStats}
        activeStaff={activeStaff}
        newLeadsCount={newLeadsCount}
        callbacksCount={callbacksCount}
      />
    </div>
  );
};

export default Layout;
