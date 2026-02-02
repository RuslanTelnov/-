// Основная RAG цепочка для генерации ответов
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { getEmbeddingService } from './embeddings'
import { getVectorStore, SearchResult } from './vector-store'

export interface RAGResponse {
    answer: string
    sources: SearchResult[]
    query: string
}

export class RAGChain {
    private llm: ChatOpenAI
    private embeddingService = getEmbeddingService()
    private vectorStore = getVectorStore()

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY

        if (!apiKey) {
            throw new Error('OpenAI API key is required for RAG')
        }

        this.llm = new ChatOpenAI({
            openAIApiKey: apiKey,
            modelName: process.env.RAG_LLM_MODEL || 'gpt-4-turbo-preview',
            temperature: 0.7,
        })
    }

    /**
     * Обрабатывает запрос пользователя и генерирует ответ
     */
    async query(question: string, options?: {
        topK?: number
        threshold?: number
    }): Promise<RAGResponse> {
        const topK = options?.topK || parseInt(process.env.RAG_TOP_K || '5')
        const threshold = options?.threshold || 0.7

        // 1. Создаем эмбеддинг для вопроса
        const queryEmbedding = await this.embeddingService.embedText(question)

        // 2. Ищем релевантные документы
        const sources = await this.vectorStore.similaritySearch(queryEmbedding, {
            limit: topK,
            threshold,
        })

        if (sources.length === 0) {
            return {
                answer: 'К сожалению, я не нашел релевантной информации в базе данных для ответа на ваш вопрос. Попробуйте переформулировать вопрос или задать более конкретный.',
                sources: [],
                query: question,
            }
        }

        // 3. Формируем контекст из найденных документов
        const context = sources
            .map((doc, idx) => `[Документ ${idx + 1}]:\n${doc.content}`)
            .join('\n\n')

        // 4. Создаем промпт для LLM
        const prompt = PromptTemplate.fromTemplate(`
Ты - AI ассистент для анализа данных бизнеса МойСклад. 
Твоя задача - отвечать на вопросы пользователя на основе предоставленного контекста.

Контекст из базы данных:
{context}

Вопрос пользователя: {question}

Инструкции:
- Отвечай только на основе предоставленного контекста
- Если в контексте нет информации для ответа, честно скажи об этом
- Используй конкретные цифры и факты из контекста
- Отвечай на русском языке
- Будь кратким и по делу
- Если уместно, давай рекомендации

Ответ:`)

        const formattedPrompt = await prompt.format({
            context,
            question,
        })

        // 5. Генерируем ответ
        const response = await this.llm.invoke(formattedPrompt)

        return {
            answer: response.content as string,
            sources,
            query: question,
        }
    }

    /**
     * Генерирует ответ с учетом истории диалога
     */
    async queryWithHistory(
        question: string,
        history: Array<{ question: string; answer: string }>,
        options?: { topK?: number; threshold?: number }
    ): Promise<RAGResponse> {
        // Формируем контекст из истории
        const historyContext = history
            .map(h => `Q: ${h.question}\nA: ${h.answer}`)
            .join('\n\n')

        // Добавляем историю к вопросу для лучшего контекста
        const enhancedQuestion = history.length > 0
            ? `Предыдущий контекст диалога:\n${historyContext}\n\nТекущий вопрос: ${question}`
            : question

        return this.query(enhancedQuestion, options)
    }
}

// Singleton instance
let ragChainInstance: RAGChain | null = null

export function getRAGChain(): RAGChain {
    if (!ragChainInstance) {
        ragChainInstance = new RAGChain()
    }
    return ragChainInstance
}
