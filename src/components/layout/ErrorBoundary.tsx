import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-card border border-destructive/20 rounded-2xl shadow-sm animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-4 rounded-full bg-destructive/10 mb-6">
                        <AlertCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                    <p className="text-muted-foreground mb-8 max-w-md">
                        The documentation engine encountered an unexpected error. This might be due to a malformed MDX file or a temporary glitch.
                    </p>

                    {this.state.error && (
                        <div className="w-full text-left bg-muted p-4 rounded-lg mb-8 overflow-auto max-h-[200px]">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 font-mono">Error Detail</div>
                            <pre className="text-xs text-destructive/80 font-mono whitespace-pre-wrap">
                                {this.state.error.message}
                            </pre>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => window.location.reload()}
                            variant="default"
                            className="gap-2"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Try Again
                        </Button>
                        <Button
                            variant="outline"
                            asChild
                            className="gap-2"
                        >
                            <a href="/">
                                <Home className="h-4 w-4" />
                                Go Home
                            </a>
                        </Button>
                    </div>

                    <div className="mt-12 text-[10px] text-muted-foreground/60">
                        TraceID: {Math.random().toString(36).substring(7).toUpperCase()}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
