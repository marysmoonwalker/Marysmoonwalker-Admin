import { api } from '../lib/axios';

export interface LoginCredentials {
    email: string;
    password: string;
}

export const authApi = {
    login: async (credentials: LoginCredentials) => {
        const response = await api.post('/auth/login', credentials);
        if (response.data?.data?.accessToken) {
            localStorage.setItem('accessToken', response.data.data.accessToken);
        }
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/auth/logout');
        localStorage.removeItem('accessToken');
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/auth/me');
        return response.data?.data;
    },
};