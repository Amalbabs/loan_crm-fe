//auth
export const POST_AUTH_REGISTER = '/auth/register';
export const POST_AUTH_LOGIN = '/auth/login';
export const GET_AUTH_PROFILE = '/auth/profile';

//admin-dashboard
export const GET_ADMIN_DASHBOARD_STATS = '/admin/dashboard-stats';
export const GET_ADMIN_EMPLOYEES_PERFORMANCE = '/admin/employees-performance';

//admin-lead-distribution
export const POST_ADMIN_DISTRIBUTE_LEADS = '/admin/distribute-leads';

//admin-document-verification
export const PUT_ADMIN_VERIFY_DOCUMENT = '/admin/verify-document';

//admin-bank-schemes
export const GET_ADMIN_SCHEMES = '/admin/schemes';
export const POST_ADMIN_SCHEMES = '/admin/schemes';
export const PUT_ADMIN_SCHEMES = '/admin/schemes';
export const DELETE_ADMIN_SCHEMES = '/admin/schemes';

//leads-management
export const POST_LEADS_BULK_UPLOAD = '/leads/bulk-upload';
export const GET_LEADS = '/leads';
export const POST_CREATE_LEAD = '/leads';
export const PUT_UPDATE_LEAD = '/leads';

//staff-dialer
export const GET_STAFF_ASSIGNED_LEADS = '/staff/assigned-leads';
export const POST_STAFF_LOG_CALL = '/staff/log-call';
export const POST_STAFF_UPLOAD_DOCUMENT = '/staff/upload-document';
export const GET_STAFF_PERSONAL_PERFORMANCE = '/staff/personal-performance';

//health
export const GET_HEALTH = '/health';

//auth-endpoints-group
export const AUTH_ENDPOINTS = {
  REGISTER: POST_AUTH_REGISTER,
  LOGIN: POST_AUTH_LOGIN,
  PROFILE: GET_AUTH_PROFILE,
};

//admin-endpoints-group
export const ADMIN_ENDPOINTS = {
  DASHBOARD_STATS: GET_ADMIN_DASHBOARD_STATS,
  EMPLOYEES_PERFORMANCE: GET_ADMIN_EMPLOYEES_PERFORMANCE,
  DISTRIBUTE_LEADS: POST_ADMIN_DISTRIBUTE_LEADS,
  VERIFY_DOCUMENT: (id) => `${PUT_ADMIN_VERIFY_DOCUMENT}/${id}`,
  SCHEMES: GET_ADMIN_SCHEMES,
  SCHEME_BY_ID: (id) => `${GET_ADMIN_SCHEMES}/${id}`,
};

//leads-endpoints-group
export const LEADS_ENDPOINTS = {
  BULK_UPLOAD: POST_LEADS_BULK_UPLOAD,
  GET_LEADS: GET_LEADS,
  CREATE_LEAD: POST_CREATE_LEAD,
  UPDATE_LEAD: (id) => `${PUT_UPDATE_LEAD}/${id}`,
};

//staff-endpoints-group
export const STAFF_ENDPOINTS = {
  ASSIGNED_LEADS: GET_STAFF_ASSIGNED_LEADS,
  LOG_CALL: POST_STAFF_LOG_CALL,
  UPLOAD_DOCUMENT: (id) => `${POST_STAFF_UPLOAD_DOCUMENT}/${id}`,
  PERSONAL_PERFORMANCE: GET_STAFF_PERSONAL_PERFORMANCE,
};

export const API_ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  ADMIN: ADMIN_ENDPOINTS,
  LEADS: LEADS_ENDPOINTS,
  STAFF: STAFF_ENDPOINTS,
  HEALTH: GET_HEALTH,
};

export default API_ENDPOINTS;
