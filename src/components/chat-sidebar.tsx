import React from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import {
    PlusIcon,
    UserIcon,
    LogOutIcon,
    MessageSquareIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUser, useAuth } from "@clerk/clerk-react";
import ConfirmationModal from "./confirmation-modal";

import { SyntexService } from "../lib/syntex";
import type { AppInfo } from "../lib/syntex";

export interface ChatSession {
    id: string;
    title: string;
    date: string;
    createdAt: string;
}

export interface User {
    id: string;
    email: string;
    username?: string;
    avatarStyle?: string;
}

export default function ChatSidebar({
    sessions,
    currentSessionId,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    onProfileClick,
    isOpen,
    onClose,
}: {
    sessions: ChatSession[];
    currentSessionId: string | null;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onProfileClick: () => void;
    isOpen: boolean;
    onClose: () => void;
}) {
    const navigate = useNavigate();
    const { user: currentUser, isSignedIn } = useUser();
    const { signOut } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);

    // State for confirmation modals
    const [showLogoutModal, setShowLogoutModal] = React.useState(false);
    const [chatToDelete, setChatToDelete] = React.useState<string | null>(null);
    const [appInfo, setAppInfo] = React.useState<AppInfo | null>(null);

    React.useEffect(() => {
        const fetchAppInfo = async () => {
            try {
                const info = await SyntexService.getAppInfo();
                setAppInfo(info);
            } catch (error) {
                console.error("Failed to fetch app info:", error);
            }
        };
        fetchAppInfo();
    }, []);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await signOut();
            navigate("/");
            toast.success("Logged out successfully");
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Failed to logout");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogoutConfirm = () => {
        handleLogout();
        setShowLogoutModal(false);
    };

    const handleDeleteChatConfirm = () => {
        if (chatToDelete) {
            onDeleteChat(chatToDelete);
            setChatToDelete(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        } else {
            return date.toLocaleDateString();
        }
    };

    return (
        <TooltipProvider>
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                        <div className="flex items-center space-x-2">
                            {appInfo?.app?.branding?.logo?.svg ? (
                                <img
                                    src={appInfo.app.branding.logo.svg}
                                    alt="Logo"
                                    className="w-8 h-8 rounded-lg object-contain"
                                />
                            ) : (
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center">
                                    <MessageSquareIcon className="h-5 w-5 text-white" />
                                </div>
                            )}
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {appInfo?.app?.name || "SundorjoAI"}
                            </h1>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden"
                            onClick={onClose}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5 text-gray-500"
                            >
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        </Button>
                    </div>

                    {/* User Profile */}
                    <div className="p-4 border-b border-gray-200">
                        {isLoading ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                </div>
                            </div>
                        ) : isSignedIn && currentUser ? (
                            <div className="flex items-center space-x-3">
                                <Avatar
                                    className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                                    onClick={onProfileClick}
                                >
                                    <AvatarImage
                                        src={currentUser.imageUrl || `https://api.dicebear.com/6.x/${currentUser.unsafeMetadata?.avatarStyle || 'micah'}/svg?seed=${currentUser.firstName || currentUser.emailAddresses[0]?.emailAddress}`}
                                        alt={currentUser.emailAddresses[0]?.emailAddress}
                                    />
                                    <AvatarFallback className="bg-blue-100 text-blue-800">
                                        {currentUser.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {currentUser.firstName || currentUser.emailAddresses[0]?.emailAddress?.split('@')[0]}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {currentUser.emailAddresses[0]?.emailAddress}
                                    </p>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowLogoutModal(true)}
                                            className="shrink-0 hover:bg-red-50 hover:text-red-600"
                                        >
                                            <LogOutIcon className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Logout</TooltipContent>
                                </Tooltip>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Avatar>
                                    <AvatarImage src="" alt="Guest" />
                                    <AvatarFallback className="bg-gray-100 text-gray-600">
                                        <UserIcon className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">Guest</p>
                                    <p className="text-xs text-gray-500">Not logged in</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* New Chat Button */}
                    <div className="p-4 border-b border-gray-200">
                        <Button onClick={onNewChat} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-sm">
                            <PlusIcon className="h-4 w-4 mr-2" />
                            New Chat
                        </Button>
                    </div>

                    {/* Chat Sessions */}
                    <ScrollArea className="flex-1 p-2">
                        <div className="space-y-1">
                            {sessions.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm rounded-lg bg-gray-50 border border-gray-200">
                                    <MessageSquareIcon className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                    <p>No chats yet</p>
                                    <p className="text-xs mt-1">Start a new conversation!</p>
                                </div>
                            ) : (
                                sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`group flex items-center justify-between rounded-lg p-3 text-sm cursor-pointer transition-all duration-200 ${currentSessionId === session.id
                                            ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 shadow-sm"
                                            : "hover:bg-gray-100/80"
                                            }`}
                                        onClick={() => onSelectChat(session.id)}
                                    >
                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <div className="flex items-center">
                                                <MessageSquareIcon className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                                                <p className="truncate font-medium flex-1">
                                                    {session.title}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 ml-6">
                                                {formatDate(session.createdAt)}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-red-50 hover:text-red-600"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setChatToDelete(session.id);
                                            }}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-4 w-4"
                                            >
                                                <path d="M3 6h18" />
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                            </svg>
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* App Info Footer */}
                    <div className="p-4 mt-auto border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-500">
                            SundorjoAI v1.0
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Secure & Private
                        </p>
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <ConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogoutConfirm}
                title="Confirm Logout"
                description="Are you sure you want to log out? You will need to sign in again to access your chats."
                confirmText="Logout"
                variant="destructive"
            />

            {/* Delete Chat Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!chatToDelete}
                onClose={() => setChatToDelete(null)}
                onConfirm={handleDeleteChatConfirm}
                title="Delete Chat"
                description="Are you sure you want to delete this chat? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />
        </TooltipProvider>
    );
}