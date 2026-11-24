import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { LuMenu, LuX } from 'react-icons/lu';
import { ADMIN_ROUTES } from '../Routes/Routes';

const AdminSidebar = ({
  collapsed = false,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen,
  dashboardStats = null,
}) => {
  const location = useLocation();

  const quota = dashboardStats?.floorWideQuota;
  const totalCalls = Number(quota?.callsCompletedToday ?? 0);
  const totalTarget = Number(quota?.targetDailyQuota ?? 2000);
  const completionRate = quota?.quotaPercentage
    ? Math.round(parseFloat(quota.quotaPercentage))
    : totalTarget > 0
    ? Math.round((totalCalls / totalTarget) * 100)
    : 0;

  // Dynamic floor status badges
  const getBadgeValue = (badgeKey) => {
    if (badgeKey === 'completionRate') return `${completionRate}%`;
    if (badgeKey === 'unassignedLeads') {
      return null;
    }
    if (badgeKey === 'callVelocity') {
      return `${totalCalls}/${totalTarget}`;
    }
    return null;
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 992;
  const isEffectivelyCollapsed = collapsed && !isMobile;

  return (
    <Sidebar
      collapsed={isEffectivelyCollapsed}
      toggled={mobileOpen}
      onBackdropClick={() => setMobileOpen?.(false)}
      breakPoint="lg"
      backgroundColor="#153298"
      width="265px"
      collapsedWidth="80px"
      data-testid="ps-sidebar-root-test-id"
      id="ps-sidebar-root-test-id"
      rootStyles={{
        color: '#ffffff',
        borderRight: 'none',
        height: '100vh',
      }}
    >
      <div className="d-flex flex-column h-100 justify-content-between">
        <div>
          {/* Sidebar Brand Header */}
          <div
            className={`d-flex align-items-center ${
              collapsed ? 'justify-content-center' : 'justify-content-between'
            } p-3 border-bottom border-white border-opacity-10`}
          >
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <div
                className="rounded-3 bg-white text-primary fw-extrabold d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 36, height: 36, color: '#153298', fontSize: '0.9rem' }}
              >
                LC
              </div>
              {!collapsed && (
                <div className="text-truncate">
                  <h6 className="fw-extrabold mb-0 text-white text-truncate" style={{ fontSize: '0.98rem' }}>
                    LoanCore CRM
                  </h6>
                  <span
                    className="text-xs text-uppercase fw-bold text-white-50"
                    style={{ letterSpacing: '0.08em' }}
                  >
                    Admin Control Center
                  </span>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <div className="d-flex align-items-center gap-1 d-lg-none">
              <button
                type="button"
                className="btn btn-sm btn-link text-white p-1"
                onClick={() => setMobileOpen?.(false)}
              >
                <LuX size={20} />
              </button>
            </div>
          </div>

          {/* Navigation Menu Header with Hamburger Button */}
          {!collapsed ? (
            <div
              className="d-flex align-items-center justify-content-between px-3 pt-3 pb-1 text-xs fw-bold text-uppercase text-white-50"
              style={{ letterSpacing: '0.08em' }}
            >
              <span>Admin Operations</span>
              <button
                type="button"
                className="btn btn-sm btn-link text-white-50 p-0 d-none d-lg-inline-flex align-items-center"
                onClick={() => setCollapsed?.(true)}
                title="Collapse Sidebar"
              >
                <LuMenu size={16} />
              </button>
            </div>
          ) : (
            <div className="text-center pt-2 pb-1 d-none d-lg-block">
              <button
                type="button"
                className="btn btn-sm btn-link text-white-50 p-1 d-inline-flex align-items-center justify-content-center"
                onClick={() => setCollapsed?.(false)}
                title="Expand Sidebar"
              >
                <LuMenu size={18} />
              </button>
            </div>
          )}

          <Menu
            menuItemStyles={{
              icon: {
                minWidth: collapsed ? '0px' : '26px',
                width: collapsed ? '100%' : '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: collapsed ? '0px' : '10px',
                marginLeft: '0px',
                margin: collapsed ? '0 auto' : undefined,
              },
              label: {
                display: collapsed ? 'none' : 'block',
              },
              button: ({ active }) => ({
                color: active ? '#153298' : 'rgba(255, 255, 255, 0.85)',
                backgroundColor: active ? '#ffffff' : 'transparent',
                fontWeight: active ? '700' : '500',
                borderRadius: '10px',
                margin: '4px 10px',
                padding: collapsed ? '10px 0' : '10px 14px',
                paddingLeft: collapsed ? '0px !important' : '14px',
                paddingRight: collapsed ? '0px !important' : '14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                textAlign: collapsed ? 'center' : 'left',
                position: 'relative',
                borderLeft: 'none',
                boxShadow: active ? '0 4px 14px -4px rgba(9, 26, 87, 0.35)' : 'none',
                transition: 'all 0.15s ease',
                '&::before': active
                  ? {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '10px',
                      bottom: '10px',
                      width: '3.5px',
                      backgroundColor: '#ff7a18',
                      borderRadius: 0,
                      zIndex: 2,
                    }
                  : undefined,
                '&:hover': {
                  backgroundColor: active ? '#ffffff' : 'rgba(255, 255, 255, 0.12)',
                  color: active ? '#153298' : '#ffffff',
                  borderLeft: 'none',
                },
              }),
            }}
          >
            {ADMIN_ROUTES.map((route) => {
              const Icon = route.icon;
              const badge = getBadgeValue(route.badgeKey);
              const isActive =
                location.pathname.includes(`/admin/${route.path}`) ||
                location.pathname === `/${route.path}`;
              return (
                <MenuItem
                  key={route.path}
                  icon={<Icon size={16} style={{ color: isActive ? '#153298' : 'inherit' }} />}
                  active={isActive}
                  component={<NavLink to={`/admin/${route.path}`} onClick={() => setMobileOpen?.(false)} />}
                  onClick={() => setMobileOpen?.(false)}
                  suffix={
                    badge && !isEffectivelyCollapsed ? (
                      <span
                        className="badge rounded-pill fw-semibold text-xs"
                        style={{
                          backgroundColor: isActive ? '#eef3ff' : 'rgba(255,255,255,0.18)',
                          color: isActive ? '#153298' : '#ffffff',
                        }}
                      >
                        {badge}
                      </span>
                    ) : null
                  }
                >
                  {(!isEffectivelyCollapsed || mobileOpen) && route.name}
                </MenuItem>
              );
            })}
          </Menu>
        </div>

        {/* Bottom End: Floor Quota SLA Card & Footer */}
        {!collapsed && (
          <div
            className="quota-card mx-3 mb-3 p-3 rounded-3 mt-auto"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-1 text-xs text-white-50 fw-bold">
              <span>DAILY FLOOR SLA</span>
              <span className="badge bg-white text-primary fw-bold" style={{ color: '#153298' }}>
                {totalCalls} / {totalTarget}
              </span>
            </div>
            <div
              className="progress my-2"
              style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <div
                className="progress-bar bg-white"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="d-flex justify-content-between text-white-50" style={{ fontSize: '0.72rem' }}>
              <span>Interested: {dashboardStats?.interestedCallsToday || 0}</span>
              <span>Disbursed: {dashboardStats?.disbursedLeadsCount || 0}</span>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default AdminSidebar;

