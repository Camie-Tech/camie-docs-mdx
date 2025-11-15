// scripts/generateMeta.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cwd = process.cwd();

// Render runs from /opt/render/project/src/, content is at cwd/src/content/
const CONTENT_DIR = path.join(cwd, "src", "content");
const API_PAGES_DIR = path.join(cwd, "src", "pages", "api-reference");
const META_OUTPUT = path.join(CONTENT_DIR, "meta.json");

console.log(`🔍 Debug: cwd = ${cwd}`);
console.log(`🔍 Debug: CONTENT_DIR = ${CONTENT_DIR}`);
console.log(`🔍 Debug: Content exists? ${fs.existsSync(CONTENT_DIR)}`);

/**
 * Generate meta.json from content directory structure + API pages
 */
function generateMeta() {
  console.log("🔄 Generating meta.json...");

  // Check if meta.json already exists (from cloned repo)
  let existingMeta = null;
  if (fs.existsSync(META_OUTPUT)) {
    try {
      const content = fs.readFileSync(META_OUTPUT, "utf8");
      existingMeta = JSON.parse(content);
      console.log("✅ Found existing meta.json from cloned repo");
    } catch (e) {
      console.warn("⚠️  Could not parse existing meta.json, will regenerate");
    }
  }

  // If existing meta.json has navigation, check if it's manually maintained
  if (existingMeta?.navigation && Array.isArray(existingMeta.navigation)) {
    // Check if it has API Reference already structured
    const hasApiRef = existingMeta.navigation.some(
      (item) => item.title === "API Reference" && item.children
    );
    
    if (hasApiRef) {
      console.log("✅ Using manually structured navigation from cloned repository");
      return;
    }
  }

  console.log("📂 Scanning content directory for MDX files...");

  if (!fs.existsSync(CONTENT_DIR)) {
    console.log("⚠️  Content directory not found, creating default meta.json");
    const defaultMeta = createDefaultMeta();
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    fs.writeFileSync(META_OUTPUT, JSON.stringify(defaultMeta, null, 2));
    return;
  }

  const navigation = buildNavigationFromDirectory(CONTENT_DIR);

  // Add API Reference section from generated API pages
  const apiRefSection = buildAPIReferenceSection();
  if (apiRefSection) {
    // Find "Api" section and nest API Reference inside it
    const apiSectionIndex = navigation.findIndex(
      (item) => item.title.toLowerCase() === "api"
    );

    if (apiSectionIndex !== -1) {
      // Add API Reference as a child of Api section
      if (!navigation[apiSectionIndex].children) {
        navigation[apiSectionIndex].children = [];
      }
      navigation[apiSectionIndex].children.push(apiRefSection);
    } else {
      // No Api section, add API Reference as top-level
      navigation.push(apiRefSection);
    }
  }

  // Remove any standalone "api-reference.mdx" from root level
  const filteredNav = navigation.filter(
    (item) => !item.href || !item.href.includes("api-reference")
  );

  // Preserve theme and branding from existing meta.json or use defaults
  const meta = {
    theme: existingMeta?.theme || {
      primary: "#2563eb",
      secondary: "#64748b",
      accent: "#7c3aed",
    },
    branding: existingMeta?.branding || {
      title: "Documentation",
      logo: "/logo.svg",
      favicon: "/favicon.ico",
    },
    navigation: filteredNav,
  };

  fs.writeFileSync(META_OUTPUT, JSON.stringify(meta, null, 2));
  console.log(`✅ Generated meta.json with ${filteredNav.length} sections`);
  console.log(`📝 Output: ${META_OUTPUT}`);
}

/**
 * Build API Reference section from generated endpoint pages
 */
function buildAPIReferenceSection() {
  const metadataPath = path.join(API_PAGES_DIR, "endpoints-metadata.json");

  if (!fs.existsSync(metadataPath)) {
    console.log("⚠️  No API endpoints metadata found");
    return null;
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    const { groupedEndpoints } = metadata;

    if (!groupedEndpoints || Object.keys(groupedEndpoints).length === 0) {
      return null;
    }

    // Build nested structure: API Reference > Tag (Assistants, Squads, etc.) > Endpoints
    const children = Object.entries(groupedEndpoints).map(([tag, endpoints]) => {
      return {
        title: tag,
        children: endpoints.map((ep) => ({
          title: `${ep.method} ${ep.summary || ep.path}`,
          href: ep.routePath,
        })),
      };
    });

    return {
      title: "API Reference",
      children,
    };
  } catch (e) {
    console.error("❌ Error reading API metadata:", e.message);
    return null;
  }
}

/**
 * Build navigation structure from directory tree
 */
function buildNavigationFromDirectory(contentDir) {
  const navigation = [];
  const items = fs.readdirSync(contentDir);

  for (const item of items) {
    const fullPath = path.join(contentDir, item);
    const stat = fs.statSync(fullPath);

    // Skip meta.json, hidden files, and api-reference.mdx at root
    if (
      item === "meta.json" ||
      item.startsWith(".") ||
      item === "api-reference.mdx"
    ) {
      continue;
    }

    if (stat.isDirectory()) {
      // Directory = Section with children
      const section = buildSection(item, fullPath);
      if (section) {
        navigation.push(section);
      }
    } else if (item.endsWith(".mdx") && item !== "index.mdx") {
      // Root-level MDX file (except index) = Single page
      const fileName = path.basename(item, ".mdx");
      navigation.push({
        title: formatTitle(fileName),
        href: `/${fileName}`,
      });
    }
  }

  return navigation;
}

/**
 * Build a navigation section from a directory
 */
function buildSection(dirName, dirPath) {
  const children = [];
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Nested directory - recursively build subsection
      const subsection = buildSection(item, fullPath);
      if (subsection) {
        children.push(subsection);
      }
    } else if (item.endsWith(".mdx")) {
      const fileName = path.basename(item, ".mdx");
      const routePath = buildRoutePath(dirPath, fileName);
      children.push({
        title: formatTitle(fileName),
        href: routePath,
      });
    }
  }

  if (children.length === 0) {
    return null;
  }

  return {
    title: formatTitle(dirName),
    children,
  };
}

/**
 * Build route path from directory structure
 */
function buildRoutePath(dirPath, fileName) {
  const relativePath = path.relative(CONTENT_DIR, dirPath);
  if (!relativePath || relativePath === ".") {
    return `/${fileName}`;
  }
  return `/${relativePath.replace(/\\/g, "/")}/${fileName}`;
}

/**
 * Format directory/file name to human-readable title
 */
function formatTitle(name) {
  return name
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Create default meta.json when no content exists
 */
function createDefaultMeta() {
  return {
    theme: {
      primary: "#2563eb",
      secondary: "#64748b",
      accent: "#7c3aed",
    },
    branding: {
      title: "Documentation",
      logo: "/logo.svg",
      favicon: "/favicon.ico",
    },
    navigation: [
      {
        title: "Getting Started",
        children: [
          { title: "Introduction", href: "/getting-started/introduction" },
        ],
      },
    ],
  };
}

// Run the generator
try {
  generateMeta();
} catch (error) {
  console.error("❌ Error generating meta.json:", error);
  process.exit(1);
}
