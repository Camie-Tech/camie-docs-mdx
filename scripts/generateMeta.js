// scripts/generateMeta.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, "..", "src", "content");
const META_OUTPUT = path.join(CONTENT_DIR, "meta.json");

/**
 * Generate meta.json from content directory structure
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

  // If existing meta.json has navigation, use it as-is
  if (existingMeta?.navigation && Array.isArray(existingMeta.navigation)) {
    console.log("✅ Using navigation from cloned repository");
    console.log(`📁 Found ${existingMeta.navigation.length} navigation sections`);
    return;
  }

  // Otherwise, generate from directory structure
  console.log("📂 Scanning content directory for MDX files...");

  if (!fs.existsSync(CONTENT_DIR)) {
    console.log("⚠️  Content directory not found, creating default meta.json");
    const defaultMeta = createDefaultMeta();
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    fs.writeFileSync(META_OUTPUT, JSON.stringify(defaultMeta, null, 2));
    return;
  }

  const navigation = buildNavigationFromDirectory(CONTENT_DIR);

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
    navigation,
  };

  fs.writeFileSync(META_OUTPUT, JSON.stringify(meta, null, 2));
  console.log(`✅ Generated meta.json with ${navigation.length} sections`);
  console.log(`📝 Output: ${META_OUTPUT}`);
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

    // Skip meta.json and hidden files
    if (item === "meta.json" || item.startsWith(".")) {
      continue;
    }

    if (stat.isDirectory()) {
      // Directory = Section with children
      const section = buildSection(item, fullPath);
      if (section) {
        navigation.push(section);
      }
    } else if (item.endsWith(".mdx")) {
      // Root-level MDX file = Single page
      const fileName = path.basename(item, ".mdx");
      navigation.push({
        title: formatTitle(fileName),
        href: `/${fileName}`,
      });
    }
  }

  // Add API Reference section if APIReference component exists
  const apiRefPath = path.join(
    __dirname,
    "..",
    "src",
    "components",
    "APIReference"
  );
  if (fs.existsSync(apiRefPath)) {
    navigation.push({
      title: "API Reference",
      href: "/api-reference",
    });
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