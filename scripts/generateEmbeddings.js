import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import search index
const searchIndex = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../src/data/search-index.json'), 'utf8')
);

// Filter out items without substantial content (to save tokens and focus on main content)
const itemsToEmbed = searchIndex.filter(item => item.content && item.content.length > 50);

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const EMBEDDING_URL = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;

async function generateEmbedding(text) {
    try {
        const response = await fetch(EMBEDDING_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: { parts: [{ text }] }
            })
        });
        const data = await response.json();

        if (!response.ok) {
            console.error(`❌ API Error (${response.status}):`, JSON.stringify(data, null, 2));
            return null;
        }

        if (!data.embedding || !data.embedding.values) {
            console.error("❌ Unexpected API Response Format:", JSON.stringify(data, null, 2));
            return null;
        }

        return data.embedding.values;
    } catch (error) {
        console.error("❌ Network or Parsing Error:", error.message);
        return null;
    }
}

async function main() {
    if (!GEMINI_API_KEY) {
        console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is missing. Skipping embedding generation.");
        console.warn("   This means the AI assistant will use existing vectors or have limited site-wide context.");
        return;
    }

    console.log(`🚀 Starting embedding generation for ${itemsToEmbed.length} items...`);

    // Load existing cache from content directory (persists with client's repo)
    const cachePath = path.join(__dirname, '../src/content/.embedding-cache.json');
    let embeddingCache = {};
    if (fs.existsSync(cachePath)) {
        try {
            embeddingCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            console.log(`📦 Loaded cache with ${Object.keys(embeddingCache).length} entries`);
        } catch (e) {
            console.warn("⚠️ Failed to load embedding cache, starting fresh.");
        }
    }

    const vectorIndex = [];
    let newEmbeddingsCount = 0;
    let cachedEmbeddingsCount = 0;

    // Import crypto for hashing
    const crypto = await import('crypto');

    for (const item of itemsToEmbed) {
        try {
            // Generate Content Hash
            const textToEmbed = `Title: ${item.title}\nContent: ${item.content}`;
            const hash = crypto.createHash('md5').update(textToEmbed).digest('hex');

            let vector;

            // Check Cache
            if (embeddingCache[item.path] && embeddingCache[item.path].hash === hash) {
                // Cache Hit
                vector = embeddingCache[item.path].vector;
                cachedEmbeddingsCount++;
                // console.log(`- Cached: ${item.title}`); // Optional: reduce noise
            } else {
                // Cache Miss - Generate New Embedding
                console.log(`- Generating API Embedding for: ${item.title}`);
                vector = await generateEmbedding(textToEmbed);

                // Add delay to respect rate limits
                if (vector) await new Promise(resolve => setTimeout(resolve, 200));
                newEmbeddingsCount++;
            }

            if (vector) {
                // Add to Vector Index
                vectorIndex.push({
                    title: item.title,
                    path: item.path,
                    content: item.content,
                    vector: vector
                });

                // Update Cache
                embeddingCache[item.path] = {
                    hash: hash,
                    vector: vector
                };
            }
        } catch (error) {
            console.error(`❌ Failed processing ${item.title}:`, error);
        }
    }

    // Save Vector Index
    const outputPath = path.join(__dirname, '../src/data/vector-index.json');
    fs.writeFileSync(outputPath, JSON.stringify(vectorIndex, null, 2));

    // Save Cache
    fs.writeFileSync(cachePath, JSON.stringify(embeddingCache, null, 2));

    console.log(`✅ Embedding Generation Complete.`);
    console.log(`   - Total Items: ${itemsToEmbed.length}`);
    console.log(`   - New/Regenerated: ${newEmbeddingsCount}`);
    console.log(`   - Cached: ${cachedEmbeddingsCount}`);
    console.log(`   - Index saved to ${outputPath}`);
    console.log(`   - Cache saved to ${cachePath}`);
}

main();
