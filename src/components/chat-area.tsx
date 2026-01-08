import { useRef, useState, useEffect, useCallback } from "react";
import { SendIcon, CopyIcon, ThumbsUpIcon, ThumbsDownIcon, RefreshCwIcon, PaperclipIcon, Sparkles, MenuIcon, XIcon, CheckIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { ScrollArea } from "./ui/scroll-area";
import MarkdownRenderer from "./markdown-renderer";
import { cn } from "../lib/utils";
import { SyntexService } from "../lib/syntex";
import type { AppInfo } from "../lib/syntex";

export interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
    timestamp: string;
    imageUrl?: string; // Add imageUrl for image messages
    isLiked?: boolean;
    isDisliked?: boolean;
}

interface ChatAreaProps {
    messages: Message[];
    onSendMessage: (content: string, file?: File) => void;
    isTyping?: boolean;
    thinkingStatus?: string | null;
    onOpenSidebar?: () => void;
    onRegenerateMessage?: (aiMessageId: string, userMessage: Message, explicitSessionId?: string) => void;
    onMessageRating?: (messageId: string, rating: 'like' | 'dislike') => void;
    userAvatarStyle?: string;
    userUsername?: string;
    userEmail?: string;
}

export default function ChatArea({ messages, onSendMessage, isTyping, thinkingStatus, onOpenSidebar, onRegenerateMessage, onMessageRating, userAvatarStyle, userUsername, userEmail }: ChatAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ file: File, previewUrl: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

    useEffect(() => {
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

    const appName = appInfo?.app?.name || "SundorjoAI";
    const appLogo = appInfo?.app?.branding?.logo?.svg || "https://res.cloudinary.com/dastfgrsc/image/upload/v1767163624/image_qflpno.jpg";

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSend = useCallback(() => {
        if (!input.trim() && !previewFile) return;

        onSendMessage(input, previewFile?.file || undefined);
        setInput("");
        if (previewFile) {
            URL.revokeObjectURL(previewFile.previewUrl); // Clean up object URL
            setPreviewFile(null);
        }
    }, [input, previewFile, onSendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCopy = (content: string, messageId: string) => {
        navigator.clipboard.writeText(content);
        setCopiedMessageId(messageId);
        toast.success("Message copied to clipboard");

        // Reset the copied state after 2 seconds
        setTimeout(() => {
            setCopiedMessageId(null);
        }, 2000);
    };

    // Handle file selection
    const handleFileSelect = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('File size exceeds 5MB limit');
            return;
        }


        if (previewFile) {
            URL.revokeObjectURL(previewFile.previewUrl);
        }

        const previewUrl = URL.createObjectURL(file);
        setPreviewFile({ file, previewUrl });
    }, [previewFile]);


    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }, [handleFileSelect]);


    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    // Remove preview file
    const removePreviewFile = () => {
        if (previewFile) {
            URL.revokeObjectURL(previewFile.previewUrl);
            setPreviewFile(null);
        }
    };

    return (
        <TooltipProvider>
            <div className="flex-1 flex flex-col h-full bg-white relative">
                {/* Chat Header */}
                <div className="h-16 px-4 md:px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md z-10 sticky top-0">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden -ml-2 text-gray-500"
                            onClick={onOpenSidebar}
                        >
                            <MenuIcon className="size-5" />
                        </Button>
                        <Avatar className="h-9 w-9 border border-gray-200">
                            <AvatarImage src={appLogo} alt={appName} />
                            <AvatarFallback><Sparkles className="size-4" /></AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-semibold text-gray-900 text-sm">{appName}</h2>
                            <span className="text-[10px] flex items-center gap-1.5 text-green-600 font-medium uppercase tracking-wider">
                                <span className="relative inline-flex rounded-full size-1.5 bg-green-500"></span>
                                Online
                            </span>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1">
                    {messages.length === 0 && !previewFile ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in fade-in duration-500">
                            <div className="bg-gray-50/50 p-6 rounded-full ring-1 ring-gray-900/5 shadow-sm">
                                <Avatar className="h-16 w-16 border border-gray-100 shadow-sm">
                                    <AvatarImage src={appLogo} alt={appName} className="object-cover" />
                                    <AvatarFallback><Sparkles className="size-8 text-gray-400" /></AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="max-w-md space-y-2">
                                <h3 className="text-xl font-semibold text-gray-900">Welcome to {appName}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    {appInfo?.app?.description?.short || "Your personal AI assistant. Describe your idea for an instant analysis."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                                {[
                                    { icon: "🧴", label: "Recommend a routine", prompt: "Can you recommend a daily skincare routine or workflow?" },
                                    { icon: "💡", label: "Example idea", prompt: "Explain a complex concept simply." },
                                    { icon: "✨", label: "Brainstorming", prompt: "Help me brainstorm ideas for my project." },
                                    { icon: "🚀", label: "Launch plan", prompt: "Create a launch plan for a new product." },
                                ].map((chip, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: i * 0.1 }}
                                        whileHover={{ y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onSendMessage(chip.prompt)}
                                        className="flex items-center gap-3 p-3 text-left text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-sm hover:translate-y-[-1px] transition-all duration-200"
                                    >
                                        <span className="text-lg">{chip.icon}</span>
                                        <span>{chip.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
                            <AnimatePresence initial={false}>
                                {messages.map((msg, index) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        {/* Avatar */}
                                        <Avatar className={`h-8 w-8 shrink-0 border ${msg.role === 'ai' ? 'border-gray-100 shadow-sm' : 'border-transparent bg-gray-100'}`}>
                                            {msg.role === 'ai' ? (
                                                <AvatarImage src={appLogo} alt="AI" />
                                            ) : (
                                                <AvatarImage
                                                    src={`https://api.dicebear.com/6.x/${userAvatarStyle || 'micah'}/svg?seed=${userUsername || userEmail || 'user'}`}
                                                    alt="User"
                                                />
                                            )}
                                            <AvatarFallback className={msg.role === 'user' ? 'bg-gray-900 text-white font-medium text-xs' : ''}>
                                                {msg.role === 'ai' ? 'AI' : (userUsername ? userUsername.charAt(0).toUpperCase() : userEmail ? userEmail.charAt(0).toUpperCase() : 'U')}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Message Content */}
                                        <div className={`group flex flex-col gap-1.5 min-w-0 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            {/* Meta info */}
                                            <div className="text-[10px] text-gray-400 flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="font-medium text-gray-500">{msg.role === 'ai' ? 'SundorjoAI' : 'You'}</span>
                                                <span>{msg.timestamp}</span>
                                            </div>

                                            {/* Bubble */}
                                            <div className={`px-5 py-3.5 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-tr-sm'
                                                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                                                }`}>
                                                {/* Render image if present */}
                                                {msg.imageUrl && (
                                                    <div className="mb-2">
                                                        <img
                                                            src={msg.imageUrl}
                                                            alt="Uploaded content"
                                                            className="max-w-full max-h-60 rounded-lg border border-gray-200 shadow-sm"
                                                        />
                                                    </div>
                                                )}
                                                <MarkdownRenderer content={msg.content} className={msg.role === 'user' ? 'text-gray-100' : 'text-gray-800 prose-sm'} />
                                            </div>

                                            {/* Action Buttons (Only for AI) */}
                                            {msg.role === 'ai' && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pl-1"
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg ${copiedMessageId === msg.id ? 'text-green-500' : ''
                                                                    }`}
                                                                onClick={() => handleCopy(msg.content, msg.id)}
                                                            >
                                                                {copiedMessageId === msg.id ? (
                                                                    <CheckIcon className="size-3.5" />
                                                                ) : (
                                                                    <CopyIcon className="size-3.5" />
                                                                )}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {copiedMessageId === msg.id ? 'Copied!' : 'Copy Message'}
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                                                onClick={() => {
                                                                    // Find the previous user message to use as context for regeneration
                                                                    const userMessageIndex = messages.findIndex((m, idx) =>
                                                                        m.role === 'user' && idx < index &&
                                                                        (idx === index - 1 || messages[idx + 1]?.id === msg.id)
                                                                    );
                                                                    if (userMessageIndex !== -1 && onRegenerateMessage) {
                                                                        onRegenerateMessage(msg.id, messages[userMessageIndex]);
                                                                    } else {
                                                                        toast.error("Could not find the corresponding user message for regeneration");
                                                                    }
                                                                }}
                                                            >
                                                                <RefreshCwIcon className="size-3.5" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Regenerate</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`h-7 w-7 rounded-lg ${msg.isLiked
                                                                    ? 'text-green-500 bg-green-100 hover:bg-green-100'
                                                                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                                onClick={() => onMessageRating && onMessageRating(msg.id, 'like')}
                                                            >
                                                                <ThumbsUpIcon className={`size-3.5 ${msg.isLiked ? 'fill-current' : ''}`} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Like</TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`h-7 w-7 rounded-lg ${msg.isDisliked
                                                                    ? 'text-red-500 bg-red-100 hover:bg-red-100'
                                                                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                                onClick={() => onMessageRating && onMessageRating(msg.id, 'dislike')}
                                                            >
                                                                <ThumbsDownIcon className={`size-3.5 ${msg.isDisliked ? 'fill-current' : ''}`} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Dislike</TooltipContent>
                                                    </Tooltip>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {isTyping && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex gap-4"
                                    >
                                        <Avatar className="h-8 w-8 border border-gray-100 shadow-sm">
                                            <AvatarImage src={appLogo} alt="AI" />
                                            <AvatarFallback><Sparkles className="size-4" /></AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col gap-2">
                                            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1 shadow-sm w-fit">
                                                <div className="size-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="size-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="size-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                            </div>
                                            <AnimatePresence mode="wait">
                                                <motion.p
                                                    key={thinkingStatus || "Thinking..."}
                                                    initial={{ opacity: 0, x: 5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -5 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="text-[10px] text-gray-500 font-medium ml-1 flex items-center gap-1.5"
                                                >
                                                    <Sparkles className="size-3 text-blue-500 animate-pulse" />
                                                    {thinkingStatus || "Sundorjo AI is preparing your analysis..."}
                                                </motion.p>
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </ScrollArea>

                {/* Preview file area */}
                {previewFile && (
                    <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50">
                        <div className="max-w-4xl mx-auto flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                            <img
                                src={previewFile.previewUrl}
                                alt="Preview"
                                className="w-16 h-16 object-cover rounded-md border border-gray-200"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{previewFile.file.name}</p>
                                <p className="text-xs text-gray-500">{(previewFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-gray-600"
                                onClick={removePreviewFile}
                            >
                                <XIcon className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 md:p-6 shrink-0 z-10 bg-white">
                    <div className="max-w-4xl mx-auto space-y-2">
                        {/* Drag and drop area */}
                        <div
                            className={`relative ${dragActive ? 'ring-2 ring-gray-900/5 bg-gray-50 border-2 border-dashed border-gray-300' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="relative flex items-end gap-2 bg-white rounded-xl p-2 border border-gray-200 focus-within:ring-2 focus-within:ring-gray-900/5 focus-within:border-gray-300 transition-all shadow-sm">
                                {/* File upload button */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <PaperclipIcon className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Attach File</TooltipContent>
                                </Tooltip>

                                <Textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full max-h-32 min-h-[44px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-3 bg-transparent resize-none shadow-none text-sm placeholder:text-gray-400"
                                    placeholder="Message SundorjoAI..."
                                    rows={1}
                                />

                                {/* Send Button */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            className={cn("shrink-0 shadow-sm rounded-lg transition-all", (input.trim() || previewFile) ? "bg-gray-900 hover:bg-gray-800" : "bg-gray-200 text-gray-400 hover:bg-gray-200 cursor-not-allowed")}
                                            size="icon"
                                            onClick={handleSend}
                                            disabled={!(input.trim() || previewFile)}
                                        >
                                            <SendIcon className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Send Message</TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileInput}
                            />
                        </div>

                        <p className="text-center text-[10px] text-gray-400 mt-2.5">
                            SundorjoAI may produce inaccurate information.
                        </p>
                    </div>
                </div>

                {/* Drag and drop overlay */}
                {dragActive && (
                    <div
                        className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm z-50 rounded-xl flex items-center justify-center"
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <div className="text-center p-8">
                            <PaperclipIcon className="mx-auto size-12 text-gray-400 mb-3" />
                            <p className="text-lg font-medium text-gray-700">Drop your image here</p>
                            <p className="text-sm text-gray-500">Supports JPG, PNG, WEBP up to 5MB</p>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}