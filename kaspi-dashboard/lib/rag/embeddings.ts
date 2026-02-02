// Сервис для создания эмбеддингов текста
import { OpenAIEmbeddings } from '@langchain/openai'

export interface EmbeddingConfig {
    model?: string
    apiKey?: string
}

export class EmbeddingService {
    private embeddings: OpenAIEmbeddings

    constructor(config?: EmbeddingConfig) {
        const apiKey = config?.apiKey || process.env.OPENAI_API_KEY

        if (!apiKey) {
            throw new Error('OpenAI API key is required for embeddings')
        }

        this.embeddings = new OpenAIEmbeddings({
            openAIApiKey: apiKey,
            modelName: config?.model || process.env.RAG_EMBEDDING_MODEL || 'text-embedding-3-small',
            dimensions: 1536,
        })
    }

    /**
     * Создает эмбеддинг для одного текста
     */
    async embedText(text: string): Promise<number[]> {
        try {
            const embedding = await this.embeddings.embedQuery(text)
            return embedding
        } catch (error) {
            console.error('Error creating embedding:', error)
            throw new Error(`Failed to create embedding: ${error}`)
        }
    }

    /**
     * Создает эмбеддинги для массива текстов (батч-обработка)
     */
    async embedTexts(texts: string[]): Promise<number[][]> {
        try {
            const embeddings = await this.embeddings.embedDocuments(texts)
            return embeddings
        } catch (error) {
            console.error('Error creating batch embeddings:', error)
            throw new Error(`Failed to create batch embeddings: ${error}`)
        }
    }

    /**
     * Создает эмбеддинги с ограничением размера батча
     */
    async embedTextsInBatches(
        texts: string[],
        batchSize: number = 100
    ): Promise<number[][]> {
        const results: number[][] = []

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize)
            const batchEmbeddings = await this.embedTexts(batch)
            results.push(...batchEmbeddings)

            // Небольшая задержка между батчами для избежания rate limits
            if (i + batchSize < texts.length) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }
        }

        return results
    }
}

// Singleton instance
let embeddingServiceInstance: EmbeddingService | null = null

export function getEmbeddingService(config?: EmbeddingConfig): EmbeddingService {
    if (!embeddingServiceInstance) {
        embeddingServiceInstance = new EmbeddingService(config)
    }
    return embeddingServiceInstance
}
