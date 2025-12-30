import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ErrorBoundary } from "./ErrorBoundary";
import { Search, Map, ChevronRight, CornerDownLeft } from "lucide-react";
import searchIndex from "@/data/search-index.json";
import Fuse from "fuse.js";

interface DocLayoutProps {
  children: React.ReactNode;
  navigation: any[];
  currentPage?: string;
}

export function DocLayout({
  children,
  navigation,
  currentPage,
}: DocLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar navigation={navigation} currentPage={currentPage} />
        <main className="flex-1 px-8 py-6">
          <ErrorBoundary>
            <article className="prose prose-gray max-w-none dark:prose-invert">
              {children}
            </article>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

/**
 * Intelligent 404 Component
 */
export function NotFound() {
  const path = window.location.pathname;

  // Fuzzy match suggestions
  const fuse = new Fuse(searchIndex, {
    keys: ["title", "path"],
    threshold: 0.4
  });

  const suggestions = fuse.search(path.split('/').pop() || "").slice(0, 3);

  return (
    <div className="max-w-2xl mx-auto py-20 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 inline-block rounded-3xl bg-primary/5 mb-8">
        <div className="p-4 rounded-2xl bg-primary/10">
          <Map className="h-12 w-12 text-primary animate-pulse" />
        </div>
      </div>

      <h1 className="text-5xl font-black tracking-tight mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-4">We're lost in the docs</h2>
      <p className="text-muted-foreground mb-12 text-lg">
        The page you are looking for at <code className="bg-muted px-2 py-0.5 rounded text-sm">{path}</code> doesn't exist.
      </p>

      {suggestions.length > 0 && (
        <div className="text-left bg-muted/30 border border-border/50 rounded-2xl p-6 mb-8">
          <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Search className="h-3 w-3" /> Perhaps you meant?
          </div>
          <div className="space-y-2">
            {suggestions.map(({ item }: any) => (
              <a
                key={item.path}
                href={item.path}
                className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <span className="font-bold text-sm">{item.title}</span>
                </div>
                <CornerDownLeft className="h-4 w-4 text-primary/0 group-hover:text-primary/50 transition-all opacity-0 group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        <a
          href="/"
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          Back to Home
        </a>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 rounded-xl bg-muted font-bold hover:bg-muted/80 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
