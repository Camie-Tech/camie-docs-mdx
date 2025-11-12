// scripts/generateAPIPages.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENAPI_PATH = path.join(__dirname, "..", "src", "data", "openapi.json");
const API_OUTPUT_DIR = path.join(__dirname, "..", "src", "pages", "api-reference");

/**
 * Generate individual page files for each API endpoint
 * FULLY DYNAMIC - works with any OpenAPI spec
 */
function generateAPIPages() {
  console.log("🔄 Generating individual API endpoint pages...");

  // Check if openapi.json exists
  if (!fs.existsSync(OPENAPI_PATH)) {
    console.log("⚠️  No openapi.json found, skipping API page generation");
    return { endpoints: [], groupedEndpoints: {} };
  }

  // Read and parse OpenAPI spec
  let openapi;
  try {
    const content = fs.readFileSync(OPENAPI_PATH, "utf8");
    openapi = JSON.parse(content);
  } catch (e) {
    console.error("❌ Error parsing openapi.json:", e.message);
    return { endpoints: [], groupedEndpoints: {} };
  }

  // Create output directory
  fs.mkdirSync(API_OUTPUT_DIR, { recursive: true });

  const endpoints = [];
  const groupedEndpoints = {};
  const usedFilenames = new Set(); // Prevent collisions

  // Extract base URL from servers
  const baseUrl = openapi.servers?.[0]?.url || "https://api.example.com";

  // Process each path and method
  for (const [pathStr, methods] of Object.entries(openapi.paths || {})) {
    for (const [method, def] of Object.entries(methods)) {
      // Only process HTTP methods
      const methodLower = method.toLowerCase();
      if (!["get", "post", "put", "patch", "delete", "head", "options"].includes(methodLower)) {
        continue;
      }

      const methodUpper = method.toUpperCase();
      
      // Get tags (dynamic - uses whatever exists in spec)
      const tags = def.tags && def.tags.length > 0 ? def.tags : ["General"];
      const primaryTag = tags[0]; // Use first tag for primary grouping

      // Generate unique, safe filename
      const { fileName, componentName } = generateSafeNames(
        methodLower,
        pathStr,
        def.operationId,
        usedFilenames
      );

      // Extract parameters
      const parameters = def.parameters || [];
      const requestBody = def.requestBody;
      const responses = def.responses || {};

      // Extract examples from responses (handles multiple content types)
      const examples = extractExamples(responses);

      // Build request example (dynamic based on spec)
      const requestExample = buildRequestExample(
        methodUpper,
        baseUrl,
        pathStr,
        requestBody,
        openapi.components?.securitySchemes
      );

      // Generate component file
      const componentCode = generateEndpointComponent({
        componentName,
        method: methodUpper,
        path: pathStr,
        summary: def.summary || `${methodUpper} ${pathStr}`,
        description: def.description,
        parameters,
        requestBody,
        examples,
        requestExample,
      });

      const filePath = path.join(API_OUTPUT_DIR, fileName);
      fs.writeFileSync(filePath, componentCode);

      const endpoint = {
        method: methodUpper,
        path: pathStr,
        summary: def.summary || `${methodUpper} ${pathStr}`,
        description: def.description,
        operationId: def.operationId,
        tags: tags, // Store all tags
        primaryTag,
        fileName,
        componentName,
        routePath: `/api-reference/${fileName.replace(".tsx", "")}`,
      };

      endpoints.push(endpoint);

      // Group by primary tag (dynamic grouping)
      if (!groupedEndpoints[primaryTag]) {
        groupedEndpoints[primaryTag] = [];
      }
      groupedEndpoints[primaryTag].push(endpoint);
    }
  }

  console.log(`✅ Generated ${endpoints.length} API endpoint pages`);
  console.log(`📁 Categories: ${Object.keys(groupedEndpoints).join(", ")}`);
  console.log(`📂 Output: ${API_OUTPUT_DIR}`);

  // Save metadata for meta.json generation
  const metadataPath = path.join(API_OUTPUT_DIR, "endpoints-metadata.json");
  fs.writeFileSync(
    metadataPath,
    JSON.stringify({ endpoints, groupedEndpoints }, null, 2)
  );

  return { endpoints, groupedEndpoints };
}

/**
 * Generate safe, unique filenames and component names
 * Prevents collisions and handles edge cases
 */
function generateSafeNames(method, pathStr, operationId, usedFilenames) {
  let fileName;
  let componentName;

  // Strategy 1: Use operationId if available (best practice)
  if (operationId) {
    const safeOpId = operationId
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .toLowerCase();
    fileName = `${method}-${safeOpId}.tsx`;
    componentName = operationId
      .replace(/[^a-zA-Z0-9]/g, "_")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  } else {
    // Strategy 2: Generate from path
    const safePath = pathStr
      .replace(/^\//, "") // Remove leading slash
      .replace(/\{([^}]+)\}/g, "_$1_") // {id} → _id_
      .replace(/[^a-zA-Z0-9_-]/g, "-") // Replace special chars
      .replace(/-+/g, "-") // Collapse multiple dashes
      .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

    fileName = `${method}-${safePath}.tsx`;
    componentName = `${method}_${safePath}`
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .split("_")
      .filter((word) => word.length > 0)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }

  // Handle collisions by adding hash
  if (usedFilenames.has(fileName)) {
    const hash = crypto.createHash("md5").update(pathStr + method).digest("hex").substring(0, 6);
    fileName = fileName.replace(".tsx", `-${hash}.tsx`);
    componentName = `${componentName}_${hash}`;
  }

  // Ensure component name is valid JavaScript identifier
  if (/^[0-9]/.test(componentName)) {
    componentName = `Endpoint${componentName}`;
  }

  usedFilenames.add(fileName);

  return { fileName, componentName };
}

