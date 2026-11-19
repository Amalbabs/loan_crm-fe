import {
    GET_STAFF_ASSIGNED_LEADS,
    POST_STAFF_LOG_CALL,
    POST_STAFF_UPLOAD_DOCUMENT,
    GET_STAFF_PERSONAL_PERFORMANCE,
} from "../../Api/ApiEndpoints";
import axiosInstance from "../../Api/Axios/AxiosInstance";

export const getAssignedLeads = (props) => (onResponse) => {
    try {
        let params = [];
        if (props?.status) {
            params.push('status=' + encodeURIComponent(props?.status));
        }
        if (props?.page) {
            params.push('page=' + props?.page);
        }
        if (props?.limit) {
            params.push('limit=' + props?.limit);
        }

        let BASE_URL = params.length > 0 ? `${GET_STAFF_ASSIGNED_LEADS}?${params.join('&')}` : `${GET_STAFF_ASSIGNED_LEADS}`;

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

export const logCallOutcome = (props) => (onResponse) => {
    try {
        let BASE_URL = `${POST_STAFF_LOG_CALL}`;

        const rawDisposition = (props?.call_disposition || props?.disposition || 'INTERESTED').toUpperCase();
        let normalizedDisposition = 'INTERESTED';
        if (rawDisposition.includes('CALLBACK')) {
            normalizedDisposition = 'CALLBACK_SCHEDULED';
        } else if (rawDisposition.includes('NOT')) {
            normalizedDisposition = 'NOT_INTERESTED';
        } else if (rawDisposition.includes('INTERESTED')) {
            normalizedDisposition = 'INTERESTED';
        } else {
            normalizedDisposition = rawDisposition;
        }

        const payload = {
            lead_id: Number(props?.lead_id ?? props?.leadId),
            call_disposition: normalizedDisposition,
            call_duration_seconds: Number(props?.call_duration_seconds ?? props?.callDurationSeconds ?? 60),
            ...(normalizedDisposition === 'CALLBACK_SCHEDULED' && (props?.callback_date || props?.callbackDateTime)
                ? { callback_date: props?.callback_date || props?.callbackDateTime }
                : {}),
            ...(normalizedDisposition === 'NOT_INTERESTED' && (props?.rejection_reason || props?.rejectionReason)
                ? { rejection_reason: props?.rejection_reason || props?.rejectionReason }
                : {}),
            remarks: props?.remarks ?? props?.notes ?? '',
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

export const uploadCustomerDocument = (props) => (onResponse) => {
    try {
        const leadId = props?.leadId ?? props?.lead_id;
        let BASE_URL = `${POST_STAFF_UPLOAD_DOCUMENT}/${leadId}`;

        let formData;
        if (props?.formData instanceof FormData) {
            formData = props.formData;
        } else if (props instanceof FormData) {
            formData = props;
        } else {
            formData = new FormData();
            if (props?.document || props?.file) {
                formData.append('document', props?.document || props?.file);
            }
            formData.append('doc_type', props?.doc_type || props?.docType || 'PAN');
        }

        axiosInstance.post(BASE_URL, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
            .then((response) => {
                onResponse(response?.data);
            }).catch(error => {
                onResponse(error?.response?.data || error?.data || { success: false, message: error?.message });
            });

    } catch (error) {
        onResponse({ success: false, message: error?.message });
    }
}

export const getPersonalPerformance = (props) => (onResponse) => {
    try {
        let BASE_URL = `${GET_STAFF_PERSONAL_PERFORMANCE}`;

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

