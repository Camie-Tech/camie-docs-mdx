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

  const isDarkMode =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const methodUpper = method.toUpperCase();

  // Method badge colors - VAPI style
  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    PUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    PATCH: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
    DELETE: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
  };

  const methodColor = methodColors[methodUpper] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

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

  React.useEffect(() => {
    if (examples && Object.keys(examples).length > 0 && !selectedResponse) {
      setSelectedResponse(Object.keys(examples)[0]);
    }
  }, [examples, selectedResponse]);

  return (
    // 🎯 VAPI STYLE: No outer border, minimal rounded corners, better spacing
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-background">
      {/* LEFT COLUMN: Documentation */}
      <div className="p-8 space-y-8 border-r border-border/50">
        {/* Method & Path Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold uppercase rounded-md ${methodColor}`}
            >
              {methodUpper}
            </span>
            <code className="text-sm font-mono text-foreground/80 break-all">
              {path}
            </code>
          </div>

          {summary && (
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {summary}
            </h1>
          )}

          {description && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Authentication Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Authentication
          </h3>
          <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-mono text-xs bg-background px-2 py-1 rounded border border-border/50">
                Authorization
              </span>
              {" "}Bearer
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Retrieve your API Key from Dashboard.
            </p>
          </div>
        </div>

        {/* Query Parameters */}
        {parameters && parameters.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Query Parameters
            </h3>
            <div className="space-y-4">
              {parameters.map((p: Param, i: number) => (
                <div
                  key={i}
                  className="border-l-2 border-primary/20 pl-4 space-y-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-mono text-foreground font-semibold">
                      {p.name}
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {p.schema?.type || "string"}
                    </span>
                    {p.required && (
                      <span className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md border border-red-500/20">
                        required
                      </span>
                    )}
                    {!p.required && (
                      <span className="text-xs text-muted-foreground">
                        Optional
                      </span>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>
                  )}
                  {p.schema?.enum && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Allowed values:</span>{" "}
                      {p.schema.enum.map((val, idx) => (
                        <code
                          key={idx}
                          className="bg-muted px-1.5 py-0.5 rounded mx-1"
                        >
                          {val}
                        </code>
                      ))}
                    </div>
                  )}
                  {p.schema?.default !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Default:</span>{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded">
                        {String(p.schema.default)}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Body */}
        {requestBody && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Request Body
            </h3>
            <div className="bg-muted/30 border border-border/50 rounded-lg p-4">
              {requestBody.description && (
                <p className="text-sm text-muted-foreground">
                  {requestBody.description}
                </p>
              )}
              {requestBody.required && (
                <span className="inline-block mt-2 text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded-md border border-red-500/20">
                  required
                </span>
              )}
            </div>
          </div>
        )}

        {/* Response Codes */}
        {examples && Object.keys(examples).length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Responses
            </h3>
            <div className="space-y-2">
              {Object.keys(examples).map((code) => {
                const statusCode = code.split(":")[0];
                const isSuccess = statusCode.startsWith("2");
                return (
                  <div
                    key={code}
                    className="flex items-center gap-3 text-sm p-2 rounded-md hover:bg-muted/30"
                  >
                    <span
                      className={`font-mono font-bold text-lg ${
                        isSuccess
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
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
      <div className="bg-muted/5 p-8 space-y-6 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto">
        {/* Request Example */}
        {requestExample && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Example Request
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(requestExample, "request")}
                className="h-8 text-xs hover:bg-background"
              >
                {copiedRequest ? (
                  <>
                    <Check className="w-3 h-3 mr-1.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-lg overflow-hidden border border-border/50 shadow-sm">
              <SyntaxHighlighter
                language="bash"
                style={isDarkMode ? vscDarkPlus : vs}
                customStyle={{
                  margin: 0,
                  padding: "1.25rem",
                  fontSize: "0.8rem",
                  background: isDarkMode ? "#0d0d0d" : "#fafafa",
                  lineHeight: "1.6",
                }}
              >
                {requestExample}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {/* Response Examples */}
        {examples && Object.keys(examples).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
                  className="h-8 text-xs hover:bg-background"
                >
                  {copiedResponse ===
                  JSON.stringify(examples[selectedResponse], null, 2) ? (
                    <>
                      <Check className="w-3 h-3 mr-1.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Response Status Tabs */}
            {Object.keys(examples).length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {Object.keys(examples).map((code) => {
                  const statusCode = code.split(":")[0];
                  const isSuccess = statusCode.startsWith("2");
                  return (
                    <button
                      key={code}
                      onClick={() => setSelectedResponse(code)}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md border transition-all ${
                        selectedResponse === code
                          ? isSuccess
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                          : "bg-background text-muted-foreground border-border/50 hover:border-border"
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
              <div className="rounded-lg overflow-hidden border border-border/50 shadow-sm">
                <SyntaxHighlighter
                  language="json"
                  style={isDarkMode ? vscDarkPlus : vs}
                  customStyle={{
                    margin: 0,
                    padding: "1.25rem",
                    fontSize: "0.8rem",
                    background: isDarkMode ? "#0d0d0d" : "#fafafa",
                    lineHeight: "1.6",
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
