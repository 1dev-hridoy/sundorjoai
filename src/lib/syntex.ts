import axios from 'axios';

const API_URL = "http://localhost:3000";

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
    // We don't need a separate uploadImage method for the backend if the backend handles it in the chat endpoint.
    // However, the current React UI uploads *before* sending the message to show a preview URL.
    // Looking at the node backend: `handleChatRequest` (POST /api/chat/:id) accepts `text` and `file`.
    // It uploads to Cloudinary internally.
    //
    // Problem: React UI expects an image URL back *immediately* after upload to display it in the chat bubble.
    // Solution: We can create a temporary preview locally (URL.createObjectURL) for display,
    // and send the FILE to the backend when "sending" the message.
    //
    // But `ChatArea` handles upload separate from send? 
    // Wait, in `chat.tsx`, `handleSendMessage` accepts a `File`.
    // It currently calls `SyntexService.uploadImage(file)` then `generateResponse`.
    // ADJUSTMENT: We will update `chat.tsx` to NOT upload separately, but send `file` to `generateResponse`.
    // But for now, let's keep the signature similar or adapt.

    // Actually, looking at the previous step's `chat.tsx`, it calls `uploadImage` first.
    // If we want to use the backend's Cloudinary logic, we should use the backend.
    // Does the backend have a standalone /upload endpoint?
    // The reference code didn't show one in `api.js` or `chatController.js`. It seemed to be part of the chat flow.
    //
    // HACK: For the "upload" step in the UI, we can just return the local ObjectURL, 
    // and pass the `File` object to `generateResponse`.
    // `generateResponse` will then send `multipart/form-data` to the backend.

    uploadImage: async (file: File): Promise<string> => {
        // Return a local preview URL immediately. The actual upload happens in generateResponse.
        return URL.createObjectURL(file);
    },

    generateResponse: async (text: string, file: File | null, sessionId: string): Promise<string> => {
        const formData = new FormData();
        if (text) formData.append('text', text);
        if (file) formData.append('image', file);

        try {
            // The backend endpoint is likely /api/chat/:chatId or /chat/api/:chatId
            // Based on index.js analysis: app.use('/', chatRoutes) 
            // and usually router.post('/api/chat/:chatId', ...)
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
            const axiosError = error as { response?: { data?: { error?: string } } };
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
            const axiosError = error as { response?: { data?: { error?: string } } };
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