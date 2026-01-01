import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogContentNoClose, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner";

interface UserNameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNameSet: (name: string) => void;
    isClosable?: boolean; // New prop to determine if modal can be closed
}

export default function UserNameModal({ isOpen, onClose, onNameSet, isClosable = false }: UserNameModalProps) {
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Please enter your name");
            return;
        }

        setIsLoading(true);
        try {
            // In a real implementation, you would update the user's name in the backend
            // For now, we'll just pass the name back to the parent component
            onNameSet(name.trim());
            toast.success("Name saved successfully!");
        } catch (error) {
            toast.error("Failed to save name. Please try again.");
            console.error("Error saving name:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle closing the modal based on whether it's closable
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            if (isClosable) {
                onClose();
            } else {
                // If the user tries to close the modal, prevent it
                toast.error("Please set your name to continue chatting");
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {isClosable ? (
                <DialogContent className="sm:max-w-md border-0 bg-white shadow-2xl rounded-xl p-6">
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-2xl font-bold text-gray-900">Change Your Name</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Enter your preferred name for your profile.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Your Full Name
                            </label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                                disabled={isLoading || !name.trim()}
                            >
                                {isLoading ? "Saving..." : "Save Name"}
                            </Button>
                        </div>
                    </form>

                    <p className="text-xs text-gray-500 text-center mt-2">
                        Your name will be used to personalize your experience.
                    </p>
                </DialogContent>
            ) : (
                <DialogContentNoClose className="sm:max-w-md border-0 bg-white shadow-2xl rounded-xl p-6">
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-2xl font-bold text-gray-900">Complete Your Profile</DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Please enter your name to continue. This helps us personalize your experience.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Your Full Name
                            </label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                                disabled={isLoading || !name.trim()}
                            >
                                {isLoading ? "Saving..." : "Continue to Chat"}
                            </Button>
                        </div>
                    </form>

                    <p className="text-xs text-gray-500 text-center mt-2">
                        Your name will be used to personalize your experience.
                    </p>
                </DialogContentNoClose>
            )}
        </Dialog>
    );
}