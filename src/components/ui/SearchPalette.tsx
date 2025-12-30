import { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { Search, X, FileText, Hash, ChevronRight, Sparkles, CornerDownLeft, Command, Filter } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Fuse from "fuse.js";
import searchIndex from "@/data/search-index.json";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SearchResult {
    title: string;
    excerpt: string;
    path: string;
    category: "Guide" | "API" | "Changelog" | "Documentation";
    parentTitle?: string;
    content?: string;
}

export function SearchPalette({ isOpen, onClose, onAskAI }: { isOpen: boolean; onClose: () => void; onAskAI: () => void }) {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const fuse = useMemo(() => new Fuse(searchIndex, {
        keys: [
            { name: "title", weight: 0.7 },
            { name: "tagTitle", weight: 0.5 }, // For heading matches
            { name: "excerpt", weight: 0.3 },
            { name: "content", weight: 0.1 }
        ],
        threshold: 0.4,
        includeMatches: true,
        ignoreLocation: true,
        minMatchCharLength: 2
    }), []);

    const results = useMemo(() => {
        if (!query) return [];
        let searchResults = fuse.search(query).map(r => r.item as SearchResult);
        if (filter) {
            searchResults = searchResults.filter(r => r.category.toLowerCase() === filter.toLowerCase());
        }
        return searchResults.slice(0, 10);
    }, [query, filter, fuse]);

    // Dynamic filters based on indexed content
    const filters = useMemo(() => {
        const categories = Array.from(new Set(searchIndex.map(i => i.category)));
        return categories.map(cat => ({
            id: cat,
            label: cat,
            count: searchIndex.filter(i => i.category === cat).length
        })).filter(f => f.count > 0);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isOpen, query, filter]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown") {
                e.preventDefault();
                // Total items = 1 (AI button) + (query ? results.length : filters.length)
                const totalItems = 1 + (query ? results.length : filters.length);
                setSelectedIndex(prev => Math.min(prev + 1, totalItems - 1));
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            }
            if (e.key === "Enter") {
                // Logic for selecting result or filter
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, results, filters, query]);

    if (!isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]">
            {/* Background Blur Overlay (VAPI Style) */}
            <div
                className="fixed inset-0 bg-background/20 backdrop-blur-xl transition-opacity duration-300"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />

            {/* Search Palette UI */}
            <div className="relative w-full max-w-2xl bg-card/95 border border-border/50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">

                {/* Search Input Area */}
                <div className="flex items-center px-5 py-4 border-b border-border/50 bg-muted/20">
                    <Search className={cn("h-5 w-5 mr-3 transition-colors", query ? "text-primary" : "text-muted-foreground")} />
                    <input
                        autoFocus
                        ref={inputRef}
                        className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground/50 font-medium"
                        placeholder="Search documentation, guides, or ask AI..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {filter && (
                        <div className="flex items-center bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full border border-primary/20 mr-2 animate-in slide-in-from-right-2">
                            {filter}
                            <button onClick={() => setFilter(null)} className="ml-1 hover:text-primary/70"><X className="h-3 w-3" /></button>
                        </div>
                    )}
                    <div className="flex items-center space-x-1.5 ml-2">
                        <kbd className="px-1.5 py-1 rounded border border-border/50 bg-background text-[10px] font-bold text-muted-foreground shadow-sm">ESC</kbd>
                    </div>
                </div>

                <div className="max-h-[65vh] overflow-y-auto p-2 space-y-2">

                    {/* AI Search Mode - Always available as first option */}
                    <button
                        onClick={onAskAI}
                        className={cn(
                            "w-full flex items-center px-4 py-3.5 rounded-xl border transition-all duration-200 group text-left",
                            selectedIndex === 0 ? "bg-primary/10 border-primary/30 shadow-sm" : "bg-primary/5 border-primary/10 hover:bg-primary/10 hover:border-primary/20"
                        )}
                    >
                        <div className="p-2.5 rounded-lg bg-primary/10 mr-4 group-hover:scale-110 transition-transform">
                            <Sparkles className={cn("h-5 w-5 text-primary", query && "animate-pulse")} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between font-bold text-primary text-sm">
                                <span>Ask AI Assistant</span>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] uppercase tracking-tighter">Instant Answer</span>
                                    <CornerDownLeft className="h-3 w-3" />
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                                {query ? `"I can explain '${query}' based on the docs..."` : "Ask me anything about the documentation..."}
                            </div>
                        </div>
                    </button>

                    {/* Normal Search Results */}
                    {query && (
                        <div className="space-y-1 mt-4">
                            <div className="px-4 py-2 flex items-center justify-between">
                                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Documentation Results</span>
                                {results.length > 0 && <span className="text-[10px] font-medium text-muted-foreground/40">{results.length} found</span>}
                            </div>

                            {results.length > 0 ? results.map((result, i) => {
                                const isSelected = selectedIndex === i + 1;
                                return (
                                    <a
                                        key={result.path + i}
                                        href={result.path}
                                        onClick={onClose}
                                        className={cn(
                                            "group block px-4 py-3.5 rounded-xl transition-all duration-200 border",
                                            isSelected ? "bg-muted/80 border-border shadow-sm translate-x-1" : "bg-transparent border-transparent hover:bg-muted/40"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    {result.path.includes("#") ? <Hash className="h-3.5 w-3.5 text-primary/70" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground/70" />}
                                                    <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                                        {result.title}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground line-clamp-1 pl-5">
                                                    {result.excerpt}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground group-hover:border-primary/30 group-hover:text-primary/70 transition-colors uppercase tracking-tight">
                                                    {result.category}
                                                </div>
                                                {isSelected && <CornerDownLeft className="h-3.5 w-3.5 mt-2 text-primary/50 animate-in fade-in slide-in-from-right-4" />}
                                            </div>
                                        </div>
                                    </a>
                                );
                            }) : (
                                <div className="px-4 py-12 text-center">
                                    <div className="p-3 inline-block rounded-full bg-muted/30 mb-3">
                                        <Search className="h-6 w-6 text-muted-foreground/30" />
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground">No matches found for "{query}"</div>
                                    <div className="text-xs text-muted-foreground/50 mt-1">Try a different keyword or ask the AI assistant.</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Filter Search Mode - Shown when no query or specifically browsing */}
                    {!query && (
                        <div className="space-y-1 p-2">
                            <div className="px-3 py-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Filter className="h-3 w-3" /> Browsing Categories
                            </div>
                            <div className="grid grid-cols-1 gap-2 mt-2">
                                {filters.filter(f => f.count > 0).map((f, i) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFilter(f.id)}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-4 rounded-xl border transition-all duration-200 group text-left",
                                            selectedIndex === i + 1 ? "bg-muted/80 border-border shadow-sm translate-x-1" : "bg-transparent border-transparent hover:bg-muted/40 hover:border-border/30"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-lg bg-muted border border-border/50 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                                                <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{f.label}</div>
                                                <div className="text-[10px] text-muted-foreground/60 font-medium">Browse everything in {f.label.toLowerCase()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground/70">{f.count} items</span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Premium Footer */}
                <div className="bg-muted/40 px-5 py-4 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground/70 overflow-hidden select-none">
                    <div className="flex items-center space-x-6">
                        <div className="flex items-center gap-2 group cursor-help">
                            <div className="flex items-center gap-1 group-hover:translate-y-[-1px] transition-transform">
                                <kbd className="p-1 rounded bg-background border border-border shadow-[0_1px_0_0_rgba(0,0,0,0.1)]"><CornerDownLeft className="h-2.5 w-2.5" /></kbd>
                                <span className="font-bold uppercase tracking-tighter">Navigate</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <kbd className="px-1 py-0.5 rounded bg-background border border-border shadow-[0_1px_0_0_rgba(0,0,0,0.1)] font-mono">↑↓</kbd>
                                <span className="font-bold uppercase tracking-tighter">Select</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <kbd className="p-1 rounded bg-background border border-border shadow-[0_1px_0_0_rgba(0,0,0,0.1)] font-bold text-[8px]"><Command className="h-2.5 w-2.5" /></kbd>
                                <span className="font-bold uppercase tracking-tighter items-center flex gap-0.5">Focus <Hash className="h-2" />Sections</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 group transition-colors">
                        <span className="font-black italic text-primary/40 group-hover:text-primary/70 transition-colors tracking-tighter uppercase ml-2 text-[9px] flex items-center gap-1">
                            Camie Docs Engine
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(content, document.body);
}
