import { MailIcon, CalendarIcon, SettingsIcon, BellIcon, ShieldIcon, LogOutIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useUser, useAuth } from "@clerk/clerk-react";
import { SyntexService } from "../lib/syntex";
import { useEffect, useState } from "react";
import UserNameModal from "./user-name-modal";

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
    const { user, isSignedIn } = useUser();
    const { signOut } = useAuth();
    const [stats, setStats] = useState<{ totalChats: number; timeSaved: string } | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);
    const [avatarUpdateTrigger, setAvatarUpdateTrigger] = useState(0);

    // Format the join date from user's creation date if available
    const formatDate = (dateString?: string) => {
        if (!dateString) return "Unknown";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
        });
    };

    const handleLogout = async () => {
        try {
            await signOut();
            onClose(); 
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleNameSet = async (name: string) => {
        try {
            await user?.update({
                firstName: name
            });
            
            setIsNameModalOpen(false);
        } catch (error) {
            console.error("Failed to update name:", error);
        }
    };


    useEffect(() => {
        if (isOpen && isSignedIn) {
            const fetchStats = async () => {
                setLoadingStats(true);
                try {
                    const userStats = await SyntexService.getUserStats();
                    setStats(userStats);
                } catch (error) {
                    console.error("Failed to fetch user stats:", error);
                    // Set default values if fetch fails
                    setStats({ totalChats: 0, timeSaved: "0 hours" });
                } finally {
                    setLoadingStats(false);
                }
            };

            fetchStats();
        } else if (!isOpen) {
            // Reset stats when modal closes
            setStats(null);
            setLoadingStats(true);
        }
    }, [isOpen, isSignedIn, avatarUpdateTrigger]); 

    // Update selected avatar style when user changes
    useEffect(() => {
        if (user) {
         
        }
    }, [user, avatarUpdateTrigger]); 

    if (!isSignedIn) {
        return null; 
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2 text-center relative border-b border-gray-100">
                    <DialogTitle className="sr-only">User Profile</DialogTitle>
                    <DialogDescription className="sr-only">View and manage your profile settings</DialogDescription>

                    <div className="relative inline-block mx-auto mb-4">
                        <div className="rounded-full bg-linear-to-br from-purple-100 to-indigo-100 p-1">
                            <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
                                <AvatarImage
                                    src={user?.imageUrl || `https://api.dicebear.com/6.x/${user?.unsafeMetadata?.avatarStyle || 'micah'}/svg?seed=${user?.firstName || user?.emailAddresses[0]?.emailAddress || 'user'}`}
                                    alt={user?.firstName || user?.emailAddresses[0]?.emailAddress || "User"}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-2xl font-bold">
                                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.emailAddresses[0]?.emailAddress ? user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase() : "U"}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="absolute bottom-1 right-1 size-5 bg-green-500 rounded-full border-[3px] border-white"></div>
                    </div>

                    <h3 className="font-semibold text-gray-900 text-lg">
                        {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || "User"}
                    </h3>
                    <p className="text-gray-500 text-sm">Member</p>

                    <div className="mt-4 flex justify-center gap-2 pb-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500 text-purple-700 text-[10px] font-bold uppercase tracking-wide border border-purple-100">
                            Free Plan
                        </span>
                    </div>
                </DialogHeader>

                <ScrollArea className="h-[300px]">
                    <div className="p-6 space-y-6">
                        {/* Contact Info */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <MailIcon className="size-4 text-gray-400" />
                                    <span className="truncate">{user?.emailAddresses[0]?.emailAddress || "No email"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <CalendarIcon className="size-4 text-gray-400" />
                                    <span>Joined {formatDate(user?.createdAt?.toString())}</span>
                                </div>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Usage Statistics</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                                    <div className="text-lg font-bold text-gray-900">
                                        {loadingStats ? "..." : stats?.totalChats || 0}
                                    </div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400 mt-1">Total Chats</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                                    <div className="text-lg font-bold text-gray-900">
                                        {loadingStats ? "..." : stats?.timeSaved || "0"}
                                    </div>
                                    <div className="text-[10px] uppercase font-bold text-gray-400 mt-1">Time Saved</div>
                                </div>
                            </div>
                        </div>

                        {/* Settings & Preferences */}
                        <div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Preferences</h4>
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-3 px-2 h-9 font-medium text-gray-600 hover:text-gray-900"
                                    onClick={() => {
                                        onClose(); 
                                        setIsNameModalOpen(true);
                                    }}
                                >
                                    <SettingsIcon className="size-4 text-gray-400" />
                                    General Settings
                                </Button>
                                <Button variant="ghost" className="w-full justify-start gap-3 px-2 h-9 font-medium text-gray-600 hover:text-gray-900">
                                    <BellIcon className="size-4 text-gray-400" />
                                    Notifications
                                </Button>
                                <Button variant="ghost" className="w-full justify-start gap-3 px-2 h-9 font-medium text-gray-600 hover:text-gray-900">
                                    <ShieldIcon className="size-4 text-gray-400" />
                                    Privacy & Security
                                </Button>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <Button
                        variant="outline"
                        className="w-full gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-100 border-gray-200"
                        onClick={handleLogout}
                    >
                        <LogOutIcon className="size-4" />
                        Log Out
                    </Button>
                </div>
            </DialogContent>

            {/* Name Change Modal */}
            <UserNameModal
                isOpen={isNameModalOpen}
                onClose={() => setIsNameModalOpen(false)}
                onNameSet={handleNameSet}
                isClosable={true}
            />
        </Dialog>
    );
}