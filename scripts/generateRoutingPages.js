import fs from "fs";
import path from "path";

/**
 * Generates routing code for all .mdx files in the content directory.
 * The route path will be /docs/<folder>/<filename>.
 */
export function generateRoutingPages(contentDir = "src/content") {
  const routes = [];

  // Recursively walk through the content folder
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (file.endsWith(".mdx")) {
        const relativePath = path.relative(contentDir, fullPath);
        const pathParts = relativePath.split(path.sep);
        const fileName = path.basename(file, ".mdx");
        // Get the full folder path, not just the first folder
        const folderPath = pathParts.slice(0, -1).join('/');

        // Build the import path (e.g. "@/content/getting-started/test/new.mdx")
        const importPath = `@/${path
          .join("content", relativePath)
          .replace(/\\/g, "/")}`;

        // Build the route path (e.g. "/getting-started/test/new" or "/manual" for root files)
        const routePath = folderPath 
          ? `/${folderPath}/${fileName}` 
          : `/${fileName}`;

        // Convert filename to valid JavaScript identifier (camelCase)
        const componentName = fileName
          .split('-')
          .map((word, index) => 
            index === 0 
              ? word.charAt(0).toUpperCase() + word.slice(1)
              : word.charAt(0).toUpperCase() + word.slice(1)
          )
          .join('');

        routes.push({ importPath, routePath, componentName });
      }
    }
  }

  walkDir(contentDir);

  // Build the full routing file
  const imports = routes
    .map((r) => `import ${r.componentName} from "${r.importPath}";`)
    .join("\n");

  const routeElements = routes
    .map(
      (r) => `<Route path="${r.routePath}" element={<${r.componentName} />} />`
    )
    .join("\n          ");

  const output = `
// AUTO-GENERATED FILE — do not edit manually

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DocLayout } from "@/components/layout/DocLayout";
import navigation from "@/content/meta.json";
${imports}

export function SystemRoutes() {
  return (
    <Router>
      <DocLayout navigation={navigation.navigation}>
        <Routes>
          ${routeElements}
        </Routes>
      </DocLayout>
    </Router>
  );
}
`;

  fs.writeFileSync("src/SystemRoutes.jsx", output);
  console.log("✅ SystemRoutes.jsx generated successfully!");
}

generateRoutingPages();
