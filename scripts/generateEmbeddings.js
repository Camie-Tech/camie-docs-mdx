import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();

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
    const response = await fetch(EMBEDDING_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            content: { parts: [{ text }] }
        })
    });
    const data = await response.json();
    return data.embedding.values;
}

async function main() {
    if (!GEMINI_API_KEY) {
        console.warn("⚠️ Warning: GEMINI_API_KEY environment variable is missing. Skipping embedding generation.");
        console.warn("   This means the AI assistant will use existing vectors or have limited site-wide context.");
        return;
    }

    console.log(`🚀 Starting embedding generation for ${itemsToEmbed.length} items...`);
    const vectorIndex = [];

    for (const item of itemsToEmbed) {
        try {
            console.log(`- Generating embedding for: ${item.title} (${item.path})`);
            // We combine title and content for better context in embeddings
            const textToEmbed = `Title: ${item.title}\nContent: ${item.content}`;
            const vector = await generateEmbedding(textToEmbed);

            vectorIndex.push({
                title: item.title,
                path: item.path,
                content: item.content,
                vector: vector
            });
        } catch (error) {
            console.error(`❌ Failed to generate embedding for ${item.title}:`, error);
        }
    }

    const outputPath = path.join(__dirname, '../src/data/vector-index.json');
    fs.writeFileSync(outputPath, JSON.stringify(vectorIndex, null, 2));
    console.log(`✅ Success! Vector index saved to ${outputPath}`);
}

main();
