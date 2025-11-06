import React from "react";

export type Param = {
  name: string;
  in?: string;
  required?: boolean;
  schema?: { type?: string };
  description?: string;
};

export type EndpointCardProps = {
  method?: string;
  path?: string;
  summary?: string;
  description?: string;
  parameters?: Param[];
  examples?: Record<string, any>;
  requestExample?: string;
};

// ✅ Use React.FC so TypeScript automatically knows “key” exists
const EndpointCard: React.FC<EndpointCardProps> = ({
  method = "GET",
  path = "/",
  summary,
  description,
  parameters = [],
  examples,
  requestExample,
}) => {
  const methodUpper = method.toUpperCase();
  const methodColor =
    methodUpper === "GET"
      ? "text-green-600 bg-green-50"
      : methodUpper === "POST"
      ? "text-blue-600 bg-blue-50"
      : methodUpper === "PUT"
      ? "text-yellow-700 bg-yellow-50"
      : methodUpper === "DELETE"
      ? "text-red-600 bg-red-50"
      : "text-gray-700 bg-gray-100";

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm dark:bg-gray-900 dark:border-gray-700">
      <div className="flex items-start justify-between p-4">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-md ${methodColor}`}
            >
              {methodUpper}
            </span>
            <code className="text-sm text-gray-800 dark:text-gray-200 break-words">
              {path}
            </code>
          </div>
          {summary && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {summary}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        {description && (
          <div className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            {description}
          </div>
        )}

        {parameters && parameters.length > 0 && (
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-2 py-1">Name</th>
                  <th className="px-2 py-1">In</th>
                  <th className="px-2 py-1">Type</th>
                  <th className="px-2 py-1">Required</th>
                  <th className="px-2 py-1">Description</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((p: Param, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-2 align-top font-mono text-sm text-gray-800 dark:text-gray-200">
                      {p.name}
                    </td>
                    <td className="px-2 py-2 align-top text-sm text-gray-600 dark:text-gray-300">
                      {p.in || "-"}
                    </td>
                    <td className="px-2 py-2 align-top text-sm text-gray-600 dark:text-gray-300">
                      {p.schema?.type || "-"}
                    </td>
                    <td className="px-2 py-2 align-top text-sm text-gray-600 dark:text-gray-300">
                      {p.required ? "yes" : "no"}
                    </td>
                    <td className="px-2 py-2 align-top text-sm text-gray-600 dark:text-gray-300">
                      {p.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {requestExample && (
          <>
            <div className="mb-2 text-xs font-semibold text-gray-500 uppercase">
              Example request
            </div>
            <pre className="rounded-md bg-gray-50 p-3 text-xs overflow-auto dark:bg-gray-800">
              <code>{requestExample}</code>
            </pre>
          </>
        )}

        {examples && Object.keys(examples).length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Example response(s)
            </div>
            {Object.entries(examples).map(([k, v]) => (
              <details
                key={k}
                className="mb-2 rounded-md bg-gray-50 p-2 dark:bg-gray-800"
              >
                <summary className="cursor-pointer text-sm font-medium">
                  {k}
                </summary>
                <pre className="mt-2 rounded-md bg-black/5 p-3 text-xs overflow-auto dark:bg-black/30">
                  <code>{JSON.stringify(v, null, 2)}</code>
                </pre>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointCard;
