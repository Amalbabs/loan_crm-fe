import Swal from 'sweetalert2';

/**
 * Standard confirmation dialog for signing out of LoanCore CRM.
 * @param {Function} onConfirm - Callback invoked if user confirms logout.
 * @param {Object} [customOptions={}] - Optional overrides for Swal.fire.
 */
export const confirmLogout = (onConfirm, customOptions = {}) => {
  return Swal.fire({
    title: 'Log Out of LoanCore CRM?',
    text: 'Are you sure you want to end your current session? You will be redirected to the sign-in gateway.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Log Out',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: {
      popup: 'crm-swal-popup',
      title: 'crm-swal-title',
      htmlContainer: 'crm-swal-text',
      confirmButton: 'btn btn-cta fw-semibold px-4 shadow-cta',
      cancelButton: 'btn btn-outline-secondary fw-semibold px-4',
      actions: 'd-flex gap-2 justify-content-center mt-3',
    },
    ...customOptions,
  }).then((result) => {
    if (result.isConfirmed && typeof onConfirm === 'function') {
      onConfirm();
    }
    return result;
  });
};

/**
 * Generic confirmation prompt.
 */
export const showConfirm = ({
  title = 'Are you sure?',
  text = '',
  icon = 'warning',
  confirmButtonText = 'Yes, Proceed',
  cancelButtonText = 'Cancel',
  onConfirm,
  customOptions = {},
}) => {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: 'crm-swal-popup',
      title: 'crm-swal-title',
      htmlContainer: 'crm-swal-text',
      confirmButton: 'btn btn-cta fw-semibold px-4 shadow-cta',
      cancelButton: 'btn btn-outline-secondary fw-semibold px-4',
      actions: 'd-flex gap-2 justify-content-center mt-3',
    },
    ...customOptions,
  }).then((result) => {
    if (result.isConfirmed && typeof onConfirm === 'function') {
      onConfirm();
    }
    return result;
  });
};

/**
 * Success notification alert.
 */
export const showSuccess = (title, text = '', timer = 2200) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer,
    showConfirmButton: false,
    buttonsStyling: false,
    customClass: {
      popup: 'crm-swal-popup',
      title: 'crm-swal-title',
      htmlContainer: 'crm-swal-text',
    },
  });
};

/**
 * Error notification alert.
 */
export const showError = (title, text = '') => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'OK',
    buttonsStyling: false,
    customClass: {
      popup: 'crm-swal-popup',
      title: 'crm-swal-title',
      htmlContainer: 'crm-swal-text',
      confirmButton: 'btn btn-primary fw-semibold px-4',
    },
  });
};

export default {
  Swal,
  confirmLogout,
  showConfirm,
  showSuccess,
  showError,
};

