// src/components/APIReference/APIReference.tsx
import React, { useEffect, useState } from "react";
import EndpointCard from "./EndpointCard";

type OpenApi = {
  paths: Record<
    string,
    Record<
      string,
      {
        summary?: string;
        description?: string;
        tags?: string[];
        parameters?: any[];
        requestBody?: any;
        responses?: any;
      }
    >
  >;
  tags?: { name: string; description?: string }[];
  servers?: Array<{ url: string; description?: string }>;
};

type Endpoint = {
  method: string;
  path: string;
  def: any;
};

export default function APIReference({ source }: { source?: string }) {
  const [openapi, setOpenapi] = useState<OpenApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // First try: load local JSON from src/data/openapi.json
        const mod = await import("../../data/openapi.json");
        if (!cancelled) {
          setOpenapi(mod.default ?? mod);
          setLoading(false);
          return;
        }
      } catch (_) {
        // fallback to remote fetch if local import fails
      }

      // Fallback: fetch from remote URL
      const fetchUrl = source || "/openapi.json";
      try {
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error(`Failed to fetch ${fetchUrl}: ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setOpenapi(json);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load OpenAPI JSON");
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading API reference…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <h3 className="font-semibold mb-2">Error loading API</h3>
        <pre className="text-sm whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  if (!openapi) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No API definition found.
      </div>
    );
  }

  // Extract base URL from servers if available
  const baseUrl = openapi.servers?.[0]?.url || "https://api.example.com";

  // Group endpoints by tag
  const grouped: Record<string, Endpoint[]> = {};
  for (const path of Object.keys(openapi.paths || {})) {
    const methods = openapi.paths[path];
    for (const method of Object.keys(methods)) {
      const def = methods[method];
      const tags = def.tags?.length ? def.tags : ["General"];
      for (const tag of tags) {
        if (!grouped[tag]) grouped[tag] = [];
        grouped[tag].push({ method, path, def });
      }
    }
  }

  return (
    <div className="space-y-12">
      {/* API Overview Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold mb-2">API Reference</h1>
        <p className="text-muted-foreground">
          Complete reference documentation for all available endpoints.
        </p>
        {baseUrl && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium">Base URL:</span>
            <code className="text-sm bg-muted px-2 py-1 rounded">{baseUrl}</code>
          </div>
        )}
      </div>

      {/* Grouped Endpoints */}
      {Object.keys(grouped).map((tag) => (
        <section key={tag} className="space-y-6">
          <div className="border-b border-border pb-3">
            <h2 className="text-2xl font-semibold">{tag}</h2>
            {openapi.tags?.find((t) => t.name === tag)?.description && (
              <p className="text-muted-foreground mt-1">
                {openapi.tags.find((t) => t.name === tag)?.description}
              </p>
            )}
          </div>

          <div className="space-y-8">
            {grouped[tag].map((ep) => {
              const parameters = ep.def.parameters ?? [];
              const responses = ep.def.responses || {};
              const requestBody = ep.def.requestBody;

              // Extract response examples
              const examples: Record<string, any> = {};
              for (const [code, resp] of Object.entries(responses)) {
                try {
                  const content = (resp as any).content || {};
                  const appJson = content["application/json"] || {};
                  if (appJson.example) {
                    examples[code] = appJson.example;
                  } else if (appJson.examples) {
                    for (const [k, v] of Object.entries(appJson.examples)) {
                      examples[`${code}:${k}`] = (v as any).value ?? v;
                    }
                  } else if (appJson.schema) {
                    examples[code] = appJson.schema;
                  } else {
                    examples[code] = resp;
                  }
                } catch {
                  examples[code] = resp;
                }
              }

              // Build example request
              const methodUpper = ep.method.toUpperCase();
              let requestExample = `curl -X ${methodUpper} "${baseUrl}${ep.path}"`;
              
              // Add headers
              requestExample += `\n  -H "Authorization: Bearer YOUR_API_KEY"`;
              requestExample += `\n  -H "Content-Type: application/json"`;

              // Add request body if exists
              if (requestBody) {
                const bodyContent = requestBody.content?.["application/json"];
                if (bodyContent?.example) {
                  requestExample += `\n  -d '${JSON.stringify(bodyContent.example, null, 2)}'`;
                } else if (bodyContent?.schema) {
                  // Generate example from schema
                  const exampleBody = generateExampleFromSchema(bodyContent.schema);
                  requestExample += `\n  -d '${JSON.stringify(exampleBody, null, 2)}'`;
                }
              }

              return (
                <EndpointCard
                  key={`${ep.path}:${ep.method}`}
                  method={ep.method}
                  path={ep.path}
                  summary={ep.def.summary}
                  description={ep.def.description}
                  parameters={parameters}
                  requestBody={requestBody}
                  examples={examples}
                  requestExample={requestExample}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Generate example JSON from OpenAPI schema
 */
function generateExampleFromSchema(schema: any): any {
  if (!schema) return {};

  if (schema.example) return schema.example;

  if (schema.type === "object" && schema.properties) {
    const example: any = {};
    for (const [key, prop] of Object.entries(schema.properties)) {
      const propSchema = prop as any;
      if (propSchema.example !== undefined) {
        example[key] = propSchema.example;
      } else if (propSchema.type === "string") {
        example[key] = propSchema.enum?.[0] || "string";
      } else if (propSchema.type === "number" || propSchema.type === "integer") {
        example[key] = 0;
      } else if (propSchema.type === "boolean") {
        example[key] = false;
      } else if (propSchema.type === "array") {
        example[key] = [];
      } else if (propSchema.type === "object") {
        example[key] = generateExampleFromSchema(propSchema);
      }
    }
    return example;
  }

  if (schema.type === "array" && schema.items) {
    return [generateExampleFromSchema(schema.items)];
  }

  return {};
}