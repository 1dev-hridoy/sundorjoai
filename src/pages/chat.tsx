import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { ChatSession } from "../components/chat-sidebar";
import ChatSidebar from "../components/chat-sidebar";
import type { Message } from "../components/chat-area";
import ChatArea from "../components/chat-area";
import UserProfileModal from "../components/user-profile-modal";
import UserNameModal from "../components/user-name-modal";
import { SyntexService } from "../lib/syntex";
import { useUser } from "@clerk/clerk-react";
import { Skeleton } from "../components/ui/skeleton";

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function Chat() {
    const navigate = useNavigate();
    const { chatId } = useParams();
    const [searchParams] = useSearchParams();
    const initialPrompt = searchParams.get("initialPrompt");

    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isNameModalOpen, setIsNameModalOpen] = useState(false);

    // State for sessions
    const [sessions, setSessions] = useState<ChatSession[]>([]);

    // We derive current session from URL or state, but state is easier to sync with weird routing
    // Let's keep a local state for the *active* visual session, but sync it with URL
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(chatId || null);

    // State for messages
    const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
    const [isTyping, setIsTyping] = useState(false);

    // Check authentication
    const { user, isLoaded: isUserLoaded } = useUser();
    const isLoading = !isUserLoaded;
    const needsName = user && !user.firstName && !user.lastName; 
    
   

    
    const [initialPromptProcessed, setInitialPromptProcessed] = useState(false);

  
    const initialLoadRef = useRef(false);
    const sessionLoadRef = useRef(false);


    

    const handleNewChat = async (shouldNavigate = true): Promise<string> => {

        const newSessionId = generateId();
        const newSession: ChatSession = {
            id: newSessionId,
            title: "New Chat",
            date: "Just now",
            createdAt: new Date().toISOString()
        };

      
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSessionId);

     
        const initialMessages: Message[] = [{
            id: generateId(),
            role: 'ai',
            content: "Hi! I'm SundorjoAI. Describe your app idea.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];

        setMessagesMap(prev => ({
            ...prev,
            [newSessionId]: initialMessages
        }));

        if (shouldNavigate) {
            navigate(`/chat/${newSessionId}`);
        }

        return newSessionId;
    };

 
    const handleSendMessage = async (content: string, file?: File, explicitSessionId?: string) => {

        const targetSessionId = explicitSessionId || currentSessionId;

      
        if (!targetSessionId) {
            console.warn("Attempted to send message without a session ID");
            return;
        }

        // Check if user needs to set a name before chatting
        if (needsName) {
            setIsNameModalOpen(true);
            return;
        }

        // Create display content with image preview if file exists
        let displayContent = content;
        if (file) {
            displayContent = content ? `${content}\n\n![Uploaded Image](file://${file.name})` : `![Uploaded Image](file://${file.name})`;
        }

        const userMessageId = generateId();
        const newMessage: Message = {
            id: userMessageId,
            role: "user",
            content: displayContent,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            imageUrl: file ? URL.createObjectURL(file) : undefined
        };

        // Update messages map
        setMessagesMap(prev => ({
            ...prev,
            [targetSessionId]: [...(prev[targetSessionId] || []), newMessage]
        }));

        setIsTyping(true);

        try {
            // Call AI via Backend
            const aiResponseText = await SyntexService.generateResponse(
                content,
                file || null,
                targetSessionId
            );

            const aiResponse: Message = {
                id: generateId(),
                role: "ai",
                content: aiResponseText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setMessagesMap(prev => ({
                ...prev,
                [targetSessionId]: [...(prev[targetSessionId] || []), aiResponse]
            }));

            // Update title if it's still "New Chat" and we have content to use as title
            if (sessions.some(s => s.id === targetSessionId && s.title === "New Chat") && content.trim()) {
                setSessions(prev => prev.map(s => s.id === targetSessionId && s.title === "New Chat" ? {
                    ...s,
                    title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                    date: new Date().toLocaleDateString()
                } : s));
            }

    
            


            if (!sessions.some(s => s.id === targetSessionId)) {
                const newSession: ChatSession = {
                    id: targetSessionId,
                    title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                    date: new Date().toLocaleDateString(),
                    createdAt: new Date().toISOString()
                };
                setSessions(prev => [newSession, ...prev]);
            }
        } catch (error) {
            console.error("Failed to get response:", error);
            toast.error("Failed to get response");
        } finally {
            setIsTyping(false);
        }
    };


    useEffect(() => {
        if (!isLoading && !user) {
     
            

        }
    }, [isLoading, user]);

    // Sync URL param with internal state
    useEffect(() => {
        if (chatId) {
            setCurrentSessionId(chatId);
        }
    }, [chatId]);


    useEffect(() => {
        if (!user || sessionLoadRef.current) return;
        
        sessionLoadRef.current = true;

        const loadChatSessions = async () => {
            try {
         
                const chatSessions = await SyntexService.getAllChats();
                setSessions(chatSessions);


                if (chatId) {
                    setCurrentSessionId(chatId);
                } else if (!initialPrompt && chatSessions.length > 0) {
                    // No ID in URL, no prompt -> Load first available
                    navigate(`/chat/${chatSessions[0].id}`, { replace: true });
                } else if (!initialPrompt && chatSessions.length === 0) {
      
                    



                    const newId = await handleNewChat(false);
                    navigate(`/chat/${newId}`, { replace: true });
                }
            } catch (error) {
                console.error("Failed to load chat sessions:", error);
               
                const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
                const isRateLimitError = axiosError.response?.status === 429 || 
                    (axiosError.response?.data?.error && axiosError.response.data.error.includes('Too many requests'));
                
                if (!initialPrompt && !isRateLimitError) {
                    const newId = await handleNewChat(false);
                    navigate(`/chat/${newId}`, { replace: true });
                } else if (isRateLimitError) {
                    console.warn("Rate limit hit when loading chat sessions, not creating new chat automatically");
                    // Show a user-friendly message
                    toast.error("Server is busy. Please try again in a moment.");
                }
            }
        };

        loadChatSessions();
    }, [user, chatId, initialPrompt, navigate]); 


    useEffect(() => {
        if (!user || !chatId) return;

        const loadChatMessages = async () => {
            try {
             
                
                if (!messagesMap[chatId]) {
                    const chatMessages = await SyntexService.getChatMessages(chatId);
                    
                 
                    

                    const formattedMessages: Message[] = chatMessages.map((msg: { id?: string; role?: 'user' | 'ai'; content?: string; message?: string; timestamp?: string; imageUrl?: string }) => ({
                        id: msg.id || generateId(),
                        role: (msg.role === 'user' || msg.role === 'ai') ? msg.role : 'ai',
                        content: msg.content || msg.message || '',
                        timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        imageUrl: msg.imageUrl
                    }));

                    setMessagesMap(prev => ({
                        ...prev,
                        [chatId]: formattedMessages
                    }));
                }
            } catch (error) {
                console.error(`Failed to load messages for chat ${chatId}:`, error);
            
                setMessagesMap(prev => ({
                    ...prev,
                    [chatId]: []
                }));
            }
        };

        loadChatMessages();
    }, [chatId, user, messagesMap]);


    useEffect(() => {
        if (initialPrompt && !initialPromptProcessed && user && !initialLoadRef.current) {
            initialLoadRef.current = true;
            
            const processInitialPrompt = async () => {
                setInitialPromptProcessed(true);
                // Create a new chat for this prompt
                const newId = await handleNewChat(false);

                // Update URL to the new ID, cleaning query param
                navigate(`/chat/${newId}`, { replace: true });

                // Send the message
                await handleSendMessage(initialPrompt, undefined, newId);
            };
            processInitialPrompt();
        }
    }, [initialPrompt, initialPromptProcessed, user, navigate, handleSendMessage]);


    const handleDeleteChat = async (id: string) => {
        try {
            // Delete the chat from the backend
            await SyntexService.deleteChat(id);
            
            // Remove from local state
            const updatedSessions = sessions.filter(session => session.id !== id);
            setSessions(updatedSessions);

            const remainingMessages = Object.fromEntries(
                Object.entries(messagesMap).filter(([key]) => key !== id)
            );
            setMessagesMap(remainingMessages);

            if (currentSessionId === id || chatId === id) {
                if (updatedSessions.length > 0) {
                    navigate(`/chat/${updatedSessions[0].id}`);
                } else {
                    const newId = await handleNewChat(false);
                    navigate(`/chat/${newId}`);
                }
            }

            toast.success("Chat deleted successfully");
        } catch (error) {
            console.error("Failed to delete chat:", error);
            toast.error("Failed to delete chat");
        }
    };


    // Function to regenerate an AI response
    const handleRegenerateResponse = async (aiMessageId: string, userMessage: Message, explicitSessionId?: string) => {
        const targetSessionId = explicitSessionId || currentSessionId;

        if (!targetSessionId) {
            console.warn("Attempted to regenerate message without a session ID");
            return;
        }

        // Check if user needs to set a name before chatting
        if (needsName) {
            setIsNameModalOpen(true);
            return;
        }

        // Find the index of the AI message to replace
        const messages = messagesMap[targetSessionId] || [];
        const aiMessageIndex = messages.findIndex(msg => msg.id === aiMessageId);
        
        if (aiMessageIndex === -1) {
            console.warn("AI message not found for regeneration");
            return;
        }

        // Remove the old AI response and mark as regenerating
        const updatedMessages = [...messages];
        updatedMessages[aiMessageIndex] = {
            ...updatedMessages[aiMessageIndex],
            content: "Regenerating...",
            role: "ai"
        };
        
        setMessagesMap(prev => ({
            ...prev,
            [targetSessionId]: updatedMessages
        }));

        setIsTyping(true);

        try {
            // Call AI via Backend
            const aiResponseText = await SyntexService.generateResponse(
                userMessage.content,
                null, 
                targetSessionId
            );

            const newAiResponse: Message = {
                id: aiMessageId,
                role: "ai",
                content: aiResponseText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

          
            
            const finalMessages = [...updatedMessages];
            finalMessages[aiMessageIndex] = newAiResponse;

            setMessagesMap(prev => ({
                ...prev,
                [targetSessionId]: finalMessages
            }));

        } catch (error) {
            console.error("Failed to regenerate response:", error);
            toast.error("Failed to regenerate response");

            // Revert to original message
            setMessagesMap(prev => ({
                ...prev,
                [targetSessionId]: messages
            }));
        } finally {
            setIsTyping(false);
        }
    };

    // Function to handle message rating
    const handleMessageRating = async (messageId: string, rating: 'like' | 'dislike') => {
        const currentSessionIdValue = currentSessionId;
        if (!currentSessionIdValue) return;

        // Check if user needs to set a name before chatting
        if (needsName) {
            setIsNameModalOpen(true);
            return;
        }

        // Update the message with the rating
        setMessagesMap(prev => {
            const sessionMessages = prev[currentSessionIdValue] || [];
            const updatedMessages = sessionMessages.map(msg => {
                if (msg.id === messageId) {
                    if (rating === 'like') {
                        return {
                            ...msg,
                            isLiked: true,
                            isDisliked: false
                        };
                    } else {
                        return {
                            ...msg,
                            isLiked: false,
                            isDisliked: true
                        };
                    }
                }
                return msg;
            });

            return {
                ...prev,
                [currentSessionIdValue]: updatedMessages
            };
        });

        
        toast.success(`Message ${rating === 'like' ? 'liked' : 'disliked'}`);
    };


    const handleNameModalClose = () => {
        if (needsName) {
            // Don't close the modal if user still needs to set a name
            toast.error("Please set your name to continue chatting");
            return;
        }
        setIsNameModalOpen(false);
    };

    // Handle name set from modal - now using Clerk's user update
    const handleNameSet = (name: string) => {
        // Clerk handles user updates automatically, no need for custom setUserName
        setIsNameModalOpen(false);
    };

    const currentMessages = currentSessionId ? (messagesMap[currentSessionId] || []) : [];

    // Show skeleton loading when data is loading
    if (isLoading || (!user && isUserLoaded)) {
        return (
            <div className="flex h-screen bg-white">
                {/* Skeleton for sidebar */}
                <div className="w-64 bg-gray-50 border-r border-gray-200 hidden md:flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="mt-auto p-4">
                        <Skeleton className="h-12 w-full rounded-full" />
                    </div>
                </div>
                
                {/* Skeleton for chat area */}
                <div className="flex-1 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <Skeleton className="h-8 w-1/3" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="flex gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-20 w-3/4" />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Skeleton className="h-20 w-3/4" />
                            <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                        <div className="flex gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-20 w-3/4" />
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-200">
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white">
            <ChatSidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                onNewChat={() => handleNewChat(true)}
                onSelectChat={(id) => navigate(`/chat/${id}`)}
                onDeleteChat={handleDeleteChat}
                onProfileClick={() => setIsProfileModalOpen(true)}
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
            />
            <ChatArea
                messages={currentMessages}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                onOpenSidebar={() => setIsMobileSidebarOpen(true)}
                onRegenerateMessage={handleRegenerateResponse}
                onMessageRating={handleMessageRating}
                userAvatarStyle={user?.imageUrl || undefined}
                userUsername={user?.firstName || user?.username || undefined}
                userEmail={user?.primaryEmailAddress?.emailAddress}
            />
            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />
            <UserNameModal
                isOpen={isNameModalOpen}
                onClose={handleNameModalClose}
                onNameSet={handleNameSet}
            />
        </div>
    );
}