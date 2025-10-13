import { Button } from "@/components/ui/button";
import { Search, Menu, Github, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function Header() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container flex h-14 items-center px-4">
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
              className="h-9 w-full justify-start text-muted-foreground md:w-40 lg:w-64"
            >
              <Search className="mr-2 h-4 w-4" />
              Search docs...
            </Button>
          </div>

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
