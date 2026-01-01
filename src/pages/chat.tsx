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
import { useAuth } from "../context/AuthContext";

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
    const { user, isLoading, needsName, setUserName } = useAuth();

    // Track if we have already processed the initial prompt to avoid double-sending
    const [initialPromptProcessed, setInitialPromptProcessed] = useState(false);

    // Refs to track if certain operations have been performed to prevent infinite loops
    const initialLoadRef = useRef(false);
    const sessionLoadRef = useRef(false);

    // Define handleNewChat before the useEffect that uses it
    const handleNewChat = async (shouldNavigate = true): Promise<string> => {
        // Generate a new chat ID
        const newSessionId = generateId();
        const newSession: ChatSession = {
            id: newSessionId,
            title: "New Chat",
            date: "Just now",
            createdAt: new Date().toISOString()
        };

        // Add to sessions
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSessionId);

        // Initialize messages for this chat
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

    // Define handleSendMessage before the useEffect that uses it
    const handleSendMessage = async (content: string, file?: File, explicitSessionId?: string) => {
        // Use explicit ID if provided (for initial prompt), otherwise current state
        const targetSessionId = explicitSessionId || currentSessionId;

        // If we still don't have a session ID, we can't send
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

            // Update title if it's still "New Chat" (Checking prev sessions state here might be tricky if it's stale)
            // Ideally we check the session from the callback or ref
            setSessions(prev => prev.map(s => s.id === targetSessionId && s.title === "New Chat" ? {
                ...s,
                title: content.substring(0, 30),
                date: new Date().toLocaleDateString()
            } : s));


        } catch (error) {
            console.error("Failed to get response:", error);
            toast.error("Failed to get response");
        } finally {
            setIsTyping(false);
        }
    };

    // Check authentication
    useEffect(() => {
        if (!isLoading && !user) {
            navigate("/login");
        }
    }, [isLoading, user, navigate]);

    // Sync URL param with internal state
    useEffect(() => {
        if (chatId) {
            setCurrentSessionId(chatId);
        }
    }, [chatId]);

    // Load chat sessions from the backend when user is authenticated (only once)
    useEffect(() => {
        if (!user || sessionLoadRef.current) return;
        
        sessionLoadRef.current = true;

        const loadChatSessions = async () => {
            try {
                // Fetch the user's chats from the backend
                const chatSessions = await SyntexService.getAllChats();
                setSessions(chatSessions);

                // Logic to set initial session based on URL or Data
                if (chatId) {
                    setCurrentSessionId(chatId);
                } else if (!initialPrompt && chatSessions.length > 0) {
                    // No ID in URL, no prompt -> Load first available
                    navigate(`/chat/${chatSessions[0].id}`, { replace: true });
                } else if (!initialPrompt && chatSessions.length === 0) {
                    // No sessions, start new
                    // Wait for handleNewChat to return ID before navigating
                    const newId = await handleNewChat(false);
                    navigate(`/chat/${newId}`, { replace: true });
                }
            } catch (error) {
                console.error("Failed to load chat sessions:", error);
                if (!initialPrompt) {
                    const newId = await handleNewChat(false);
                    navigate(`/chat/${newId}`, { replace: true });
                }
            }
        };

        loadChatSessions();
    }, [user, chatId, initialPrompt, navigate]); // Removed handleNewChat from dependencies to prevent infinite loop

    // Load messages for the current chat when chatId changes
    useEffect(() => {
        if (!user || !chatId) return;

        const loadChatMessages = async () => {
            try {
                // Check if we already have messages for this chat in the map
                if (!messagesMap[chatId]) {
                    // Fetch messages for this specific chat from the backend
                    const chatMessages = await SyntexService.getChatMessages(chatId);
                    
                    // Convert backend messages to our Message format if needed
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
                // Initialize with empty array if loading fails
                setMessagesMap(prev => ({
                    ...prev,
                    [chatId]: []
                }));
            }
        };

        loadChatMessages();
    }, [chatId, user, messagesMap]);

    // Handle Initial Prompt (from Home Page) - only once
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
            // In a real implementation, we would delete the chat from the backend
            // For now, just remove from local state
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
                null, // For regeneration, we're not sending a new file
                targetSessionId
            );

            const newAiResponse: Message = {
                id: aiMessageId, // Reuse the same ID
                role: "ai",
                content: aiResponseText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            // Replace the message in the array
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

        // In a real implementation, this would send the rating to the backend
        toast.success(`Message ${rating === 'like' ? 'liked' : 'disliked'}`);
    };

    // Handle name modal close - prevent closing if user doesn't have a name
    const handleNameModalClose = () => {
        if (needsName) {
            // Don't close the modal if user still needs to set a name
            toast.error("Please set your name to continue chatting");
            return;
        }
        setIsNameModalOpen(false);
    };

    // Handle name set from modal
    const handleNameSet = (name: string) => {
        setUserName(name);
        setIsNameModalOpen(false);
    };

    const currentMessages = currentSessionId ? (messagesMap[currentSessionId] || []) : [];

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
                userAvatarStyle={user?.avatarStyle}
                userUsername={user?.username}
                userEmail={user?.email}
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