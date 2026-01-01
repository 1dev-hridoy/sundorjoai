import axios from 'axios';

// Use relative path in production (empty string) to avoid CORS issues as frontend is served by backend
const API_URL = import.meta.env.PROD ? "" : "http://localhost:3000";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

export interface Message {
    role: 'user' | 'ai';
    content: string;
}

export interface ChatSession {
    id: string;
    title: string;
    date: string;
    createdAt: string;
}

export interface UserStats {
    totalChats: number;
    timeSaved: string;
}

export interface UserProfile {
    avatarStyle?: string;
}

import appConfig from '../../config/info.json';

export interface Branding {
    logo: {
        svg: string;
        png: string;
        favicon: string;
    };
    thumbnail: string;
}

export interface PricingPlan {
    plan: string;
    price: number;
    currency: string;
    billing: string;
    features: string[];
}

export interface AppInfo {
    app: {
        name: string;
        description: {
            short: string;
            meta: string;
            og: string;
        };
        branding: Branding;
    };
    pricing: PricingPlan[];
}

export const SyntexService = {


    uploadImage: async (file: File): Promise<string> => {

        return URL.createObjectURL(file);
    },

    generateResponse: async (text: string, file: File | null, sessionId: string): Promise<string> => {
        const formData = new FormData();
        if (text) formData.append('text', text);
        if (file) formData.append('image', file);

        try {

            const endpoint = `/api/chat/${sessionId}`;

            const response = await api.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response.data && response.data.success) {
                return response.data.result;
            } else {
                throw new Error(response.data.error || "AI failed to respond");
            }

        } catch (error) {
            console.error("AI Generation Error:", error);
            const axiosError = error as { response?: { data?: { error?: string } } };
            const msg = axiosError.response?.data?.error || (error as Error).message || "Connection failed";
            // Allow 400/500 errors to show up
            return `Error: ${msg}`;
        }
    },

    getAllChats: async (): Promise<ChatSession[]> => {
        try {
            const response = await api.get('/api/chats');

            if (response.data && response.data.success) {
                return response.data.sessions || [];
            } else {
                throw new Error(response.data.error || "Failed to fetch chats");
            }
        } catch (error) {
            console.error("Get all chats error:", error);
            const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
            // Check if it's an authentication error specifically
            if (axiosError.response?.status === 401) {
                throw new Error('Authentication required - please log in again');
            }
            throw new Error(axiosError.response?.data?.error || (error as Error).message || "Failed to fetch chats");
        }
    },

    getChatMessages: async (sessionId: string): Promise<Message[]> => {
        try {
            const response = await api.get(`/api/chat/${sessionId}/messages`);

            if (response.data && response.data.success) {
                return response.data.messages || [];
            } else {
                throw new Error(response.data.error || "Failed to fetch messages");
            }
        } catch (error) {
            console.error("Get chat messages error:", error);
            const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
            // Check if it's an authentication error or rate limiting error
            if (axiosError.response?.status === 401) {
                throw new Error('Authentication required - please log in again');
            }
            if (axiosError.response?.status === 429) {
                throw new Error('Rate limit exceeded - please try again later');
            }
            throw new Error(axiosError.response?.data?.error || (error as Error).message || "Failed to fetch messages");
        }
    },

    getUserStats: async (): Promise<UserStats> => {
        try {
            const response = await api.get('/api/user/stats');

            if (response.data && response.data.success) {
                return {
                    totalChats: response.data.totalChats || 0,
                    timeSaved: response.data.timeSaved || '0 hours'
                };
            } else {
                throw new Error(response.data.error || "Failed to fetch user statistics");
            }
        } catch (error) {
            console.error("Get user stats error:", error);
            const axiosError = error as { response?: { data?: { error?: string } } };
            throw new Error(axiosError.response?.data?.error || (error as Error).message || "Failed to fetch user statistics");
        }
    },

    updateUserProfile: async (profile: UserProfile): Promise<any> => {
        try {
            const response = await api.put('/api/user/profile', profile);

            if (response.data && response.data.success) {
                return response.data.user;
            } else {
                throw new Error(response.data.error || "Failed to update profile");
            }
        } catch (error) {
            console.error("Update user profile error:", error);
            const axiosError = error as { response?: { data?: { error?: string } } };
            throw new Error(axiosError.response?.data?.error || (error as Error).message || "Failed to update profile");
        }
    },

    getAppInfo: async (): Promise<AppInfo> => {
        // Simulating API latency
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(appConfig as unknown as AppInfo);
            }, 50);
        });
    }
};