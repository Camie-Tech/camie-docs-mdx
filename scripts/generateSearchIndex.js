// scripts/generateSearchIndex.js
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = "src/content";
const OUTPUT_FILE = "src/data/search-index.json";

function generateSearchIndex() {
    const items = [];

    if (!fs.existsSync(CONTENT_DIR)) {
        console.log(`⚠️ Content directory ${CONTENT_DIR} not found. Skipping search index generation.`);
        return;
    }

    function walk(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                walk(fullPath);
            } else if (file.endsWith(".mdx")) {
                const content = fs.readFileSync(fullPath, "utf8");
                const { data, content: body } = matter(content);

                const relativePath = path.relative(CONTENT_DIR, fullPath);
                // Normalize route path: remove extension and /index, ensure leading slash
                let routePath = "/" + relativePath.replace(/\.mdx$/, "").replace(/index$/, "").replace(/\/$/, "");
                if (routePath === "") routePath = "/";

                // Add main page entry
                items.push({
                    title: data.title || path.basename(file, ".mdx"),
                    excerpt: body.slice(0, 150).replace(/[#*`]/g, "").trim() + "...",
                    path: routePath,
                    category: getCategory(relativePath),
                    content: body.slice(0, 1000) // Keep some content for better matching
                });

                // Split body into sections by headings for more granular search
                const sections = body.split(/^#+ /m).filter(s => s.trim().length > 0);
                sections.forEach(section => {
                    const lines = section.split("\n");
                    const title = lines[0].trim();
                    const rest = lines.slice(1).join("\n");
                    if (title) {
                        items.push({
                            title: title,
                            excerpt: rest.slice(0, 100).replace(/[#*`]/g, "").trim() + "...",
                            path: routePath + "#" + title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
                            category: getCategory(relativePath),
                            parentTitle: data.title || path.basename(file, ".mdx")
                        });
                    }
                });
            }
        }
    }

    function getCategory(relativePath) {
        const part = relativePath.split(/[\\\/]/)[0];

        // All categories are now derived dynamically from the folder name

        // Dynamic fallback: convert kebab-case or snake_case to Title Case
        return part
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    if (!fs.existsSync("src/data")) fs.mkdirSync("src/data", { recursive: true });

    walk(CONTENT_DIR);

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(items, null, 2));
    console.log(`✅ Search index generated with ${items.length} items!`);
}

generateSearchIndex();
