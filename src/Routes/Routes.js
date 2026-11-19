import { lazy, createElement } from 'react';
import { BsFillFileEarmarkTextFill } from 'react-icons/bs';
import { IoIosPeople } from 'react-icons/io';
import {
  LuChartColumn,
  LuUsers,
  LuTarget,
  LuLandmark,
  LuPhoneCall,
  LuCalendarClock,
  LuFileCheck2,
} from 'react-icons/lu';

// ============================================================================
// Route Constants
// ============================================================================
export const Home = '/';
export const AdminDashboardRoute = 'dashboard';
export const LeadDistributionRoute = 'distribution';
export const StaffTargetsRoute = 'targets';
export const BankSchemesRoute = 'banks';
export const AdminDocumentsRoute = 'documents';

export const StaffDashboardRoute = 'dashboard';
export const StaffDialerRoute = 'dialer';
export const StaffFollowupsRoute = 'followups';
export const StaffDocumentsRoute = 'documents';

// Full Paths
export const AdminDashboardPath = '/admin/dashboard';
export const LeadDistributionPath = '/admin/distribution';
export const StaffTargetsPath = '/admin/targets';
export const BankSchemesPath = '/admin/banks';
export const AdminDocumentsPath = '/admin/documents';

export const StaffDashboardPath = '/staff/dashboard';
export const StaffDialerPath = '/staff/dialer';
export const StaffFollowupsPath = '/staff/followups';
export const StaffDocumentsPath = '/staff/documents';

// ============================================================================
// Lazy Loader Component (Pure JS compatible for .js extension)
// ============================================================================
export const LazyLoader = ({ message = 'Loading module...' }) =>
  createElement(
    'div',
    { className: 'd-flex flex-column align-items-center justify-content-center p-5 my-5' },
    createElement(
      'div',
      {
        className: 'spinner-border mb-3',
        role: 'status',
        style: {
          width: '2.75rem',
          height: '2.75rem',
          color: '#153298',
          borderWidth: '0.22rem',
        },
      },
      createElement('span', { className: 'visually-hidden' }, 'Loading...')
    ),
    createElement('div', { className: 'fw-semibold text-sm text-secondary' }, message),
    createElement('div', { className: 'text-xs text-muted mt-1' }, 'LoanCore CRM System')
  );

// ============================================================================
// Lazy-Loaded Page Components
// ============================================================================

// Auth Pages
export const LoginPage = lazy(() => import('../pages/auth/LoginPage'));

// Admin Pages
export const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
export const LeadDistribution = lazy(() => import('../pages/admin/LeadDistribution'));
export const StaffTargets = lazy(() => import('../pages/admin/StaffTargets'));
export const BankSchemes = lazy(() => import('../pages/admin/BankSchemes'));

// Staff Pages
export const StaffDashboard = lazy(() => import('../pages/staff/StaffDashboard'));
export const CallQueueDialer = lazy(() => import('../pages/staff/CallQueueDialer'));
export const FollowUpSchedule = lazy(() => import('../pages/staff/FollowUpSchedule'));
export const DocumentVault = lazy(() => import('../pages/staff/DocumentVault'));

// ============================================================================
// Route Configuration Collections
// ============================================================================

export const ADMIN_ROUTES = [
  {
    path: 'dashboard',
    name: 'Dashboard & Analytics',
    icon: LuChartColumn,
    component: AdminDashboard,
    badgeKey: 'completionRate',
  },
  {
    path: 'distribution',
    name: 'Lead Distribution',
    icon: BsFillFileEarmarkTextFill,
    component: LeadDistribution,
    badgeKey: 'unassignedLeads',
  },
  {
    path: 'targets',
    name: 'Staff Targets',
    icon: IoIosPeople ,
    component: StaffTargets,
    badgeKey: 'callVelocity',
  },
  {
    path: 'banks',
    name: 'Bank Schemes',
    icon: LuLandmark,
    component: BankSchemes,
    badgeKey: null,
  },
  {
    path: 'documents',
    name: 'Document Collection & Verification',
    icon: LuFileCheck2,
    component: DocumentVault,
    badgeKey: null,
  },
];

export const STAFF_ROUTES = [
  {
    path: 'dashboard',
    name: 'Dashboard',
    icon: LuChartColumn,
    component: StaffDashboard,
    badgeKey: null,
  },
  {
    path: 'dialer',
    name: 'Call Queue Dialer',
    icon: LuPhoneCall,
    component: CallQueueDialer,
    badgeKey: 'pendingCalls',
  },
  {
    path: 'followups',
    name: 'Follow-Up Schedule',
    icon: LuCalendarClock,
    component: FollowUpSchedule,
    badgeKey: 'callbacks',
  },
  {
    path: 'documents',
    name: 'Document Collection',
    icon: LuFileCheck2,
    component: DocumentVault,
    badgeKey: 'activeFiles',
  },
];

export default {
  ADMIN_ROUTES,
  STAFF_ROUTES,
  LazyLoader,
};
