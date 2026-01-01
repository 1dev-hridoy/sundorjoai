import axios from 'axios';

// Ensure this matches your backend URL from the .env
const API_URL = "http://localhost:3000";

// Axios instance with credentials (cookies) enabled
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});

export interface User {
    id: string;
    email: string;
    username?: string;
    createdAt?: string;
    avatarStyle?: string;
}

export const AuthService = {
    signup: async (name: string, email: string, password: string): Promise<User> => {
        try {
            const response = await api.post('/auth/signup', { email, password, username: name });
            if (response.data.success) {
                return {
                    id: response.data.user?.id || 'new_id',
                    email: response.data.user?.email || email,
                    username: response.data.user?.username || name,
                    createdAt: response.data.user?.createdAt,
                    avatarStyle: response.data.user?.avatarStyle
                };
            } else {
                throw new Error(response.data.error || "Signup failed");
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || "Signup failed");
        }
    },

    login: async (email: string, password: string): Promise<User> => {
        try {
            const response = await api.post('/auth/signin', { email, password });
            if (response.data.success) {
                return {
                    id: response.data.user?.id || 'user_id',
                    email: response.data.user?.email || email,
                    username: response.data.user?.username,
                    createdAt: response.data.user?.createdAt,
                    avatarStyle: response.data.user?.avatarStyle
                };
            } else {
                throw new Error(response.data.error || "Login failed");
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || "Login failed");
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout failed", error);
        }
    },

    getCurrentUser: async (): Promise<User | null> => {
        try {
            const response = await api.get('/auth/me');
            if (response.data.success && response.data.user) {
                return {
                    id: response.data.user.id,
                    email: response.data.user.email,
                    username: response.data.user.username,
                    createdAt: response.data.user.createdAt,
                    avatarStyle: response.data.user.avatarStyle
                };
            }
            return null;
        } catch (error) {
            return null;
        }
    }
};