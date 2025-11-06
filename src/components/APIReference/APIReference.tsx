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
        // First try: load local JSON
        const mod = await import("../../data/openapi.json");
        if (!cancelled) {
          setOpenapi(mod.default ?? mod);
          setLoading(false);
          return;
        }
      } catch (_) {
        // fallback to remote fetch
      }

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

  if (loading) return <div>Loading API reference…</div>;
  if (error) return <div style={{ color: "red", whiteSpace: "pre-wrap" }}>Error loading API: {error}</div>;
  if (!openapi) return <div>No API definition found.</div>;

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
    <div className="space-y-8">
      {Object.keys(grouped).map((tag) => (
        <section key={tag}>
          <h2 className="text-lg font-semibold mb-4">{tag}</h2>
          <div>
            {grouped[tag].map((ep) => {
              const parameters = ep.def.parameters ?? [];
              const responses = ep.def.responses || {};
              const examples: Record<string, any> = {};

              for (const [code, resp] of Object.entries(responses)) {
                try {
                  const content = (resp as any).content || {};
                  const appJson = content["application/json"] || {};
                  if (appJson.example) examples[code] = appJson.example;
                  else if (appJson.examples) {
                    for (const [k, v] of Object.entries(appJson.examples))
                      examples[`${code}:${k}`] = (v as any).value ?? v;
                  } else if (appJson.schema) examples[code] = appJson.schema;
                  else examples[code] = resp;
                } catch {
                  examples[code] = resp;
                }
              }

              const requestExample = `curl ${ep.path}\n  -H "Authorization: Bearer <token>"`;

              return (
                <EndpointCard
                  key={`${ep.path}:${ep.method}`} // ✅ React key only, not part of props
                  method={ep.method}
                  path={ep.path}
                  summary={ep.def.summary}
                  description={ep.def.description}
                  parameters={parameters}
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
