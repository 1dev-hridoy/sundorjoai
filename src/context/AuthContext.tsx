import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AuthService } from "../lib/auth";
import { SyntexService } from "../lib/syntex";
import type { User } from "../lib/auth";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    hasName: boolean;
    needsName: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setUserName: (name: string) => void;
    updateProfile: (profile: { username?: string; avatarStyle?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasName, setHasName] = useState(false);
    const [needsName, setNeedsName] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = await AuthService.getCurrentUser();
                setUser(currentUser);
                
                // Check if user has a name
                if (currentUser) {
                    const userHasName = !!currentUser.username && currentUser.username.trim() !== '';
                    setHasName(userHasName);
                    setNeedsName(!userHasName);
                }
            } catch (error) {
                console.error("Auth initialization failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const user = await AuthService.login(email, password);
        setUser(user);
        
        // Check if user has a name
        const userHasName = !!user.username && user.username.trim() !== '';
        setHasName(userHasName);
        setNeedsName(!userHasName);
    };

    const signup = async (name: string, email: string, password: string) => {
        const user = await AuthService.signup(name, email, password);
        setUser(user);
        
        // Since signup now includes name, user should have a name
        setHasName(true);
        setNeedsName(false);
    };

    const logout = async () => {
        await AuthService.logout();
        setUser(null);
        setHasName(false);
        setNeedsName(false);
    };

    const setUserName = (name: string) => {
        if (user) {
            const updatedUser = { ...user, username: name };
            setUser(updatedUser);
            setHasName(true);
            setNeedsName(false);
        }
    };

    const updateProfile = async (profile: { username?: string; avatarStyle?: string }) => {
        try {
            const updatedUserData = await SyntexService.updateUserProfile(profile);
            setUser(updatedUserData);
            
            // Update name status if username was updated
            if (profile.username) {
                const userHasName = !!updatedUserData.username && updatedUserData.username.trim() !== '';
                setHasName(userHasName);
                setNeedsName(!userHasName);
            }
        } catch (error) {
            console.error("Failed to update profile:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            isLoading, 
            hasName,
            needsName,
            login, 
            signup, 
            logout,
            setUserName,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}