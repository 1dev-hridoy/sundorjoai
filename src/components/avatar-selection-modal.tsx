import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { SyntexService } from "../lib/syntex";

// DiceBear avatar styles
const AVATAR_STYLES = [
    'adventurer', 'adventurer-neutral', 'avataaars', 'avataaars-neutral',
    'big-ears', 'big-ears-neutral', 'big-smile', 'bottts', 'bottts-neutral',
    'croodles', 'croodles-neutral', 'dicebear', 'emoji', 'female', 'gridy',
    'human', 'identicon', 'initials', 'male', 'micah', 'miniavs',
    'open-peeps', 'personas', 'pixel-art', 'pixel-art-neutral', 'shapes',
    'thumbs'
];

interface AvatarSelectionModalProps {
    isOpen: boolean;
    onClose: (updated?: boolean) => void; // Accept an optional parameter to indicate if avatar was updated
}

export default function AvatarSelectionModal({ isOpen, onClose }: AvatarSelectionModalProps) {
    const { user, isSignedIn } = useUser();
    const [selectedAvatarStyle, setSelectedAvatarStyle] = useState(user?.unsafeMetadata?.avatarStyle as string || 'micah');
    const [isUpdating, setIsUpdating] = useState(false);

    const handleAvatarStyleChange = (style: string) => {
        setSelectedAvatarStyle(style);
    };

    const handleSaveAvatar = async () => {
        if (!user || !isSignedIn) return;

        setIsUpdating(true);
        try {
            // Update user's avatar style in Clerk's unsafe metadata
            await user.update({
                unsafeMetadata: {
                    ...user.unsafeMetadata,
                    avatarStyle: selectedAvatarStyle
                }
            });
            
            // Also update in the backend if needed
            await SyntexService.updateUserProfile({ avatarStyle: selectedAvatarStyle });
            
            toast.success("Avatar updated successfully!");
            
            // Close the modal and indicate that the avatar was updated
            onClose(true);
        } catch (error) {
            console.error("Failed to update avatar style:", error);
            toast.error("Failed to update avatar. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = () => {
        setSelectedAvatarStyle(user?.unsafeMetadata?.avatarStyle as string || 'micah');
        onClose(false); // Indicate that the avatar was not updated
    };

    if (!isSignedIn) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose(false)}>
            <DialogContent className="sm:max-w-md border-0 bg-white shadow-2xl rounded-xl p-6">
                <DialogHeader className="text-left">
                    <DialogTitle className="text-2xl font-bold text-gray-900">Select Avatar</DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Choose your preferred avatar style
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex justify-center">
                        <Avatar className="h-20 w-20">
                            <AvatarImage
                                src={`https://api.dicebear.com/6.x/${selectedAvatarStyle}/svg?seed=${user?.firstName || user?.emailAddresses[0]?.emailAddress || 'user'}`}
                                alt="Selected avatar"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-2xl font-bold">
                                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.emailAddresses[0]?.emailAddress ? user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase() : "U"}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <h4 className="text-sm font-medium text-gray-700 mb-2">Select Avatar Style</h4>
                    <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2">
                        {AVATAR_STYLES.map((style) => (
                            <div
                                key={style}
                                className={`flex flex-col items-center cursor-pointer p-1 rounded ${selectedAvatarStyle === style ? 'bg-purple-100 border border-purple-300' : 'hover:bg-gray-100'}`}
                                onClick={() => handleAvatarStyleChange(style)}
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src={`https://api.dicebear.com/6.x/${style}/svg?seed=${user?.firstName || user?.emailAddresses[0]?.emailAddress || 'user'}`}
                                        alt={style}
                                    />
                                    <AvatarFallback className="text-xs">
                                        {style.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-[8px] mt-1 text-center truncate w-full">{style}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 pt-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleCancel}
                        disabled={isUpdating}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="default"
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        onClick={handleSaveAvatar}
                        disabled={isUpdating}
                    >
                        {isUpdating ? "Saving..." : "Save Avatar"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}