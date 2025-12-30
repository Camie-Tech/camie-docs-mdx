import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { X, Send, Sparkles, Bot, User, Maximize2, Minimize2, ExternalLink, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchVectors } from "@/lib/vector-store";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export function AIAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        const question = input;
        setInput("");
        setIsLoading(true);

        try {
            // Use Gemini 2.0 Flash via standard fetch
            const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || window.localStorage.getItem("GEMINI_API_KEY") || "YOUR_API_KEY";

            if (GEMINI_API_KEY === "YOUR_API_KEY") {
                throw new Error("Gemini API Key missing. Please provide VITE_GEMINI_API_KEY in your .env file.");
            }

            // 1. Generate Query Embedding for RAG
            const EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
            const embResponse = await fetch(EMBEDDING_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: { parts: [{ text: question }] }
                })
            });
            const embData = await embResponse.json();
            const queryVector = embData.embedding.values;

            // 2. Search Vector Index for Global Context
            const relevantDocs = await searchVectors(queryVector);
            const globalContext = relevantDocs.map(doc => `[From ${doc.path}]: ${doc.content}`).join('\n\n');

            // 3. Scrape current page context as fallback/secondary
            const currentPageContent = document.querySelector('article')?.innerText || "";

            const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

            const prompt = `
        You are a helpful AI assistant for a technical documentation site.
        Answer the user's question accurately using the provided context from across the site.
        
        GLOBAL SITE CONTEXT:
        ${globalContext}

        CURRENT VIEWED PAGE:
        ${currentPageContent.slice(0, 5000)}
        
        USER QUESTION:
        ${question}
      `;

            const response = await fetch(GEMINI_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error?.message || `API Error: ${response.status} ${response.statusText}`;
                throw new Error(errorMsg);
            }

            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that request.";

            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                role: "assistant",
                content: answer,
                timestamp: new Date(),
            }]);
        } catch (error: any) {
            console.error("AI Error:", error);

            let displayMessage = "Sorry, I'm having trouble connecting to the AI brain right now.";

            if (error.message.includes("quota") || error.message.includes("429") || error.message.includes("limit")) {
                displayMessage = "⚠️ Quota Exceeded: Your Gemini API free tier rate limit has been reached. Please wait a minute or use a different key.";
            } else if (error.message.includes("API Key")) {
                displayMessage = "🔑 API Key Missing: Please provide VITE_GEMINI_API_KEY in your .env file.";
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
                        <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`flex max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"} items-start gap-3`}>
                                <div className={`p-2 rounded-full ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${m.role === "user"
                                    ? "bg-primary/10 text-foreground rounded-tr-none"
                                    : "bg-muted/50 text-foreground rounded-tl-none border border-border"
                                    }`}>
                                    {m.content}
                                    <div className={`text-[9px] mt-1.5 opacity-50 ${m.role === "user" ? "text-right" : "text-left"}`}>
                                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
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
                            className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
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
