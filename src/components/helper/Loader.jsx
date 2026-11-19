import React from 'react';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-4">
      <div
        className="spinner-border mb-3"
        role="status"
        style={{
          width: '2.75rem',
          height: '2.75rem',
          color: '#153298',
          borderWidth: '0.22rem',
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      <div className="fw-semibold text-sm text-secondary">{message}</div>
      <div className="text-xs text-muted mt-1">LoanCore CRM System</div>
    </div>
  );
};

export default Loader;

