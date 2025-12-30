import { Button } from "@/components/ui/button";
import { Search, Menu, Github, Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { SearchPalette } from "@/components/ui/SearchPalette";
import { useAI } from "@/components/providers/AIProvider";
import { useState, useEffect } from "react";

export function Header() {
  const { isDark, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { openAI } = useAI();

  useEffect(() => {
    // ... (keep existing useEffect for K shortcut)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container flex h-14 items-center px-4">
        {/* ... (keep existing logo/menu) */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="font-bold text-xl">Docs</div>
        </div>

        <div className="flex flex-1 items-center space-x-2 justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="outline"
              className="h-9 w-full justify-start text-muted-foreground md:w-40 lg:w-64 relative group border-border hover:border-primary/50 transition-all duration-200"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4 transition-colors group-hover:text-primary" />
              <span className="inline-flex">Search docs...</span>
              <kbd className="pointer-events-none absolute right-2 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-2 h-9 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 transition-all shadow-sm"
            onClick={() => openAI()}
          >
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Ask AI</span>
          </Button>

          <SearchPalette
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onAskAI={(query) => {
              setIsSearchOpen(false);
              openAI(query);
            }}
          />

          {/* AIAssistant Removed (Global instance used) */}

          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
