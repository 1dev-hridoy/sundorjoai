import axios from 'axios';

// Use relative path in production (empty string) to avoid CORS issues as frontend is served by backend
const API_URL = import.meta.env.PROD ? "" : "http://localhost:3000";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: false, // We'll use Clerk's authentication instead of cookies
});

// Add Clerk authentication interceptor
api.interceptors.request.use(
    async (config) => {
        // Get the session token from Clerk
        try {
            const token = await ((window as any).Clerk?.session?.getToken() || null);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting Clerk token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

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
    copyright?: string;
}

export const SyntexService = {


    uploadImage: async (file: File): Promise<string> => {

        return URL.createObjectURL(file);
    },

    generateResponse: async (text: string, file: File | null, sessionId: string, onStatus?: (message: string) => void): Promise<string> => {
        const formData = new FormData();
        if (text) formData.append('text', text);
        if (file) formData.append('image', file);

        try {
            const endpoint = `${API_URL}/api/chat/${sessionId}`;

            // Get Clerk token
            const token = await ((window as any).Clerk?.session?.getToken() || null);

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("Response body is null");

            const decoder = new TextDecoder();
            let resultText = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop() || "";

                for (const part of parts) {
                    const line = part.trim();
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.type === 'status' && onStatus) {
                                onStatus(data.message);
                            } else if (data.type === 'result') {
                                resultText = data.result;
                            } else if (data.type === 'error') {
                                throw new Error(data.error || "Streaming error occurred");
                            }
                        } catch (e) {
                            console.error("Error parsing SSE chunk:", e, line);
                        }
                    }
                }
            }

            if (!resultText) {
                throw new Error("AI failed to respond with a result");
            }

            return resultText;

        } catch (error) {
            console.error("AI Generation Error:", error);
            const msg = (error as Error).message || "Connection failed";
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

    deleteChat: async (chatId: string): Promise<any> => {
        try {
            const response = await api.delete(`/api/chat/${chatId}`);

            if (response.data && response.data.success) {
                return response.data;
            } else {
                throw new Error(response.data.error || "Failed to delete chat");
            }
        } catch (error) {
            console.error("Delete chat error:", error);
            const axiosError = error as { response?: { data?: { error?: string } } };
            throw new Error(axiosError.response?.data?.error || (error as Error).message || "Failed to delete chat");
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