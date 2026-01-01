import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText,
    cancelText = "Cancel",
    variant = 'default'
}: ConfirmationModalProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md border-0 bg-white shadow-2xl rounded-xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">{title}</DialogTitle>
                    <DialogDescription className="text-gray-600 mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                
                <DialogFooter className="flex flex-row gap-2 mt-4">
                    <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={onClose}
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        variant={variant === 'destructive' ? 'destructive' : 'default'}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}