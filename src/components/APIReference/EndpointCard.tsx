// src/components/APIReference/EndpointCard.tsx
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Param = {
  name: string;
  in?: string;
  required?: boolean;
  schema?: { type?: string; enum?: string[]; default?: any };
  description?: string;
};

export type EndpointCardProps = {
  method?: string;
  path?: string;
  summary?: string;
  description?: string;
  parameters?: Param[];
  requestBody?: any;
  examples?: Record<string, any>;
  requestExample?: string;
};

const EndpointCard: React.FC<EndpointCardProps> = ({
  method = "GET",
  path = "/",
  summary,
  description,
  parameters = [],
  requestBody,
  examples,
  requestExample,
}) => {
  const [copiedRequest, setCopiedRequest] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);

  // Determine if we're in dark mode by checking the html class
  const isDarkMode =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const methodUpper = method.toUpperCase();

  // Method badge colors
  const methodColors: Record<string, string> = {
    GET: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PUT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    PATCH:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const methodColor = methodColors[methodUpper] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  // Copy to clipboard handler
  const copyToClipboard = (text: string, type: "request" | "response") => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "request") {
        setCopiedRequest(true);
        setTimeout(() => setCopiedRequest(false), 2000);
      } else {
        setCopiedResponse(text);
        setTimeout(() => setCopiedResponse(null), 2000);
      }
    });
  };

  // Initialize selected response
  React.useEffect(() => {
    if (examples && Object.keys(examples).length > 0 && !selectedResponse) {
      setSelectedResponse(Object.keys(examples)[0]);
    }
  }, [examples, selectedResponse]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-border rounded-lg overflow-hidden bg-card">
      {/* LEFT COLUMN: Documentation - Scrollable */}
      <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Method & Path Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase rounded ${methodColor}`}
            >
              {methodUpper}
            </span>
            <code className="text-sm font-mono text-foreground break-all">
              {path}
            </code>
          </div>

          {summary && (
            <h3 className="text-lg font-semibold text-foreground">{summary}</h3>
          )}

          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Path/Query Parameters */}
        {parameters && parameters.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Parameters
            </h4>
            <div className="space-y-3">
              {parameters.map((p: Param, i: number) => (
                <div
                  key={i}
                  className="border-l-2 border-border pl-4 py-2 space-y-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-mono text-foreground font-medium">
                      {p.name}
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {p.schema?.type || "string"}
                    </span>
                    {p.required && (
                      <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded">
                        required
                      </span>
                    )}
                    {p.in && (
                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        {p.in}
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                  {p.schema?.enum && (
                    <div className="text-xs text-muted-foreground">
                      Allowed: {p.schema.enum.join(", ")}
                    </div>
                  )}
                  {p.schema?.default !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      Default: {String(p.schema.default)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Body Schema */}
        {requestBody && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Request Body
            </h4>
            <div className="text-sm text-muted-foreground">
              {requestBody.description && <p>{requestBody.description}</p>}
              {requestBody.required && (
                <span className="inline-block mt-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded">
                  required
                </span>
              )}
            </div>
          </div>
        )}

        {/* Response Status Codes */}
        {examples && Object.keys(examples).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Responses
            </h4>
            <div className="space-y-2">
              {Object.keys(examples).map((code) => {
                const statusCode = code.split(":")[0];
                const isSuccess = statusCode.startsWith("2");
                return (
                  <div
                    key={code}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span
                      className={`font-mono font-semibold ${
                        isSuccess ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {statusCode}
                    </span>
                    <span className="text-muted-foreground">
                      {getStatusMessage(statusCode)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Code Examples - STICKY */}
      <div className="bg-muted/30 dark:bg-muted/10 p-6 space-y-4 border-l border-border lg:sticky lg:top-0 lg:self-start lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto">
        {/* Request Example */}
        {requestExample && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Example Request
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(requestExample, "request")}
                className="h-7 text-xs"
              >
                {copiedRequest ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-md overflow-hidden border border-border">
              <SyntaxHighlighter
                language="bash"
                style={isDarkMode ? vscDarkPlus : vs}
                customStyle={{
                  margin: 0,
                  padding: "1rem",
                  fontSize: "0.75rem",
                  background: isDarkMode ? "#1e1e1e" : "#f6f8fa",
                }}
              >
                {requestExample}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {/* Response Examples */}
        {examples && Object.keys(examples).length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Example Response
              </h4>
              {selectedResponse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(examples[selectedResponse], null, 2),
                      "response"
                    )
                  }
                  className="h-7 text-xs"
                >
                  {copiedResponse === JSON.stringify(examples[selectedResponse], null, 2) ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Response Tabs */}
            {Object.keys(examples).length > 1 && (
              <div className="flex gap-1 flex-wrap mb-2">
                {Object.keys(examples).map((code) => {
                  const statusCode = code.split(":")[0];
                  return (
                    <button
                      key={code}
                      onClick={() => setSelectedResponse(code)}
                      className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                        selectedResponse === code
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {statusCode}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Response Body */}
            {selectedResponse && (
              <div className="rounded-md overflow-hidden border border-border">
                <SyntaxHighlighter
                  language="json"
                  style={isDarkMode ? vscDarkPlus : vs}
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    fontSize: "0.75rem",
                    background: isDarkMode ? "#1e1e1e" : "#f6f8fa",
                  }}
                >
                  {JSON.stringify(examples[selectedResponse], null, 2)}
                </SyntaxHighlighter>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Get human-readable status message
 */
function getStatusMessage(code: string): string {
  const messages: Record<string, string> = {
    "200": "OK",
    "201": "Created",
    "204": "No Content",
    "400": "Bad Request",
    "401": "Unauthorized",
    "403": "Forbidden",
    "404": "Not Found",
    "422": "Unprocessable Entity",
    "500": "Internal Server Error",
  };
  return messages[code] || "";
}

export default EndpointCard;