import { POST_LEADS_BULK_UPLOAD, GET_LEADS, POST_CREATE_LEAD, PUT_UPDATE_LEAD } from "../../Api/ApiEndpoints";
import axiosInstance from "../../Api/Axios/AxiosInstance";

export const bulkUploadLeads = (props) => (onResponse) => {
    try {
        let BASE_URL = `${POST_LEADS_BULK_UPLOAD}`;

        let config = {};
        if (props instanceof FormData) {
            config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };
        }

        axiosInstance.post(BASE_URL, props, config)
            .then((response) => {
                onResponse(response?.data);
            }).catch(error => {
                onResponse(error?.response?.data || error?.data || { success: false, message: error?.message });
            });

    } catch (error) {
        onResponse({ success: false, message: error?.message });
    }
}

export const getLeads = (props) => (onResponse) => {
    try {
        let params = [];
        if (props?.page) {
            params.push('page=' + props?.page);
        }
        if (props?.limit) {
            params.push('limit=' + props?.limit);
        }
        if (props?.status) {
            params.push('status=' + encodeURIComponent(props?.status));
        }
        if (props?.loan_type) {
            params.push('loan_type=' + encodeURIComponent(props?.loan_type));
        }
        if (props?.assigned_to) {
            params.push('assigned_to=' + props?.assigned_to);
        }
        if (props?.search) {
            params.push('search=' + encodeURIComponent(props?.search));
        }

        let BASE_URL = params.length > 0 ? `${GET_LEADS}?${params.join('&')}` : `${GET_LEADS}`;

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

export const createLead = (props) => (onResponse) => {
    try {
        let BASE_URL = `${POST_CREATE_LEAD}`;

        const payload = {
            ...(props?.id ? { id: Number(props.id) } : {}),
            ...(props?.full_name || props?.fullName || props?.customerName
                ? { full_name: props?.full_name || props?.fullName || props?.customerName }
                : {}),
            ...(props?.phone ? { phone: props.phone } : {}),
            ...(props?.email !== undefined ? { email: props.email } : {}),
            ...(props?.loan_type || props?.loanType
                ? { loan_type: props?.loan_type || props?.loanType }
                : {}),
            ...(props?.loan_amount !== undefined || props?.loanAmount !== undefined || props?.requestedAmount !== undefined
                ? { loan_amount: Number(props?.loan_amount ?? props?.loanAmount ?? props?.requestedAmount) }
                : {}),
            ...(props?.monthly_income !== undefined || props?.monthlyIncome !== undefined
                ? { monthly_income: Number(props?.monthly_income ?? props?.monthlyIncome) }
                : {}),
            ...(props?.credit_score !== undefined || props?.creditScore !== undefined
                ? { credit_score: Number(props?.credit_score ?? props?.creditScore) }
                : {}),
            ...(props?.status ? { status: props.status } : {}),
            ...(props?.notes !== undefined ? { notes: props.notes } : {}),
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

export const updateLead = (props) => (onResponse) => {
    try {
        const leadId = props?.id;
        let BASE_URL = leadId ? `${PUT_UPDATE_LEAD}/${leadId}` : `${POST_CREATE_LEAD}`;

        const payload = {
            ...(leadId ? { id: Number(leadId) } : {}),
            ...(props?.full_name || props?.fullName || props?.customerName
                ? { full_name: props?.full_name || props?.fullName || props?.customerName }
                : {}),
            ...(props?.phone ? { phone: props.phone } : {}),
            ...(props?.email !== undefined ? { email: props.email } : {}),
            ...(props?.loan_type || props?.loanType
                ? { loan_type: props?.loan_type || props?.loanType }
                : {}),
            ...(props?.loan_amount !== undefined || props?.loanAmount !== undefined || props?.requestedAmount !== undefined
                ? { loan_amount: Number(props?.loan_amount ?? props?.loanAmount ?? props?.requestedAmount) }
                : {}),
            ...(props?.monthly_income !== undefined || props?.monthlyIncome !== undefined
                ? { monthly_income: Number(props?.monthly_income ?? props?.monthlyIncome) }
                : {}),
            ...(props?.credit_score !== undefined || props?.creditScore !== undefined
                ? { credit_score: Number(props?.credit_score ?? props?.creditScore) }
                : {}),
            ...(props?.status ? { status: props.status } : {}),
            ...(props?.notes !== undefined ? { notes: props.notes } : {}),
        };

        axiosInstance.post(`${POST_CREATE_LEAD}`, payload)
            .then((response) => {
                onResponse(response?.data);
            }).catch(() => {
                axiosInstance.put(BASE_URL, payload)
                    .then((response) => {
                        onResponse(response?.data);
                    }).catch(error => {
                        onResponse(error?.response?.data || error?.data || { success: false, message: error?.message });
                    });
            });

    } catch (error) {
        onResponse({ success: false, message: error?.message });
    }
}
