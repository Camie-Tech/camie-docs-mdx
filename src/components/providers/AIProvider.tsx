import React, { createContext, useContext, useState, ReactNode } from "react";
import { AIAssistant } from "@/components/ui/AIAssistant";

interface AIContextType {
    isOpen: boolean;
    openAI: (initialQuery?: string) => void;
    closeAI: () => void;
    toggleAI: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined);

    const openAI = (query?: string) => {
        if (query) setInitialQuery(query);
        setIsOpen(true);
    };

    const closeAI = () => {
        setIsOpen(false);
        // We do NOT clear initialQuery here necessarily, but AIAssistant handles it
    };

    const toggleAI = () => setIsOpen(prev => !prev);

    return (
        <AIContext.Provider value={{ isOpen, openAI, closeAI, toggleAI }}>
            {children}
            {/* Global Instance */}
            <AIAssistant
                isOpen={isOpen}
                onClose={closeAI}
                initialQuery={initialQuery}
            />
        </AIContext.Provider>
    );
}

export function useAI() {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error("useAI must be used within an AIProvider");
    }
    return context;
}
