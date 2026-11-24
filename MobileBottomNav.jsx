import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ADMIN_ROUTES, STAFF_ROUTES } from '../Routes/Routes';
import { LuMenu } from 'react-icons/lu';

const MobileBottomNav = ({
  role = 'admin',
  setMobileOpen,
  dashboardStats = null,
  activeStaff = null,
  newLeadsCount = 0,
  callbacksCount = 0,
}) => {
  const location = useLocation();
  const routes = role === 'admin' ? ADMIN_ROUTES : STAFF_ROUTES;

  const getBadgeValue = (badgeKey) => {
    if (!badgeKey) return null;
    if (badgeKey === 'unassignedLeads') {
      return null;
    }
    if (badgeKey === 'pendingCalls') {
      return newLeadsCount > 0 ? newLeadsCount : null;
    }
    if (badgeKey === 'callbacks') {
      return callbacksCount > 0 ? callbacksCount : null;
    }
    return null;
  };

  return (
    <nav
      className="crm-mobile-bottom-nav d-flex d-lg-none align-items-center justify-content-around"
      aria-label="Mobile Navigation"
    >
      {routes.map((route) => {
        const Icon = route.icon;
        const targetPath = `/${role}/${route.path}`;
        const isActive =
          location.pathname === targetPath ||
          location.pathname.startsWith(`${targetPath}/`);
        const badge = getBadgeValue(route.badgeKey);

        // Shorten label for mobile bottom bar
        const shortName =
          route.path === 'dashboard'
            ? (role === 'admin' ? 'Home' : 'Dashboard')
            : route.path === 'distribution'
            ? 'Leads'
            : route.path === 'targets'
            ? 'Staff'
            : route.path === 'banks'
            ? 'Banks'
            : route.path === 'dialer'
            ? 'Dialer'
            : route.path === 'followups'
            ? 'Schedule'
            : route.path === 'documents'
            ? 'Vault'
            : route.name;

        return (
          <NavLink
            key={route.path}
            to={targetPath}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="position-relative d-inline-flex align-items-center justify-content-center">
              <Icon size={20} className="mobile-nav-icon" />
              {badge ? (
                <span className="mobile-nav-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </div>
            <span className="mobile-nav-label">{shortName}</span>
          </NavLink>
        );
      })}

      {/* Quick Menu / Drawer Trigger */}
      <button
        type="button"
        className="mobile-nav-item border-0 bg-transparent"
        onClick={() => setMobileOpen?.(true)}
        title="Open Full Navigation Menu"
      >
        <div className="d-inline-flex align-items-center justify-content-center">
          <LuMenu size={20} className="mobile-nav-icon" />
        </div>
        <span className="mobile-nav-label">Menu</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;

