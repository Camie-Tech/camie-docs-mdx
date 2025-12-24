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
 * Generate meta.json - ONLY handles API Reference injection
 */
function generateMeta() {
  console.log("🔄 Processing meta.json...");

  // 🔥 STEP 1: Load fork's existing meta.json (this is the MASTER)
  let forkMeta = null;
  if (fs.existsSync(META_OUTPUT)) {
    try {
      const content = fs.readFileSync(META_OUTPUT, "utf8");
      forkMeta = JSON.parse(content);
      console.log("✅ Found fork's meta.json");
      console.log(`   - Theme: ${JSON.stringify(forkMeta.theme)}`);
      console.log(`   - Sections: ${forkMeta.navigation?.length || 0}`);
    } catch (e) {
      console.error("❌ Could not parse fork's meta.json:", e.message);
      process.exit(1);
    }
  } else {
    console.error("❌ Fork's meta.json not found at:", META_OUTPUT);
    console.log("⚠️  Cannot proceed without fork's meta.json");
    process.exit(1);
  }

  // 🔥 STEP 2: Build API Reference section from generated API pages
  const apiRefSection = buildAPIReferenceSection();

  if (!apiRefSection) {
    console.log("ℹ️  No API Reference endpoints to inject.");
  }

  // 🔥 STEP 3: Replace or add API Reference in fork's navigation
  let finalNavigation = [...(forkMeta.navigation || [])];

  // Find existing "API Reference" section (case-insensitive)
  const apiSectionIndex = finalNavigation.findIndex(
    (section) => section.title.toLowerCase() === "api reference"
  );

  if (apiRefSection) {
    if (apiSectionIndex !== -1) {
      // REPLACE the existing API Reference section with generated one
      finalNavigation[apiSectionIndex] = apiRefSection;
      console.log("✅ REPLACED 'API Reference' section with generated endpoints");
    } else {
      // Add API Reference as new section
      finalNavigation.push(apiRefSection);
      console.log("✅ ADDED 'API Reference' section to navigation");
    }
  } else if (apiSectionIndex !== -1) {
    // REMOVE the section if it exists but we have no endpoints
    finalNavigation.splice(apiSectionIndex, 1);
    console.log("🗑️ REMOVED 'API Reference' section because no endpoints were found");
  }

  // 🔥 STEP 4: Write final meta.json (fork's theme + updated navigation)
  const finalMeta = {
    theme: forkMeta.theme,
    branding: forkMeta.branding,
    navigation: finalNavigation,
  };

  fs.writeFileSync(META_OUTPUT, JSON.stringify(finalMeta, null, 2));
  console.log(`✅ Updated meta.json with ${finalNavigation.length} sections`);
  console.log(`📝 Output: ${META_OUTPUT}`);

  // Log final structure
  console.log("\n📋 Final Navigation Structure:");
  finalNavigation.forEach((section, index) => {
    const childCount = section.children?.length || 0;
    console.log(`   ${index + 1}. ${section.title} (${childCount} children)`);
  });
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

    console.log(`✅ Built API Reference with ${Object.keys(groupedEndpoints).length} categories and ${Object.values(groupedEndpoints).flat().length} endpoints`);

    return {
      title: "API Reference",
      children,
    };
  } catch (e) {
    console.error("❌ Error reading API metadata:", e.message);
    return null;
  }
}

// Run the generator
try {
  generateMeta();
} catch (error) {
  console.error("❌ Error generating meta.json:", error);
  process.exit(1);
}
