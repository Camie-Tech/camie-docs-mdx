import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { X, Send, Sparkles, Bot, User, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchVectors } from "@/lib/vector-store";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    pairId?: string; // Links user message with AI response
}

export const CodeBlock = ({
    language,
    title,
    children,
}: {
    language?: string;
    title?: string;
    children: string;
    showLineNumbers?: boolean;
}) => {
    // This component is not fully implemented in the provided snippet,
    // but it's added here as per the user's instruction.
    // A full implementation would typically involve a syntax highlighter like react-syntax-highlighter.
    return (
        <pre className="bg-gray-800 text-white p-4 rounded-md text-sm overflow-x-auto my-4">
            {title && <div className="text-gray-400 text-xs mb-2">{title}</div>}
            <code className={`language-${language || 'plaintext'}`}>
                {children}
            </code>
        </pre>
    );
};

export function AIAssistant({ isOpen, onClose, initialQuery }: { isOpen: boolean; onClose: () => void; initialQuery?: string }) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Hi, I'm an AI assistant with access to documentation. How can I help you today?",
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const hasSentInitialRef = useRef(""); // Track sent queries

    // Auto-send initial query
    useEffect(() => {
        if (isOpen && initialQuery && initialQuery !== hasSentInitialRef.current && !isLoading) {
            hasSentInitialRef.current = initialQuery;
            setInput(initialQuery); // Visual feedback
            const timer = setTimeout(() => {
                handleSend(initialQuery);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialQuery]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    // Simple markdown to HTML converter for clean formatting
    const formatMarkdown = (text: string) => {
        return text
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Headings
            .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-base mt-3 mb-1">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="font-semibold text-lg mt-4 mb-2">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="font-bold text-xl mt-4 mb-2">$1</h1>')
            // Bullet lists
            .replace(/^\* (.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
            .replace(/(<li.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1 my-2">$1</ul>')
            // Numbered lists  
            .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 mb-1">$1</li>')
            // Line breaks
            .replace(/\n\n/g, '<br/><br/>')
            .replace(/\n/g, '<br/>');
    };

    const deleteMessage = (messageId: string) => {
        setMessages((prev) => {
            const messageToDelete = prev.find((m) => m.id === messageId);
            if (!messageToDelete) return prev;

            // If deleting a user message, also delete the paired AI response
            if (messageToDelete.role === "user" && messageToDelete.pairId) {
                return prev.filter((m) => m.id !== messageId && m.id !== messageToDelete.pairId);
            }
            // If deleting an AI message, also delete the paired user message
            if (messageToDelete.role === "assistant") {
                const pairedUserMessage = prev.find((m) => m.pairId === messageId);
                if (pairedUserMessage) {
                    return prev.filter((m) => m.id !== messageId && m.id !== pairedUserMessage.id);
                }
            }
            // Fallback: just delete the single message
            return prev.filter((m) => m.id !== messageId);
        });
    };

    const handleSend = async (arg?: string | React.MouseEvent | React.KeyboardEvent) => {
        // Determine the text to send: use arg if it's a string, otherwise use input state
        let textToSend = (typeof arg === "string" ? arg : input).trim();
        if (!textToSend) return;

        // Determine if this is an "initial" auto-send to avoid duplicates
        // ... (comment out unused isInitial)

        const userMessageId = Date.now().toString();
        const userMessage: Message = {
            id: userMessageId,
            role: "user",
            content: textToSend,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput(""); // Clear input immediately
        setIsLoading(true);

        try {
            const PROJECT_ID = import.meta.env.VITE_PROJECT_ID;
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

            if (!PROJECT_ID || !BACKEND_URL) {
                console.error("Missing config:", { PROJECT_ID, BACKEND_URL });
                throw new Error("Configuration missing. Please republish the site.");
            }

            // 1. Generate Query Embedding via Proxy
            const embResponse = await fetch(`${BACKEND_URL}/api/ai/proxy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: PROJECT_ID,
                    endpoint: "embedContent",
                    payload: {
                        content: { parts: [{ text: textToSend }] }
                    }
                })
            });

            if (!embResponse.ok) {
                const errorData = await embResponse.json();
                throw new Error(errorData.error || "Failed to generate embedding");
            }

            const embData = await embResponse.json();
            const queryVector = embData.embedding?.values;

            let globalContext = "";
            if (queryVector) {
                // 2. Search Vector Index (Client-side search)
                // Note: The vector search is still client-side using the loaded vectors
                const relevantDocs = await searchVectors(queryVector);
                globalContext = relevantDocs.map(doc => `[From ${doc.path}]: ${doc.content}`).join('\n\n');
            } else {
                console.error("Failed to generate embedding", embData);
                globalContext = `No specific documentation context could be retrieved.`;
            }

            // 3. Scrape current page context
            const currentPageContent = document.querySelector('article')?.innerText || "";

            const prompt = `
        You are a helpful AI assistant for a technical documentation site.
        Answer the user's question accurately using the provided context from across the site.
        
        IMPORTANT: If the user sends a keyword or topic (e.g., "Introduction", "API"), assume they are asking for a summary or explanation of that topic. Do not say "You haven't asked a question".
        
        GLOBAL SITE CONTEXT:
        ${globalContext}

        CURRENT VIEWED PAGE:
        ${currentPageContent.slice(0, 5000)}
        
        USER QUESTION:
        ${textToSend}
      `;

            // 4. Generate Content via Proxy
            const response = await fetch(`${BACKEND_URL}/api/ai/proxy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: PROJECT_ID,
                    endpoint: "generateContent",
                    payload: {
                        contents: [{ parts: [{ text: prompt }] }]
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error || `API Error: ${response.status}`;
                throw new Error(errorMsg);
            }

            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that request.";

            const aiMessage: Message = {
                id: Date.now().toString(),
                role: "assistant",
                content: aiResponse,
                timestamp: new Date(),
            };

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === userMessageId ? { ...m, pairId: aiMessage.id } : m
                ).concat(aiMessage)
            );
        } catch (error: any) {
            console.error("AI Error:", error);

            let displayMessage = "Sorry, I'm having trouble connecting to the AI brain right now.";

            if (error.message.includes("Configuration missing")) {
                displayMessage = "⚠️ Site Configuration Missing: Please republish your project to enable AI features.";
            } else if (error.message.includes("AI not configured")) {
                displayMessage = "⚠️ AI Not Configured: The project owner needs to set a valid Gemini API key in the dashboard.";
            } else {
                displayMessage = `❌ Error: ${error.message}`;
            }

            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: displayMessage,
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const content = (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/20 backdrop-blur-[2px] z-[99998]"
                    onClick={onClose}
                />
            )}

            {/* Side Panel */}
            <div className={
                `fixed top-0 right-0 h-screen z-[99999] bg-card border-l border-border shadow-2xl transition-all duration-300 ease-in-out transform
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        ${isExpanded ? "w-full md:w-[600px]" : "w-full md:w-[400px]"}
        flex flex-col`
            }>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-md bg-primary/10">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-semibold text-sm">AI Assistant</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                    {messages.map((m) => (
                        <div key={m.id} className={`group flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`flex max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"} items-start gap-2`}>
                                <div className={`p-2 rounded-full ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${m.role === "user"
                                        ? "bg-primary/10 text-foreground rounded-tr-none"
                                        : "bg-muted/50 text-foreground rounded-tl-none border border-border"
                                        }`}>
                                        {m.role === "assistant" ? (
                                            <div
                                                className="prose prose-sm max-w-none dark:prose-invert"
                                                dangerouslySetInnerHTML={{ __html: formatMarkdown(m.content) }}
                                            />
                                        ) : (
                                            m.content
                                        )}
                                        <div className={`text-[9px] mt-1.5 opacity-50 ${m.role === "user" ? "text-right" : "text-left"}`}>
                                            {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteMessage(m.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity self-end text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-muted text-muted-foreground animate-pulse">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="flex space-x-1 p-3 bg-muted/50 rounded-2xl border border-border">
                                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce delay-75" />
                                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce delay-150" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-card">
                    <div className="relative">
                        <textarea
                            rows={1}
                            className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            placeholder="Ask a question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    return ReactDOM.createPortal(content, document.body);
}
