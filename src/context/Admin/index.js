import {
    GET_ADMIN_DASHBOARD_STATS,
    GET_ADMIN_EMPLOYEES_PERFORMANCE,
    POST_ADMIN_DISTRIBUTE_LEADS,
    PUT_ADMIN_VERIFY_DOCUMENT,
    GET_ADMIN_SCHEMES,
    POST_ADMIN_SCHEMES,
    PUT_ADMIN_SCHEMES,
    DELETE_ADMIN_SCHEMES,
} from "../../Api/ApiEndpoints";
import axiosInstance from "../../Api/Axios/AxiosInstance";

export const getAdminDashboardStats = (props) => (onResponse) => {
    try {
        let BASE_URL = `${GET_ADMIN_DASHBOARD_STATS}`;

        axiosInstance.get(BASE_URL)
            .then((response) => {
                onResponse(response?.data);
            }).catch(error => {
                onResponse(error?.response?.data || error?.data || { success: false, message: error?.message });
            });

    } catch (error) {
        onResponse({ success: false, message: error?.message });
    }
}

export const getEmployeesPerformance = (props) => (onResponse) => {
    try {
        let BASE_URL = `${GET_ADMIN_EMPLOYEES_PERFORMANCE}`;

        axiosInstance.get(BASE_URL)
            .then((response) => {
                onResponse(response?.data);
            }).catch(error => {
                onResponse(error?.response?.data || error?.data || { success: false, message: error?.message });
            });

    } catch (error) {
        onResponse({ success: false, message: error?.message });
    }
}

export const distributeLeads = (props) => (onResponse) => {
    try {
        let BASE_URL = `${POST_ADMIN_DISTRIBUTE_LEADS}`;

        const mode = props?.mode || 'round_robin';
        const payload = mode === 'manual'
            ? {
                mode: 'manual',
                staff_id: Number(props?.staff_id ?? props?.staffId),
                lead_ids: Array.isArray(props?.lead_ids)
                    ? props.lead_ids.map(Number)
                    : [Number(props?.lead_id ?? props?.leadId)],
            }
            : {
                mode: 'round_robin',
                batch_size: Number(props?.batch_size ?? props?.batchSize ?? 200),
            };

        axiosInstance.post(BASE_URL, payload)
            .then((response) => {
                onResponse(response?.data);
            }).catch(error => {
                onResponse(error?.response?.data || error?.data || { success: false, message: error?.message });
            });

    } catch (error) {
        onResponse({ success: false, message: error?.message });
    }
}

export const verifyDocument = (props) => (onResponse) => {
    try {
        const docId = props?.id ?? props?.documentId ?? props?.docId;
        let BASE_URL = `${PUT_ADMIN_VERIFY_DOCUMENT}/${docId}`;

        const payload = {
            status: (props?.status || 'APPROVED').toUpperCase(),
            remarks: props?.remarks || '',
        };

        axiosInstance.put(BASE_URL, payload)
            .then((response) => {
                onResponse(response?.data);
            }).catch(error => {
                onResponse(error?.response?.data || error?.data || { success: false, message: error?.message });
            });

    } catch (error) {
        onResponse({ success: false, message: error?.message });
    }
}

export const getBankSchemes = (props) => (onResponse) => {
    try {
        let params = [];
        if (props?.bank_name || props?.bankName) {
            params.push('bank_name=' + encodeURIComponent(props?.bank_name || props?.bankName));
        }
        if (props?.loan_type || props?.loanType) {
            params.push('loan_type=' + encodeURIComponent(props?.loan_type || props?.loanType));
        }

        let BASE_URL = params.length > 0 ? `${GET_ADMIN_SCHEMES}?${params.join('&')}` : `${GET_ADMIN_SCHEMES}`;

        axiosInstance.get(BASE_URL)
            .then((response) => {
                onResponse(response?.data);
            }).catch(error => {
                onResponse(error?.response?.data || error?.data || { success: false, message: error?.message });
            });

    } catch (error) {
        onResponse({ success: false, message: error?.message });
    }
}

export const createBankScheme = (props) => (onResponse) => {
    try {
        let BASE_URL = `${POST_ADMIN_SCHEMES}`;

        const payload = {
            bank_name: props?.bank_name ?? props?.bankName,
            scheme_name: props?.scheme_name ?? props?.schemeName,
            loan_type: props?.loan_type ?? props?.loanType ?? props?.loanCategory,
            roi: Number(props?.roi ?? parseFloat(props?.interestRate) ?? 10.5),
            processing_fee: Number(props?.processing_fee ?? parseFloat(props?.processingFee) ?? 1.0),
            min_credit_score: Number(props?.min_credit_score ?? props?.minCreditScore ?? 700),
            min_tenure_months: Number(props?.min_tenure_months ?? props?.minTenureMonths ?? 12),
            max_tenure_months: Number(props?.max_tenure_months ?? props?.maxTenureMonths ?? 60),
            max_amount: Number(props?.max_amount ?? props?.maxAmount ?? props?.maxLoanAmount ?? 4000000),
        };

        axiosInstance.post(BASE_URL, payload)
            .then((response) => {
                onResponse(response?.data);
            }).catch(error => {
                onResponse(error?.response?.data || error?.data || { success: false, message: error?.message });
            });

    } catch (error) {
        onResponse({ success: false, message: error?.message });
    }
}

export const updateBankScheme = (props) => (onResponse) => {
    try {
        const schemeId = props?.id;
        let BASE_URL = `${PUT_ADMIN_SCHEMES}/${schemeId}`;

        const payload = {
            bank_name: props?.bank_name ?? props?.bankName,
            scheme_name: props?.scheme_name ?? props?.schemeName,
            loan_type: props?.loan_type ?? props?.loanType ?? props?.loanCategory,
            roi: Number(props?.roi ?? parseFloat(props?.interestRate) ?? 10.5),
            processing_fee: Number(props?.processing_fee ?? parseFloat(props?.processingFee) ?? 1.0),
            min_credit_score: Number(props?.min_credit_score ?? props?.minCreditScore ?? 700),
            min_tenure_months: Number(props?.min_tenure_months ?? props?.minTenureMonths ?? 12),
            max_tenure_months: Number(props?.max_tenure_months ?? props?.maxTenureMonths ?? 60),
            max_amount: Number(props?.max_amount ?? props?.maxAmount ?? props?.maxLoanAmount ?? 4000000),
            ...(props?.is_active !== undefined || props?.isActive !== undefined
                ? { is_active: Boolean(props?.is_active ?? props?.isActive) }
                : {}),
        };

        axiosInstance.put(BASE_URL, payload)
            .then((response) => {
                onResponse(response?.data);
            }).catch(error => {
                onResponse(error?.response?.data || error?.data || { success: false, message: error?.message });
            });

    } catch (error) {
        onResponse({ success: false, message: error?.message });
    }
}

export const deleteBankScheme = (props) => (onResponse) => {
    try {
        const schemeId = typeof props === 'object' ? props?.id : props;
        let BASE_URL = `${DELETE_ADMIN_SCHEMES}/${schemeId}`;

        axiosInstance.delete(BASE_URL)
            .then((response) => {
                onResponse(response?.data);
            }).catch(error => {
                onResponse(error?.response?.data || error?.data || { success: false, message: error?.message });
            });

    } catch (error) {
        onResponse({ success: false, message: error?.message });
    }
}

