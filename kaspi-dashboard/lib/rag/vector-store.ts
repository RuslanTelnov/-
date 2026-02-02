// Интерфейс для работы с pgvector в Supabase
import { supabaseAdmin } from '../supabase/server'

export interface Document {
    id?: string
    content: string
    embedding?: number[]
    metadata?: Record<string, any>
    sourceTable?: string
    sourceId?: string
}

export interface SearchResult {
    id: string
    content: string
    metadata: Record<string, any>
    sourceTable: string
    sourceId: string
    similarity: number
}

export class VectorStore {
    /**
     * Добавляет один документ в векторное хранилище
     */
    async addDocument(doc: Document): Promise<string> {
        if (!doc.embedding) {
            throw new Error('Document must have an embedding')
        }

        const { data, error } = await (supabaseAdmin as any)
            .from('document_embeddings')
            .insert({
                content: doc.content,
                embedding: JSON.stringify(doc.embedding),
                metadata: doc.metadata || {},
                source_table: doc.sourceTable,
                source_id: doc.sourceId,
            })
            .select('id')
            .single()

        if (error) {
            console.error('Error adding document:', error)
            throw new Error(`Failed to add document: ${error.message}`)
        }

        return data.id
    }

    /**
     * Добавляет несколько документов в векторное хранилище
     */
    async addDocuments(docs: Document[]): Promise<string[]> {
        const docsToInsert = docs.map(doc => ({
            content: doc.content,
            embedding: JSON.stringify(doc.embedding),
            metadata: doc.metadata || {},
            source_table: doc.sourceTable,
            source_id: doc.sourceId,
        }))

        const { data, error } = await (supabaseAdmin as any)
            .from('document_embeddings')
            .insert(docsToInsert)
            .select('id')

        if (error) {
            console.error('Error adding documents:', error)
            throw new Error(`Failed to add documents: ${error.message}`)
        }

        return data.map((d: any) => d.id)
    }

    /**
     * Поиск похожих документов по векторному эмбеддингу
     */
    async similaritySearch(
        queryEmbedding: number[],
        options: {
            threshold?: number
            limit?: number
            filter?: Record<string, any>
        } = {}
    ): Promise<SearchResult[]> {
        const {
            threshold = 0.7,
            limit = 10,
            filter = null,
        } = options

        const { data, error } = await (supabaseAdmin as any)
            .rpc('match_documents', {
                query_embedding: JSON.stringify(queryEmbedding),
                match_threshold: threshold,
                match_count: limit,
                filter_metadata: filter,
            })

        if (error) {
            console.error('Error searching documents:', error)
            throw new Error(`Failed to search documents: ${error.message}`)
        }

        return data.map((d: any) => ({
            id: d.id,
            content: d.content,
            metadata: d.metadata,
            sourceTable: d.source_table,
            sourceId: d.source_id,
            similarity: d.similarity,
        }))
    }

    /**
     * Удаляет документы по источнику
     */
    async deleteBySource(sourceTable: string, sourceId?: string): Promise<number> {
        let query = (supabaseAdmin as any)
            .from('document_embeddings')
            .delete()
            .eq('source_table', sourceTable)

        if (sourceId) {
            query = query.eq('source_id', sourceId)
        }

        const { data, error, count } = await query

        if (error) {
            console.error('Error deleting documents:', error)
            throw new Error(`Failed to delete documents: ${error.message}`)
        }

        return count || 0
    }

    /**
     * Получает статистику по векторному хранилищу
     */
    async getStats(): Promise<{
        totalDocuments: number
        bySource: Record<string, number>
    }> {
        // Общее количество документов
        const { count: totalDocuments } = await (supabaseAdmin as any)
            .from('document_embeddings')
            .select('*', { count: 'exact', head: true })

        // Количество по источникам
        const { data: sourceStats } = await (supabaseAdmin as any)
            .from('document_embeddings')
            .select('source_table')

        const bySource: Record<string, number> = {}
        if (sourceStats) {
            sourceStats.forEach((row: any) => {
                const table = row.source_table || 'unknown'
                bySource[table] = (bySource[table] || 0) + 1
            })
        }

        return {
            totalDocuments: totalDocuments || 0,
            bySource,
        }
    }
}

// Singleton instance
let vectorStoreInstance: VectorStore | null = null

export function getVectorStore(): VectorStore {
    if (!vectorStoreInstance) {
        vectorStoreInstance = new VectorStore()
    }
    return vectorStoreInstance
}
