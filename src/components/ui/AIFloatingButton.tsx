import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

import { useAI } from "@/components/providers/AIProvider";

export function AIFloatingButton() {
    const { isOpen, toggleAI } = useAI();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in effect on mount
        const timer = setTimeout(() => setIsVisible(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    if (isOpen) return null;

    return (
        <button
            onClick={toggleAI}
            className={`
                fixed bottom-6 right-6 z-40 
                flex items-center justify-center 
                w-14 h-14 rounded-full 
                bg-primary text-primary-foreground 
                shadow-lg hover:shadow-xl hover:scale-105 
                transition-all duration-300 ease-in-out
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
            `}
            aria-label="Ask AI Assistant"
        >
            <div className="absolute inset-0 rounded-full bg-white opacity-0 hover:opacity-10 transition-opacity" />
            <Sparkles className="h-6 w-6 animate-pulse" />
        </button>
    );
}
