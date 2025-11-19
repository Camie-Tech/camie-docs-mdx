// scripts/generateMeta.js - CORRECTED VERSION
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cwd = process.cwd();
const CONTENT_DIR = path.join(cwd, "src", "content");
const API_PAGES_DIR = path.join(cwd, "src", "pages", "api-reference");
const META_OUTPUT = path.join(CONTENT_DIR, "meta.json");

console.log(`📂 Debug: cwd = ${cwd}`);
console.log(`📂 Debug: CONTENT_DIR = ${CONTENT_DIR}`);
console.log(`📂 Debug: Content exists? ${fs.existsSync(CONTENT_DIR)}`);

/**
 * 🔥 MERGE STRATEGY: Fork meta.json takes priority
 */
function mergeNavigationSections(forkNav, generatedNav) {
  if (!forkNav || forkNav.length === 0) {
    // No fork navigation, use generated
    return generatedNav;
  }

  // Create a map of fork sections by title (case-insensitive)
  const forkSectionsMap = new Map();
  forkNav.forEach(section => {
    forkSectionsMap.set(section.title.toLowerCase(), section);
  });

  // Start with fork navigation as the base
  const mergedNav = [...forkNav];

  // Add generated sections that don't exist in fork
  generatedNav.forEach(genSection => {
    const genTitleLower = genSection.title.toLowerCase();
    
    if (!forkSectionsMap.has(genTitleLower)) {
      // Section doesn't exist in fork, add it
      console.log(`✅ Adding generated section: ${genSection.title}`);
      mergedNav.push(genSection);
    } else {
      // Section exists in fork - FORK WINS, but log it
      console.log(`⚠️ Section "${genSection.title}" exists in fork meta.json - keeping fork version`);
    }
  });

  return mergedNav;
}

/**
 * Generate meta.json from content directory structure + API pages
 */
function generateMeta() {
  console.log("📄 Generating meta.json...");

  // 🔥 STEP 1: Load existing meta.json from forked repo
  let forkMeta = null;
  if (fs.existsSync(META_OUTPUT)) {
    try {
      const content = fs.readFileSync(META_OUTPUT, "utf8");
      forkMeta = JSON.parse(content);
      console.log("✅ Found existing meta.json from forked repo");
      console.log(`   - Theme: ${JSON.stringify(forkMeta.theme)}`);
      console.log(`   - Sections: ${forkMeta.navigation?.length || 0}`);
    } catch (e) {
      console.warn("⚠️ Could not parse existing meta.json");
    }
  }

  console.log("📂 Scanning content directory for MDX files...");

  if (!fs.existsSync(CONTENT_DIR)) {
    console.log("⚠️ Content directory not found, using fork meta.json or defaults");
    const defaultMeta = forkMeta || createDefaultMeta();
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    fs.writeFileSync(META_OUTPUT, JSON.stringify(defaultMeta, null, 2));
    return;
  }

  // 🔥 STEP 2: Generate navigation from cloned content
  const generatedNavigation = buildNavigationFromDirectory(CONTENT_DIR);

  // 🔥 STEP 3: Build API Reference section from generated pages
  const apiRefSection = buildAPIReferenceSection();
  if (apiRefSection) {
    generatedNavigation.push(apiRefSection);
    console.log("✅ Added API Reference to generated navigation");
  }

  // 🔥 STEP 4: MERGE fork navigation with generated navigation
  const forkNavigation = forkMeta?.navigation || [];
  const finalNavigation = mergeNavigationSections(forkNavigation, generatedNavigation);

  // Sort with priority order (Getting Started first, API Reference second)
  const sortedNav = sortNavigationSections(finalNavigation);

  // 🔥 STEP 5: Final meta.json - FORK TAKES PRIORITY
  const finalMeta = {
    theme: forkMeta?.theme || {
      primary: "#2563eb",
      secondary: "#64748b",
      accent: "#7c3aed",
    },
    branding: forkMeta?.branding || {
      title: "Documentation",
      logo: "/logo.svg",
      favicon: "/favicon.ico",
    },
    navigation: sortedNav,
  };

  fs.writeFileSync(META_OUTPUT, JSON.stringify(finalMeta, null, 2));
  console.log(`✅ Generated meta.json with ${sortedNav.length} sections`);
  console.log(`📍 Output: ${META_OUTPUT}`);
  
  // Log final navigation structure for verification
  console.log("\n📋 Final Navigation Structure:");
  sortedNav.forEach(section => {
    console.log(`   - ${section.title} (${section.children?.length || 0} items)`);
  });
}

/**
 * Sort navigation sections with Getting Started first, API Reference second
 */
function sortNavigationSections(navigation) {
  const priorityOrder = {
    "getting started": 1,
    "api reference": 2,
  };

  return navigation.sort((a, b) => {
    const aPriority = priorityOrder[a.title.toLowerCase()] || 999;
    const bPriority = priorityOrder[b.title.toLowerCase()] || 999;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    return a.title.localeCompare(b.title);
  });
}

/**
 * Build API Reference section from generated endpoint pages
 */
function buildAPIReferenceSection() {
  const metadataPath = path.join(API_PAGES_DIR, "endpoints-metadata.json");

  if (!fs.existsSync(metadataPath)) {
    console.log("⚠️ No API endpoints metadata found");
    return null;
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    const { groupedEndpoints } = metadata;

    if (!groupedEndpoints || Object.keys(groupedEndpoints).length === 0) {
      return null;
    }

    const children = Object.entries(groupedEndpoints).map(([tag, endpoints]) => {
      return {
        title: tag,
        children: endpoints.map((ep) => ({
          title: `${ep.method} ${ep.summary || ep.path}`,
          href: ep.routePath,
        })),
      };
    });

    console.log(`✅ Built API Reference with ${Object.keys(groupedEndpoints).length} categories`);

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

    if (
      item === "meta.json" ||
      item.startsWith(".") ||
      item === "api-reference.mdx"
    ) {
      continue;
    }

    if (stat.isDirectory()) {
      const section = buildSection(item, fullPath);
      if (section) {
        navigation.push(section);
      }
    } else if (item.endsWith(".mdx") && item !== "index.mdx") {
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
