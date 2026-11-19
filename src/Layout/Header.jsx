import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LuMenu,
  LuLogOut,
  LuRotateCcw,
  LuShieldCheck,
  LuPhoneCall,
} from 'react-icons/lu';
import { getCurrentUser, logoutUser } from '../utils/normalizers';
import { confirmLogout } from '../components/Alerts/SweetAlert';

const Header = ({
  setMobileOpen,
  currentUser = null,
  role = 'admin',
  isAdmin = false,
  onRefresh = null,
  isRefreshing = false,
  onLogout = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = currentUser || getCurrentUser();
  const userRole = user?.role || (role === 'admin' ? 'Admin' : 'Staff');
  const userIsAdmin = isAdmin || userRole?.toLowerCase() === 'admin';

  const handleLogout = () => {
    confirmLogout(() => {
      if (onLogout) {
        onLogout();
      } else {
        logoutUser();
        navigate('/login');
      }
    });
  };

  const initials = (user?.name || (role === 'admin' ? 'AD' : 'ST'))
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="crm-topbar">
      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn btn-light border d-lg-none p-1 px-2"
          onClick={() => setMobileOpen?.(true)}
          title="Open Menu"
        >
          <LuMenu size={18} />
        </button>
        <div className="d-flex align-items-center gap-2 d-lg-none">
          <div
            className="rounded-2 text-white fw-extrabold d-flex align-items-center justify-content-center"
            style={{ width: 28, height: 28, backgroundColor: '#153298', fontSize: '0.8rem' }}
          >
            LC
          </div>
          <span className="fw-bold text-dark text-truncate" style={{ fontSize: '0.9rem' }}>
            LoanCore {role === 'admin' ? 'Admin' : 'Dialer'}
          </span>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 gap-sm-3">
        {/* Portal Switcher for Admins */}
       

        {/* Optional Header Refresh Action */}
        {onRefresh && (
          <button
            type="button"
            onClick={() => onRefresh(true)}
            className="btn btn-outline-secondary btn-icon-sm d-none d-md-inline-flex"
            disabled={isRefreshing}
            title="Refresh Performance"
          >
            <LuRotateCcw
              size={14}
              className={isRefreshing ? 'spinner-border spinner-border-sm' : ''}
            />
          </button>
        )}

        {/* Authenticated User Profile & Logout */}
        <div className="d-flex align-items-center gap-2 border-start ps-2 ps-sm-3 ms-1">
          <div
            className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center text-xs shadow-xs flex-shrink-0"
            style={{ width: 30, height: 30, backgroundColor: '#153298', fontSize: '0.75rem' }}
          >
            {initials}
          </div>
          <div className="d-none d-xl-block text-start" style={{ lineHeight: 1.15 }}>
            <div className="fw-bold text-xs text-dark">
              {user?.name || (role === 'admin' ? 'Administrator' : 'Staff Member')}
            </div>
            <div className="text-muted" style={{ fontSize: '0.68rem' }}>
              Role: {userRole}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 ms-1 py-1 px-2 text-danger border-danger-subtle"
            title="Log out of session"
          >
            <LuLogOut size={14} />
            <span className="d-none d-md-inline text-xs fw-bold">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

