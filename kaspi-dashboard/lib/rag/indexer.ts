// Автоматическая индексация данных в векторное хранилище
import { getEmbeddingService } from './embeddings'
import { getVectorStore } from './vector-store'
import { getDocumentProcessor } from './document-processor'
import { supabaseAdmin } from '../supabase/server'

export interface IndexingProgress {
    sourceTable: string
    totalDocuments: number
    indexedDocuments: number
    status: 'pending' | 'running' | 'completed' | 'failed'
    error?: string
}

export class Indexer {
    private embeddingService = getEmbeddingService()
    private vectorStore = getVectorStore()
    private documentProcessor = getDocumentProcessor()

    /**
     * Индексирует все данные
     */
    async indexAll(): Promise<IndexingProgress[]> {
        const results: IndexingProgress[] = []

        // Индексируем продукты
        results.push(await this.indexProducts())

        // Индексируем метрики
        results.push(await this.indexProductMetrics())

        // Индексируем продажи (последние 100)
        results.push(await this.indexSales(100))

        // Индексируем заказы покупателей (последние 100)
        results.push(await this.indexCustomerOrders(100))

        return results
    }

    /**
     * Индексирует продукты
     */
    async indexProducts(): Promise<IndexingProgress> {
        const sourceTable = 'products'

        try {
            // Обновляем статус
            await this.updateIndexingStatus(sourceTable, 'running')

            // Удаляем старые документы
            await this.vectorStore.deleteBySource(sourceTable)

            // Получаем документы
            const documents = await this.documentProcessor.processProducts()

            // Создаем эмбеддинги
            const contents = documents.map(d => d.content)
            const embeddings = await this.embeddingService.embedTextsInBatches(contents, 50)

            // Добавляем эмбеддинги к документам
            const docsWithEmbeddings = documents.map((doc, idx) => ({
                ...doc,
                embedding: embeddings[idx],
            }))

            // Сохраняем в векторное хранилище
            await this.vectorStore.addDocuments(docsWithEmbeddings)

            // Обновляем статус
            await this.updateIndexingStatus(sourceTable, 'completed', documents.length, documents.length)

            return {
                sourceTable,
                totalDocuments: documents.length,
                indexedDocuments: documents.length,
                status: 'completed',
            }
        } catch (error: any) {
            await this.updateIndexingStatus(sourceTable, 'failed', 0, 0, error.message)

            return {
                sourceTable,
                totalDocuments: 0,
                indexedDocuments: 0,
                status: 'failed',
                error: error.message,
            }
        }
    }

    /**
     * Индексирует метрики продуктов
     */
    async indexProductMetrics(): Promise<IndexingProgress> {
        const sourceTable = 'product_metrics'

        try {
            await this.updateIndexingStatus(sourceTable, 'running')
            await this.vectorStore.deleteBySource(sourceTable)

            const documents = await this.documentProcessor.processProductMetrics()
            const contents = documents.map(d => d.content)
            const embeddings = await this.embeddingService.embedTextsInBatches(contents, 50)

            const docsWithEmbeddings = documents.map((doc, idx) => ({
                ...doc,
                embedding: embeddings[idx],
            }))

            await this.vectorStore.addDocuments(docsWithEmbeddings)
            await this.updateIndexingStatus(sourceTable, 'completed', documents.length, documents.length)

            return {
                sourceTable,
                totalDocuments: documents.length,
                indexedDocuments: documents.length,
                status: 'completed',
            }
        } catch (error: any) {
            await this.updateIndexingStatus(sourceTable, 'failed', 0, 0, error.message)

            return {
                sourceTable,
                totalDocuments: 0,
                indexedDocuments: 0,
                status: 'failed',
                error: error.message,
            }
        }
    }

    /**
     * Индексирует продажи
     */
    async indexSales(limit: number = 100): Promise<IndexingProgress> {
        const sourceTable = 'sales'

        try {
            await this.updateIndexingStatus(sourceTable, 'running')
            await this.vectorStore.deleteBySource(sourceTable)

            const documents = await this.documentProcessor.processSales(limit)
            const contents = documents.map(d => d.content)
            const embeddings = await this.embeddingService.embedTextsInBatches(contents, 50)

            const docsWithEmbeddings = documents.map((doc, idx) => ({
                ...doc,
                embedding: embeddings[idx],
            }))

            await this.vectorStore.addDocuments(docsWithEmbeddings)
            await this.updateIndexingStatus(sourceTable, 'completed', documents.length, documents.length)

            return {
                sourceTable,
                totalDocuments: documents.length,
                indexedDocuments: documents.length,
                status: 'completed',
            }
        } catch (error: any) {
            await this.updateIndexingStatus(sourceTable, 'failed', 0, 0, error.message)

            return {
                sourceTable,
                totalDocuments: 0,
                indexedDocuments: 0,
                status: 'failed',
                error: error.message,
            }
        }
    }

    /**
     * Индексирует заказы покупателей
     */
    async indexCustomerOrders(limit: number = 100): Promise<IndexingProgress> {
        const sourceTable = 'customer_orders'

        try {
            await this.updateIndexingStatus(sourceTable, 'running')
            await this.vectorStore.deleteBySource(sourceTable)

            const documents = await this.documentProcessor.processCustomerOrders(limit)
            const contents = documents.map(d => d.content)
            const embeddings = await this.embeddingService.embedTextsInBatches(contents, 50)

            const docsWithEmbeddings = documents.map((doc, idx) => ({
                ...doc,
                embedding: embeddings[idx],
            }))

            await this.vectorStore.addDocuments(docsWithEmbeddings)
            await this.updateIndexingStatus(sourceTable, 'completed', documents.length, documents.length)

            return {
                sourceTable,
                totalDocuments: documents.length,
                indexedDocuments: documents.length,
                status: 'completed',
            }
        } catch (error: any) {
            await this.updateIndexingStatus(sourceTable, 'failed', 0, 0, error.message)

            return {
                sourceTable,
                totalDocuments: 0,
                indexedDocuments: 0,
                status: 'failed',
                error: error.message,
            }
        }
    }

    /**
     * Обновляет статус индексации
     */
    private async updateIndexingStatus(
        sourceTable: string,
        status: 'pending' | 'running' | 'completed' | 'failed',
        totalDocuments: number = 0,
        indexedDocuments: number = 0,
        errorMessage?: string
    ): Promise<void> {
        const data: any = {
            source_table: sourceTable,
            status,
            total_documents: totalDocuments,
            indexed_documents: indexedDocuments,
        }

        if (status === 'running') {
            data.started_at = new Date().toISOString()
        } else if (status === 'completed' || status === 'failed') {
            data.completed_at = new Date().toISOString()
        }

        if (errorMessage) {
            data.error_message = errorMessage
        }

        await (supabaseAdmin as any)
            .from('indexing_status')
            .upsert(data, { onConflict: 'source_table' })
    }
}

export function getIndexer(): Indexer {
    return new Indexer()
}
