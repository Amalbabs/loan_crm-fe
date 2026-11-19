import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import {
  LuLock,
  LuMail,
  LuArrowRight,
  LuCircleAlert,
  LuEye,
  LuEyeOff,
} from 'react-icons/lu';
import { loginUser, getUserProfile } from '../../context/Auth/Index';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../../Api/Axios/AxiosInstance';
import { getCurrentUser } from '../../utils/normalizers';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const user = getCurrentUser();
    if (user && token) {
      const role = (user.role || '').toLowerCase();
      const redirectPath = role === 'admin' ? '/admin/dashboard' : '/staff/dialer';
      navigate(redirectPath, { replace: true });
    }
  }, [navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    enableReinitialize: true,
    validate: (values) => {
      let errors = {};
      if (!values.email || !values.email.trim()) {
        errors.email = 'Please enter your work email address';
      } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email.trim())) {
        errors.email = 'Please enter a valid email address';
      }

      if (!values.password) {
        errors.password = 'Please enter your password';
      }

      return errors;
    },
    onSubmit: (values) => {
      setError('');
      setIsSubmitting(true);

      try {
        loginUser({
          email: values.email.trim(),
          password: values.password,
        })((response) => {
          if (response && (response.success || response.status === 200)) {
            const receivedToken = response.data?.token || response.token;
            const receivedUser = response.data?.user || response.user;

            if (receivedToken) {
              localStorage.setItem(TOKEN_STORAGE_KEY, receivedToken);
            }
            if (receivedUser) {
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(receivedUser));
            }

            // Fetch fresh profile from GET /api/auth/profile
            getUserProfile()((profileRes) => {
              setIsSubmitting(false);
              const finalUser =
                profileRes && (profileRes.success || profileRes.status === 200) && profileRes.data
                  ? profileRes.data.user || profileRes.data
                  : receivedUser;

              if (finalUser) {
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(finalUser));
                localStorage.setItem('is_logged', 'true');
                localStorage.setItem(
                  'role',
                  (finalUser.role || 'STAFF').toUpperCase() === 'ADMIN' ? 'Admin' : 'Staff'
                );
              }

              const userRole = (finalUser?.role || 'STAFF').toLowerCase();
              const destination =
                location.state?.from?.pathname ||
                (userRole === 'admin' ? '/admin/dashboard' : '/staff/dialer');
              navigate(destination, { replace: true });
            });
          } else {
            setIsSubmitting(false);
            setError(
              response?.message ||
                'Authentication failed. Please check your email and password.'
            );
          }
        });
      } catch (err) {
        setIsSubmitting(false);
        setError(err?.message || 'An unexpected error occurred during login.');
      }
    },
  });

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 position-relative overflow-hidden"
      style={{
        backgroundColor: '#f5f7fb',
        backgroundImage:
          'radial-gradient(at 0% 0%, rgba(21, 50, 152, 0.08) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(235, 62, 59, 0.05) 0, transparent 50%)',
        padding: '1.5rem',
      }}
    >
      {/* Decorative ambient glowing glass orbs */}
      <div
        style={{
          position: 'absolute',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(21, 50, 152, 0.32) 0%, rgba(21, 50, 152, 0) 70%)',
          top: '5%',
          left: '10%',
          filter: 'blur(55px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '440px',
          height: '440px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(235, 62, 59, 0.24) 0%, rgba(235, 62, 59, 0) 70%)',
          bottom: '5%',
          right: '10%',
          filter: 'blur(65px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="card border-0 overflow-hidden position-relative"
        style={{
          maxWidth: '980px',
          width: '100%',
          borderRadius: '26px',
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(26px) saturate(190%)',
          WebkitBackdropFilter: 'blur(26px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow:
            '0 30px 70px -15px rgba(21, 50, 152, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.6) inset',
          zIndex: 1,
        }}
      >
        <div className="row g-0">
          {/* Left Hero Brand Panel (Frosted Sapphire Glass) */}
          <div
            className="col-lg-5 p-4 p-md-5 d-flex flex-column justify-content-between text-white position-relative"
            style={{
              background:
                'linear-gradient(135deg, rgba(21, 50, 152, 0.88) 0%, rgba(18, 42, 130, 0.82) 55%, rgba(14, 32, 104, 0.92) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.15)',
            }}
          >
            <div>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="rounded-3 fw-extrabold d-flex align-items-center justify-content-center"
                  style={{
                    width: 44,
                    height: 44,
                    color: '#153298',
                    fontSize: '1.1rem',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    boxShadow:
                      '0 8px 20px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.6) inset',
                  }}
                >
                  LC
                </div>
                <div>
                  <h4 className="fw-extrabold mb-0 text-white" style={{ letterSpacing: '-0.02em' }}>
                    LoanCore CRM
                  </h4>
                  <span
                    className="text-xs text-uppercase fw-bold"
                    style={{ color: '#bdd0fb', letterSpacing: '0.08em' }}
                  >
                    Banking Intermediary System
                  </span>
                </div>
              </div>

              <h3 className="fw-extrabold text-white mb-3" style={{ lineHeight: 1.25 }}>
                Specialized Loan Sales &amp; Call Centre Portal
              </h3>
              <p className="text-sm" style={{ color: '#dce5fd', lineHeight: 1.6 }}>
                Secure intermediary gateway connecting retail &amp; SME borrowers with tier-1 partner banks.
              </p>
            </div>
          </div>

          {/* Right Form Panel (Frosted Translucent White Glass) */}
          <div
            className="col-lg-7 p-4 p-md-5 d-flex flex-column justify-content-between"
            style={{
              background: 'rgba(255, 255, 255, 0.78)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="fw-extrabold mb-1" style={{ color: '#162033' }}>
                    Log in to your account
                  </h4>
                  <p className="text-xs text-muted mb-0">
                    Enter your credentials to access your operational workbench
                  </p>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger py-2 px-3 text-xs fw-semibold d-flex align-items-center gap-2 mb-3">
                  <LuCircleAlert size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={formik.handleSubmit}>
                <div className="mb-3">
                  <label className="form-label text-xs fw-bold text-uppercase text-muted">
                    Work Email Address
                  </label>
                  <div className="input-group">
                    <span
                      className="input-group-text border-end-0"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        borderColor: formik.touched.email && formik.errors.email ? '#ef4444' : 'rgba(21, 50, 152, 0.18)',
                      }}
                    >
                      <LuMail size={16} className="text-muted" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      className={`form-control border-start-0 ps-1 ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`}
                      placeholder="name@loancrm.com"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        borderColor: formik.touched.email && formik.errors.email ? '#ef4444' : 'rgba(21, 50, 152, 0.18)',
                      }}
                    />
                  </div>
                  {formik.touched.email && formik.errors.email && (
                    <div className="text-danger text-xs mt-1 fw-semibold">{formik.errors.email}</div>
                  )}
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label text-xs fw-bold text-uppercase text-muted mb-0">
                      Password
                    </label>
                  </div>
                  <div className="input-group">
                    <span
                      className="input-group-text border-end-0"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        borderColor: formik.touched.password && formik.errors.password ? '#ef4444' : 'rgba(21, 50, 152, 0.18)',
                      }}
                    >
                      <LuLock size={16} className="text-muted" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={`form-control border-start-0 border-end-0 ps-1 ${formik.touched.password && formik.errors.password ? 'is-invalid' : ''}`}
                      placeholder="Enter password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        borderColor: formik.touched.password && formik.errors.password ? '#ef4444' : 'rgba(21, 50, 152, 0.18)',
                      }}
                    />
                    <button
                      type="button"
                      className="input-group-text border-start-0 cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.85)',
                        borderColor: formik.touched.password && formik.errors.password ? '#ef4444' : 'rgba(21, 50, 152, 0.18)',
                      }}
                    >
                      {showPassword ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                    </button>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <div className="text-danger text-xs mt-1 fw-semibold">{formik.errors.password}</div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-cta w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-cta"
                  style={{ fontSize: '0.95rem' }}
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Log In'}</span>
                  <LuArrowRight size={17} />
                </button>
              </form>
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs text-muted">
                LoanCore CRM • Bank Intermediary Infrastructure • Strict RBAC Enforced
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