/**
 * Extract examples from responses - handles multiple content types
 */
function extractExamples(responses) {
  const examples = {};

  for (const [code, resp] of Object.entries(responses)) {
    try {
      const content = resp.content || {};
      
      // Try to find any content type with examples
      for (const [contentType, mediaType] of Object.entries(content)) {
        // Prefer application/json but accept others
        if (mediaType.example) {
          examples[code] = { 
            data: mediaType.example,
            contentType 
          };
          break;
        } else if (mediaType.examples) {
          // Handle multiple examples
          for (const [exampleKey, exampleObj] of Object.entries(mediaType.examples)) {
            const exampleData = exampleObj.value || exampleObj;
            examples[`${code}:${exampleKey}`] = { 
              data: exampleData,
              contentType 
            };
          }
          break;
        } else if (mediaType.schema) {
          // Fallback: generate from schema
          examples[code] = { 
            data: generateExampleFromSchema(mediaType.schema),
            contentType 
          };
          break;
        }
      }

      // If no content, just add the response
      if (!examples[code] && !Object.keys(examples).some(k => k.startsWith(`${code}:`))) {
        examples[code] = { 
          data: resp,
          contentType: "application/json" 
        };
      }
    } catch (e) {
      // Graceful fallback
      examples[code] = { 
        data: { message: "Example not available" },
        contentType: "application/json"
      };
    }
  }

  return examples;
}

/**
 * Build request example with dynamic auth handling
 */
function buildRequestExample(method, baseUrl, pathStr, requestBody, securitySchemes) {
  let example = `curl -X ${method} "${baseUrl}${pathStr}"`;

  // Add authentication header (dynamic based on security schemes)
  if (securitySchemes) {
    const firstScheme = Object.values(securitySchemes)[0];
    if (firstScheme?.type === "http" && firstScheme?.scheme === "bearer") {
      example += `\n  -H "Authorization: Bearer YOUR_API_KEY"`;
    } else if (firstScheme?.type === "apiKey") {
      const headerName = firstScheme.name || "X-API-Key";
      example += `\n  -H "${headerName}: YOUR_API_KEY"`;
    }
  } else {
    // Default fallback
    example += `\n  -H "Authorization: Bearer YOUR_API_KEY"`;
  }

  example += `\n  -H "Content-Type: application/json"`;

  // Add request body if exists
  if (requestBody) {
    const content = requestBody.content || {};
    const jsonContent = content["application/json"] || Object.values(content)[0];
    
    if (jsonContent) {
      let bodyData;
      if (jsonContent.example) {
        bodyData = jsonContent.example;
      } else if (jsonContent.schema) {
        bodyData = generateExampleFromSchema(jsonContent.schema);
      }

      if (bodyData) {
        const bodyStr = JSON.stringify(bodyData, null, 2);
        example += `\n  -d '${bodyStr}'`;
      }
    }
  }

  return example;
}

/**
 * Generate React component for individual endpoint
 */
function generateEndpointComponent({
  componentName,
  method,
  path,
  summary,
  description,
  parameters,
  requestBody,
  examples,
  requestExample,
}) {
  // Serialize examples properly
  const examplesStr = JSON.stringify(examples, null, 2);
  
  return `// Auto-generated API endpoint page
import React from "react";
import EndpointCard from "@/components/APIReference/EndpointCard";

export default function ${componentName}() {
  return (
    <div className="max-w-7xl mx-auto">
      <EndpointCard
        method="${method}"
        path={${JSON.stringify(path)}}
        summary={${JSON.stringify(summary)}}
        description={${JSON.stringify(description)}}
        parameters={${JSON.stringify(parameters)}}
        requestBody={${JSON.stringify(requestBody)}}
        examples={${examplesStr}}
        requestExample={${JSON.stringify(requestExample)}}
      />
    </div>
  );
}
`;
}

/**
 * Generate example from OpenAPI schema (recursive)
 */
function generateExampleFromSchema(schema) {
  if (!schema) return {};
  if (schema.example !== undefined) return schema.example;

  switch (schema.type) {
    case "object":
      if (schema.properties) {
        const example = {};
        for (const [key, prop] of Object.entries(schema.properties)) {
          example[key] = generateExampleFromSchema(prop);
        }
        return example;
      }
      return {};

    case "array":
      if (schema.items) {
        return [generateExampleFromSchema(schema.items)];
      }
      return [];

    case "string":
      return schema.enum?.[0] || schema.default || "string";

    case "number":
    case "integer":
      return schema.default !== undefined ? schema.default : 0;

    case "boolean":
      return schema.default !== undefined ? schema.default : false;

    default:
      return null;
  }
}

// Run the generator
try {
  generateAPIPages();
} catch (error) {
  console.error("❌ Error generating API pages:", error);
  process.exit(1);
}