import vectorIndex from "@/data/vector-index.json";

export interface VectorItem {
    title: string;
    path: string;
    content: string;
    vector: number[];
}

function cosineSimilarity(vecA: number[], vecB: number[]) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchVectors(queryVector: number[], topN = 3): Promise<VectorItem[]> {
    try {
        // Use the imported index (Vite bundles this automatically)
        const typedIndex = vectorIndex as VectorItem[];

        const results = typedIndex.map(item => ({
            ...item,
            similarity: cosineSimilarity(queryVector, item.vector)
        }));

        // Sort by similarity and take top N
        return results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topN);
    } catch (error) {
        console.error("Vector Search Error:", error);
        return [];
    }
}
