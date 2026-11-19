import { POST_AUTH_LOGIN, POST_AUTH_REGISTER, GET_AUTH_PROFILE } from "../../Api/ApiEndpoints";
import axiosInstance from "../../Api/Axios/AxiosInstance";

export const loginUser = (props) => (onResponse) => {
    try {
        let BASE_URL = `${POST_AUTH_LOGIN}`;

        axiosInstance.post(BASE_URL, {
            email: props?.email,
            password: props?.password,
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

export const registerUser = (props) => (onResponse) => {
    try {
        let BASE_URL = `${POST_AUTH_REGISTER}`;

        const role = (props?.role || 'STAFF').toUpperCase();
        const payload = {
            name: props?.name,
            email: props?.email,
            password: props?.password,
            role,
            phone: props?.phone,
            ...(role === 'STAFF'
                ? { daily_call_target: Number(props?.daily_call_target ?? props?.dailyCallTarget ?? 100) }
                : {}),
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

export const getUserProfile = (props) => (onResponse) => {
    try {
        let BASE_URL = `${GET_AUTH_PROFILE}`;

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
