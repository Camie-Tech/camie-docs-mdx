import fs from "fs";
import path from "path";

function generateRoutingPages(contentDir = "src/content", apiPagesDir = "pages/api-reference") {
  const routes = [];

  // Scan content directory for MDX files
  function walkContentDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkContentDir(fullPath);
      } else if (file.endsWith(".mdx")) {
        const relativePath = path.relative(contentDir, fullPath);
        const pathParts = relativePath.split(path.sep);
        const fileName = path.basename(file, ".mdx");
        const folderPath = pathParts.slice(0, -1).join("/");

        const importPath = `@/${path
          .join("content", relativePath)
          .replace(/\\/g, "/")}`;

        const routePath = folderPath
          ? `/${folderPath}/${fileName}`
          : `/${fileName}`;

        let componentName = (folderPath ? `${folderPath}/${fileName}` : fileName)
          .replace(/[\/\\]/g, "_")
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .split(/[-_]/)
          .filter(word => word.length > 0)
          .map((word, index) =>
            word.charAt(0).toUpperCase() + word.slice(1)
          )
          .join("");

        if (/^[0-9]/.test(componentName)) {
          componentName = `Component${componentName}`;
        }

        routes.push({ importPath, routePath, componentName });
      }
    }
  }

  // Scan API pages directory for generated endpoint pages
  function walkAPIDir(dir) {
    if (!fs.existsSync(dir)) {
      console.log("⚠️  No API pages directory found, skipping...");
      return;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (file === "endpoints-metadata.json") {
        continue; // Skip metadata file
      }

      if (stat.isDirectory()) {
        walkAPIDir(fullPath);
      } else if (file.endsWith(".tsx")) {
        const relativePath = path.relative(apiPagesDir, fullPath);
        const fileName = path.basename(file, ".tsx");

        const importPath = `@/pages/api-reference/${relativePath.replace(/\\/g, "/")}`;
        const routePath = `/api-reference/${fileName}`;

        let componentName = fileName
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .split("_")
          .filter(word => word.length > 0)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join("");

        if (/^[0-9]/.test(componentName)) {
          componentName = `API${componentName}`;
        }

        routes.push({ importPath, routePath, componentName });
      }
    }
  }

  walkContentDir(contentDir);
  walkAPIDir(apiPagesDir);

  const imports = routes
    .map((r) => `import ${r.componentName} from "${r.importPath}";`)
    .join("\n");

  const routeElements = routes
    .map(
      (r) => `<Route path="${r.routePath}" element={<${r.componentName} />} />`
    )
    .join("\n          ");

  // 🔥 FIX: Use @/content/meta.json instead of relative path
  const output = `
// AUTO-GENERATED FILE – do not edit manually
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

  // Detect output path based on where we're running from
  const cwd = process.cwd();
  const isInSrcDir = cwd.endsWith('/src') || cwd.endsWith('\\src');
  const outputPath = isInSrcDir ? "SystemRoutes.jsx" : "src/SystemRoutes.jsx";

  fs.writeFileSync(outputPath, output);
  console.log(`✅ SystemRoutes.jsx generated with ${routes.length} routes!`);
  console.log(`📝 Output: ${path.resolve(outputPath)}`);
}

generateRoutingPages();